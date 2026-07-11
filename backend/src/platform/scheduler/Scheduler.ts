import { dbClient } from '../../database/client/DatabaseClient';
import { randomUUID } from 'crypto';

export interface RetryPolicy {
  maxRetries: number;
  backoffFactor: number;
  initialDelayMs: number;
}

export interface JobPayload {
  name: string;
  payload: Record<string, any>;
  runAt: Date;
  retryPolicy?: RetryPolicy;
}

export class JobExecutor {
  private handlers: Map<string, (payload: any) => Promise<void>> = new Map();

  public registerHandler(name: string, handler: (payload: any) => Promise<void>): void {
    this.handlers.set(name, handler);
  }

  public async execute(name: string, payload: any): Promise<void> {
    const handler = this.handlers.get(name);
    if (!handler) {
      throw new Error(`No job handler registered for: ${name}`);
    }
    await handler(payload);
  }
}

export class Scheduler {
  public async schedule(job: JobPayload): Promise<string> {
    const id = randomUUID();
    await dbClient.query(
      `
      INSERT INTO platform_jobs (id, name, payload, status, retry_count, run_at)
      VALUES ($1, $2, $3, 'QUEUED', 0, $4);
    `,
      [id, job.name, JSON.stringify({ data: job.payload, policy: job.retryPolicy }), job.runAt]
    );
    return id;
  }
}

export class WorkerManager {
  private scheduler = new Scheduler();
  private executor = new JobExecutor();
  private isRunning = false;
  private pollIntervalMs = 2000;
  private pollTimeout: NodeJS.Timeout | null = null;

  public registerJobHandler(name: string, handler: (payload: any) => Promise<void>): void {
    this.executor.registerHandler(name, handler);
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.poll();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.pollTimeout) clearTimeout(this.pollTimeout);
  }

  private async poll(): Promise<void> {
    if (!this.isRunning) return;

    try {
      const rows = await dbClient.query(`
        UPDATE platform_jobs
        SET status = 'PROCESSING', updated_at = NOW()
        WHERE id = (
          SELECT id FROM platform_jobs
          WHERE status = 'QUEUED' AND run_at <= NOW()
          ORDER BY run_at ASC
          FOR UPDATE SKIP LOCKED
          LIMIT 1
        )
        RETURNING *;
      `);

      if (rows.length > 0) {
        const job = rows[0];
        await this.processJob(job);
      }
    } catch (err) {
      console.error('[WorkerManager] Job poll error:', err);
    }

    if (this.isRunning) {
      this.pollTimeout = setTimeout(() => this.poll(), this.pollIntervalMs);
    }
  }

  private async processJob(job: any): Promise<void> {
    const parsedPayload = job.payload || {};
    const data = parsedPayload.data || {};
    const policy: RetryPolicy = parsedPayload.policy || { maxRetries: 3, backoffFactor: 2, initialDelayMs: 1000 };

    try {
      await this.executor.execute(job.name, data);

      await dbClient.query(
        `
        UPDATE platform_jobs
        SET status = 'COMPLETED', updated_at = NOW()
        WHERE id = $1;
      `,
        [job.id]
      );
    } catch (err: any) {
      console.error(`[WorkerManager] Job ${job.id} failed: ${err.message}`);

      const nextRetry = job.retry_count + 1;
      if (nextRetry <= policy.maxRetries) {
        const delayMs = policy.initialDelayMs * Math.pow(policy.backoffFactor, job.retry_count);
        const runAt = new Date(Date.now() + delayMs);

        await dbClient.query(
          `
          UPDATE platform_jobs
          SET status = 'QUEUED', retry_count = $1, run_at = $2, updated_at = NOW()
          WHERE id = $3;
        `,
          [nextRetry, runAt, job.id]
        );
      } else {
        await dbClient.query(
          `
          UPDATE platform_jobs
          SET status = 'FAILED', updated_at = NOW()
          WHERE id = $1;
        `,
          [job.id]
        );
      }
    }
  }
}

export const scheduler = new Scheduler();
export const workerManager = new WorkerManager();
export default scheduler;
