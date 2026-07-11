import { BaseDomainEvent } from '../events/types/BaseDomainEvent';
import { notificationRepository } from '../database/repositories/NotificationRepository';
import { EscalationPolicy } from './types';
import { LoggerService } from '../mastra/services/loggerService';
import { randomUUID } from 'crypto';

export class NotificationPolicyEngine {
  private log = new LoggerService('NotificationPolicyEngine');
  private cooldownMs = 60000; // 1-minute suppression window for duplicate keys

  /**
   * Determine targeted channels and recipients based on incident priority or event severity.
   */
  public async resolveRouting(event: BaseDomainEvent): Promise<Array<{ channel: string; recipients: string[] }>> {
    const payload = event.payload as any;
    let priority = payload?.priority || 'P4';
    let severity = payload?.severity || 'LOW';

    // Map severities to priorities if priority not set
    if (!payload?.priority && payload?.severity) {
      const sev = String(payload.severity).toUpperCase();
      if (sev === 'CRITICAL') priority = 'P1';
      else if (sev === 'HIGH') priority = 'P2';
      else if (sev === 'MEDIUM') priority = 'P3';
      else priority = 'P4';
    }

    const routing: Array<{ channel: string; recipients: string[] }> = [];

    // Fallback default recipients
    const defaultSlack = 'slack';
    const defaultEmail = 'ops@sentinelflow.ai';
    const defaultTeams = 'teams';
    const defaultDiscord = 'discord';
    const defaultWebhook = 'webhook';

    // Routing rules
    switch (priority.toUpperCase()) {
      case 'P1':
        routing.push({ channel: 'slack', recipients: [defaultSlack] });
        routing.push({ channel: 'email', recipients: [defaultEmail] });
        routing.push({ channel: 'teams', recipients: [defaultTeams] });
        break;
      case 'P2':
        routing.push({ channel: 'slack', recipients: [defaultSlack] });
        routing.push({ channel: 'email', recipients: [defaultEmail] });
        break;
      case 'P3':
        routing.push({ channel: 'slack', recipients: [defaultSlack] });
        break;
      case 'P4':
      default:
        routing.push({ channel: 'webhook', recipients: [defaultWebhook] });
        routing.push({ channel: 'console', recipients: ['stdout'] });
        break;
    }

    return routing;
  }

  /**
   * Evaluates if this event is a duplicate within the cooldown window and should be suppressed.
   */
  public async shouldSuppress(event: BaseDomainEvent): Promise<boolean> {
    const payload = event.payload as any;
    const service = payload?.service || 'unknown';
    const eventType = event.eventType;
    
    // Deduplication Key: service + eventType + incidentId (if present)
    const incidentId = payload?.incidentId || 'global';
    const dedupeKey = `${service}:${eventType}:${incidentId}`;

    const existing = await notificationRepository.getDeduplication(dedupeKey);
    const { occurrences } = await notificationRepository.upsertDeduplication(dedupeKey, incidentId);

    if (existing) {
      const timePassed = Date.now() - new Date(existing.lastSeenAt).getTime();
      if (timePassed < this.cooldownMs) {
        this.log.info(`[Suppressor] Duplicate event suppressed: ${dedupeKey} (Occurrences: ${occurrences})`);
        return true;
      }
    }
    return false;
  }

  /**
   * Creates or triggers escalation workflows for P1/P2 incidents.
   */
  public async initializeEscalation(incidentId: string, priority: string): Promise<void> {
    if (priority !== 'P1' && priority !== 'P2') return;

    const existing = await notificationRepository.getEscalationPolicyByIncident(incidentId);
    if (existing) return;

    const now = new Date();
    const policy: EscalationPolicy = {
      id: randomUUID(),
      incidentId,
      currentLevel: 0,
      maxLevel: 3,
      status: 'ACTIVE',
      lastEscalatedAt: now.toISOString(),
      nextEscalationAt: new Date(now.getTime() + 5 * 60000).toISOString(), // Escalates in 5 mins
      policyData: {
        levels: [
          { level: 1, timeoutMin: 5, channels: ['slack'], recipients: ['slack-oncall'] },
          { level: 2, timeoutMin: 10, channels: ['email'], recipients: ['sre-team@sentinelflow.ai'] },
          { level: 3, timeoutMin: 15, channels: ['teams', 'webhook'], recipients: ['management-teams', 'webhook-alert-router'] },
        ]
      }
    };

    await notificationRepository.saveEscalationPolicy(policy);
    this.log.info(`[Escalation] Escalation policy registered for incident ${incidentId}`);
  }
}

export const notificationPolicyEngine = new NotificationPolicyEngine();
