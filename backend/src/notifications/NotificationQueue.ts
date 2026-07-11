import { Notification, ProviderResponse } from './types';
import { ProviderFactory } from './channels/ProviderFactory';
import { notificationRepository } from '../database/repositories/NotificationRepository';
import { LoggerService } from '../mastra/services/loggerService';
import { config } from '../config/config';

export class NotificationQueue {
  private queue: Notification[] = [];
  private processing = false;
  private log = new LoggerService('NotificationQueue');
  private batchBuffer: Notification[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private batchIntervalMs = 2000; // Hold for 2 seconds to batch digests

  // Notification Metrics
  public metrics = {
    queued: 0,
    sent: 0,
    failed: 0,
    retried: 0,
    delivered: 0,
    latencySum: 0,
    latencyCount: 0,
  };

  public async enqueue(notification: Notification): Promise<void> {
    this.queue.push(notification);
    this.metrics.queued++;
    this.log.info(`[Queue] Enqueued notification ${notification.id} for channel ${notification.channel}`);
    
    // Trigger processing asynchronously
    if (!this.processing) {
      this.processNext().catch(err => {
        this.log.error(`[Queue] Error in background worker: ${err}`);
      });
    }
  }

  private async processNext(): Promise<void> {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const notification = this.queue.shift()!;

    // Buffer for batching digests
    this.batchBuffer.push(notification);
    if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => {
        this.processBatch().catch(err => {
          this.log.error(`[Queue] Failed to process batch: ${err}`);
        });
      }, this.batchIntervalMs);
    }

    // Keep processing other queued items in parallel/sequentially
    setImmediate(() => {
      this.processNext().catch(err => {
        this.log.error(`[Queue] Error: ${err}`);
      });
    });
  }

  private async processBatch(): Promise<void> {
    this.batchTimeout = null;
    const currentBatch = [...this.batchBuffer];
    this.batchBuffer = [];

    // Group notifications by channel + recipient
    const groups: Record<string, Notification[]> = {};
    for (const notif of currentBatch) {
      const key = `${notif.channel}:${notif.recipient}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(notif);
    }

    for (const [groupKey, notifs] of Object.entries(groups)) {
      if (notifs.length === 0) continue;
      
      const first = notifs[0];
      let message = '';
      let subject = '';

      if (notifs.length === 1) {
        message = first.renderedPayload || '';
        subject = first.errorMessage || 'SentinelFlow Alert'; // Template subject was saved in error_message or similar fields
      } else {
        // Collated/batched digest notification
        subject = `Digest: ${notifs.length} alerts on ${first.channel}`;
        message = notifs.map((n, i) => `Alert ${i + 1}: ${n.renderedPayload}`).join('\n\n---\n\n');
      }

      await this.dispatchNotification(notifs, first.channel, first.recipient, message, subject);
    }
  }

  private async dispatchNotification(
    originalNotifs: Notification[],
    channel: string,
    recipient: string,
    message: string,
    subject: string
  ): Promise<void> {
    const provider = ProviderFactory.getProvider(channel);
    const start = performance.now();

    for (const notif of originalNotifs) {
      notif.attemptCount++;
    }

    try {
      const response = await this.withTimeout(
        provider.send([recipient], message, subject),
        config.notifications.timeoutMs
      );

      const end = performance.now();
      const latency = Math.round(end - start);

      this.metrics.latencySum += latency;
      this.metrics.latencyCount++;

      if (response.success) {
        this.metrics.delivered += originalNotifs.length;
        this.metrics.sent += originalNotifs.length;

        for (const notif of originalNotifs) {
          notif.status = 'DELIVERED';
          notif.deliveredAt = new Date().toISOString();
          notif.providerResponse = response.providerResponse;
          await notificationRepository.updateNotificationStatus(notif.id, notif);
          this.log.info(`[Queue] Successfully delivered notification ${notif.id} (Latency: ${latency}ms)`);
        }
      } else {
        await this.handleFailure(originalNotifs, new Error(response.error || 'Provider rejected payload'));
      }
    } catch (err) {
      await this.handleFailure(originalNotifs, err instanceof Error ? err : new Error('Unknown error'));
    }
  }

  private async handleFailure(notifs: Notification[], error: Error): Promise<void> {
    this.metrics.failed += notifs.length;
    const retryLimit = config.notifications.retryLimit;

    for (const notif of notifs) {
      const history = notif.retryHistory || [];
      history.push({
        attempt: notif.attemptCount,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      notif.retryHistory = history;

      if (notif.attemptCount <= retryLimit) {
        this.metrics.retried++;
        notif.status = 'QUEUED';
        await notificationRepository.updateNotificationStatus(notif.id, notif);
        
        // Re-enqueue with exponential backoff delay
        const backoffMs = Math.pow(2, notif.attemptCount) * 1000;
        this.log.warn(`[Queue] Retrying notification ${notif.id} in ${backoffMs}ms... (Attempt ${notif.attemptCount}/${retryLimit})`);
        setTimeout(() => {
          this.enqueue(notif).catch(() => {});
        }, backoffMs);
      } else {
        notif.status = 'FAILED';
        notif.failedAt = new Date().toISOString();
        notif.errorMessage = error.message;
        await notificationRepository.updateNotificationStatus(notif.id, notif);
        this.log.error(`[Queue] Notification ${notif.id} permanently failed after ${retryLimit} retries. Error: ${error.message}`);
      }
    }
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
  }
}

export const notificationQueue = new NotificationQueue();
