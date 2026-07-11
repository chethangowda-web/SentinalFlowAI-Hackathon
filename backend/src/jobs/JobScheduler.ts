import cron from 'node-cron';
import { LoggerService } from '../mastra/services/loggerService';
import { dbClient } from '../database/client/DatabaseClient';

export class JobScheduler {
  private log: LoggerService;

  constructor() {
    this.log = new LoggerService('JobScheduler');
  }

  public initializeJobs() {
    this.log.info('Initializing background jobs...');

    // 1. Cleanup Job: Hard delete incidents that were soft-deleted > 30 days ago
    // Runs every night at 2:00 AM
    cron.schedule('0 2 * * *', async () => {
      this.log.info('[Job] Running incident cleanup job');
      try {
        const text = `
          DELETE FROM incidents 
          WHERE deleted_at IS NOT NULL 
          AND deleted_at < NOW() - INTERVAL '30 days'
        `;
        const res = await dbClient.query(text);
        this.log.info(`[Job] Cleanup completed. Removed ${res.length} old deleted incidents.`);
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        this.log.error(`[Job] Cleanup failed: ${msg}`);
      }
    });

    // 2. Metrics Aggregation: Pre-compute dashboard stats daily (mock representation)
    // Runs every night at 3:00 AM
    cron.schedule('0 3 * * *', () => {
      this.log.info('[Job] Running daily metrics aggregation');
      // e.g. materialize views, etc.
    });

    // 3. Similarity Index Maintenance: Could trigger Qdrant re-indexing if needed
    // Runs once a week on Sunday at 4:00 AM
    cron.schedule('0 4 * * 0', () => {
      this.log.info('[Job] Running Qdrant similarity index maintenance');
      // call qdrant memory maintenance methods here if needed
    });

    // 4. Escalation Policy Checker: Checks for overdue incident escalations every minute
    cron.schedule('*/1 * * * *', async () => {
      try {
        const { notificationService } = await import('../notifications/NotificationService');
        await notificationService.processEscalations();
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        this.log.error(`[Job] Escalation check failed: ${msg}`);
      }
    });
  }
}

export const jobScheduler = new JobScheduler();
