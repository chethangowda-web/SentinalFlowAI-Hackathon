import { Pool, PoolClient } from 'pg';
import { config } from '../../config/config';
import { LoggerService } from '../../mastra/services/loggerService';
import { DatabaseError } from '../../core/errors/DatabaseError';

export class DatabaseClient {
  private static instance: DatabaseClient;
  private pool: Pool;
  private log: LoggerService;

  private constructor() {
    this.log = new LoggerService('DatabaseClient');

    console.log("DATABASE_URL =", config.db.url);
    console.log("SSL =", config.db.ssl);
    this.pool = new Pool({
      connectionString: config.db.url,
      max: config.db.poolSize,
      idleTimeoutMillis: config.db.idleTimeoutMillis,
      connectionTimeoutMillis: config.db.connectionTimeoutMillis,
      ssl: config.db.ssl ? { rejectUnauthorized: false } : undefined,
    });

    this.pool.on('error', (err) => {
      this.log.error(`Unexpected error on idle client: ${err.message}`);
    });
  }

  public static getInstance(): DatabaseClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new DatabaseClient();
    }
    return DatabaseClient.instance;
  }

  /**
   * Execute a parameterized query.
   */
  public async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    try {
      const result = await this.pool.query(text, params);
      return result.rows;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(`Query failed: ${msg}`, { text, params }, error);
    }
  }

  /**
   * Execute operations within a transaction.
   * If the callback throws, the transaction is automatically rolled back.
   */
  public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      const msg = error instanceof Error ? error.message : 'Unknown error';
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Transaction failed: ${msg}`, undefined, error);
    } finally {
      client.release();
    }
  }

  /**
   * Verify the database connection.
   */
  public async healthCheck(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.log.error(`Health check failed: ${msg}`);
      return false;
    }
  }

  /**
   * Gracefully close the pool.
   */
  public async close(): Promise<void> {
    this.log.info('Closing database connection pool');
    await this.pool.end();
  }
}

export const dbClient = DatabaseClient.getInstance();
