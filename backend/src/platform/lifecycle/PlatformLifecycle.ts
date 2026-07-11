console.log("========== PLATFORM LIFECYCLE LOADED ==========");
import { dbClient } from '../../database/client/DatabaseClient';
import { webSocketGateway } from '../../realtime/gateway/WebSocketGateway';
import { LoggerService } from '../../mastra/services/loggerService';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations(): Promise<void> {
  const log = new LoggerService('Migrations');
  const migrationsDir = path.join(__dirname, '../../database/migrations');

  console.log("========== RUN MIGRATIONS ==========");
  console.log(__dirname);

  console.log(migrationsDir);
  console.log(fs.existsSync(migrationsDir));
  
  if (!fs.existsSync(migrationsDir)) {
    log.warn('[Migrations] Migrations directory not found, skipping.');
    return;
  }

  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  
  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');
    try {
      await dbClient.query(sql);
      log.info(`[Migrations] Applied: ${file}`);
    } catch (err: any) {
      // Ignore "already exists" errors
      if (err.message?.includes('already exists') || err.message?.includes('duplicate')) {
        log.info(`[Migrations] Skipped (already exists): ${file}`);
      } else {
        log.error(`[Migrations] Failed: ${file} - ${err.message}`);
        throw err;
      }
    }
  }
  log.info('[Migrations] All migrations applied successfully.');
}

async function seedIfEmpty(): Promise<void> {
  const log = new LoggerService('SeedDemo');
  try {
    const result = await dbClient.query('SELECT 1 FROM incidents LIMIT 1');
    if (result.length === 0) {
      log.info('[SeedDemo] Database is empty, seeding demo data...');
      const { seedDemoData } = await import('../../scripts/seedDemo');
      await seedDemoData();
    } else {
      log.info('[SeedDemo] Database already has data, skipping demo seed.');
    }
  } catch (err: any) {
    if (err.message?.includes('does not exist')) {
      log.info('[SeedDemo] Tables not found, will seed after migrations.');
      const { seedDemoData } = await import('../../scripts/seedDemo');
      await seedDemoData();
    } else {
      log.error(`[SeedDemo] Check failed: ${err.message}`);
    }
  }
}

export class PlatformLifecycle {
  private log = new LoggerService('PlatformLifecycle');
  private static instance: PlatformLifecycle;
  private isShutdown = false;

  private constructor() {
    this.setupGracefulShutdown();
  }

  public static getInstance(): PlatformLifecycle {
    if (!PlatformLifecycle.instance) {
      PlatformLifecycle.instance = new PlatformLifecycle();
    }
    return PlatformLifecycle.instance;
  }

  public async bootstrap(): Promise<void> {
    this.log.info('[PlatformLifecycle] Initializing SRE platform bootstrap sequence...');

    // Validate DB connectivity
    try {
      await dbClient.query('SELECT 1');
      this.log.info('[PlatformLifecycle] Database connection confirmed.');
    } catch (err: any) {
      this.log.error(`[PlatformLifecycle] Database connection check failed: ${err.message}`);
      throw err;
    }

    // Run migrations
    await runMigrations();

    // Seed demo data if empty
    await seedIfEmpty();
  }

  public async shutdown(signal: string): Promise<void> {
    if (this.isShutdown) return;
    this.isShutdown = true;
    this.log.warn(`[PlatformLifecycle] Shutdown initiated by signal ${signal}. Starting SRE teardown sequence...`);

    // Teardown WebSocket
    try {
      await webSocketGateway.shutdown();
      this.log.info('[PlatformLifecycle] WebSocket Gateway shut down successfully.');
    } catch (err: any) {
      this.log.error(`[PlatformLifecycle] Failed to shut down WebSocket Gateway: ${err.message}`);
    }

    // Teardown db pool
    try {
      await dbClient.end();
      this.log.info('[PlatformLifecycle] Database connection pool ended successfully.');
    } catch (err: any) {
      this.log.error(`[PlatformLifecycle] Failed to end database connection pool: ${err.message}`);
    }

    this.log.warn('[PlatformLifecycle] SRE platform operations teardown sequence completed.');
    process.exit(0);
  }

  private setupGracefulShutdown(): void {
    const signals = ['SIGINT', 'SIGTERM'];
    for (const signal of signals) {
      process.on(signal, () => this.shutdown(signal));
    }
  }
}

export const platformLifecycle = PlatformLifecycle.getInstance();
export default platformLifecycle;
