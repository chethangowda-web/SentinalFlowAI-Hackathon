import { randomUUID } from 'crypto';
import { BaseDomainEvent } from '../events/types/BaseDomainEvent';
import { notificationRepository } from '../database/repositories/NotificationRepository';
import { notificationPolicyEngine } from './NotificationPolicyEngine';
import { NotificationTemplateEngine } from './NotificationTemplateEngine';
import { notificationQueue } from './NotificationQueue';
import { Notification, EscalationPolicy } from './types';
import { LoggerService } from '../mastra/services/loggerService';

export class NotificationService {
  private log = new LoggerService('NotificationService');

  /**
   * Main entry point to process a domain event and dispatch alerts.
   */
  public async handleEvent(event: BaseDomainEvent): Promise<void> {
    const payload = event.payload as any;
    const incidentId = payload?.incidentId;

    // 1. Run Duplicate suppression policy
    const suppressed = await notificationPolicyEngine.shouldSuppress(event);
    if (suppressed) {
      notificationQueue.metrics.failed++; // Count as suppressed/skipped
      return;
    }

    // 2. Resolve Routing destinations
    const routes = await notificationPolicyEngine.resolveRouting(event);

    // 3. Render Template
    const rendered = NotificationTemplateEngine.render(event.eventType, payload || {});

    // 4. Persistence & Queueing
    for (const route of routes) {
      for (const recipient of route.recipients) {
        const notif: Notification = {
          id: randomUUID(),
          eventId: event.eventId,
          correlationId: event.correlationContext.correlationId,
          channel: route.channel,
          recipient,
          status: 'QUEUED',
          attemptCount: 0,
          providerName: route.channel,
          templateVersion: rendered.version,
          renderedPayload: rendered.body,
          errorMessage: rendered.subject, // Storing rendered subject here for the queue to use
          retryHistory: [],
        };

        // Save log to PostgreSQL first (Source of Truth)
        await notificationRepository.createNotificationLog(notif);

        // Enqueue asynchronously
        await notificationQueue.enqueue(notif);
      }
    }

    // 5. Initialize escalation for P1/P2
    if (incidentId && payload?.priority) {
      await notificationPolicyEngine.initializeEscalation(incidentId, payload.priority);
    }
  }

  /**
   * Periodic runner to process incident escalations.
   */
  public async processEscalations(): Promise<void> {
    const active = await notificationRepository.getActiveEscalations();
    if (active.length === 0) return;

    this.log.info(`[Escalation] Processing ${active.length} active overdue escalations`);

    for (const policy of active) {
      const nextLevel = policy.currentLevel + 1;
      const targetLevel = policy.policyData.levels.find(l => l.level === nextLevel);

      if (!targetLevel) {
        // Max escalation reached
        policy.status = 'ACKNOWLEDGED'; // Auto-deactivate
        policy.nextEscalationAt = undefined;
        await notificationRepository.saveEscalationPolicy(policy);
        this.log.info(`[Escalation] Max level reached for incident ${policy.incidentId}. Deactivating policy.`);
        continue;
      }

      this.log.warn(`[Escalation] Escalating incident ${policy.incidentId} to level ${nextLevel}`);

      // Render escalation template
      const rendered = NotificationTemplateEngine.render('IncidentEscalated', {
        incidentId: policy.incidentId,
        level: nextLevel,
        maxLevel: policy.maxLevel,
        environment: 'production',
      });

      // Dispatch escalation alerts
      for (const channel of targetLevel.channels) {
        for (const recipient of targetLevel.recipients) {
          const notif: Notification = {
            id: randomUUID(),
            eventId: `esc-${policy.incidentId}-${nextLevel}`,
            correlationId: `esc-corr-${policy.incidentId}`,
            channel,
            recipient,
            status: 'QUEUED',
            attemptCount: 0,
            providerName: channel,
            templateVersion: rendered.version,
            renderedPayload: rendered.body,
            errorMessage: rendered.subject,
            retryHistory: [],
          };

          await notificationRepository.createNotificationLog(notif);
          await notificationQueue.enqueue(notif);
        }
      }

      // Update escalation policy state
      policy.currentLevel = nextLevel;
      const now = new Date();
      policy.lastEscalatedAt = now.toISOString();
      policy.nextEscalationAt = new Date(now.getTime() + targetLevel.timeoutMin * 60000).toISOString();
      
      await notificationRepository.saveEscalationPolicy(policy);
    }
  }
}

export const notificationService = new NotificationService();
