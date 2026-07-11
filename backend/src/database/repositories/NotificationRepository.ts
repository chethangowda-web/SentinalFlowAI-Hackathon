import { dbClient, DatabaseClient } from '../client/DatabaseClient';
import { Notification, NotificationPreference, EscalationPolicy } from '../../notifications/types';
import { DatabaseError } from '../../core/errors/DatabaseError';
import { randomUUID } from 'crypto';

export class NotificationRepository {
  private db: DatabaseClient;

  constructor() {
    this.db = dbClient;
  }

  public async createNotificationLog(notification: Partial<Notification> & { id: string; organizationId?: string }): Promise<Notification> {
    const text = `
      INSERT INTO notifications (
        id, event_id, correlation_id, channel, recipient, status, attempt_count,
        provider_name, provider_response, error_message, template_version, rendered_payload, retry_history, organization_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *;
    `;
    const params = [
      notification.id,
      notification.eventId,
      notification.correlationId || null,
      notification.channel,
      notification.recipient,
      notification.status,
      notification.attemptCount || 0,
      notification.providerName || null,
      notification.providerResponse ? JSON.stringify(notification.providerResponse) : null,
      notification.errorMessage || null,
      notification.templateVersion || null,
      notification.renderedPayload || null,
      notification.retryHistory ? JSON.stringify(notification.retryHistory) : '[]',
      notification.organizationId || null,
    ];

    const rows = await this.db.query(text, params);
    if (!rows.length) {
      throw new DatabaseError('Failed to create notification log');
    }
    return this.mapToEntity(rows[0]);
  }

  public async updateNotificationStatus(id: string, update: Partial<Notification>): Promise<void> {
    const text = `
      UPDATE notifications
      SET status = COALESCE($1, status),
          attempt_count = COALESCE($2, attempt_count),
          provider_response = COALESCE($3, provider_response),
          error_message = COALESCE($4, error_message),
          retry_history = COALESCE($5, retry_history),
          delivered_at = COALESCE($6, delivered_at),
          failed_at = COALESCE($7, failed_at)
      WHERE id = $8;
    `;
    await this.db.query(text, [
      update.status || null,
      update.attemptCount || null,
      update.providerResponse ? JSON.stringify(update.providerResponse) : null,
      update.errorMessage || null,
      update.retryHistory ? JSON.stringify(update.retryHistory) : null,
      update.deliveredAt || null,
      update.failedAt || null,
      id,
    ]);
  }

  public async getNotificationById(id: string, orgId?: string): Promise<Notification | null> {
    let text = `SELECT * FROM notifications WHERE id = $1`;
    const params = [id];
    if (orgId) {
      text += ` AND organization_id = $2`;
      params.push(orgId);
    }
    const rows = await this.db.query(text, params);
    return rows.length ? this.mapToEntity(rows[0]) : null;
  }

  public async listNotificationHistory(limit: number = 100, offset: number = 0, orgId?: string): Promise<Notification[]> {
    let text = `SELECT * FROM notifications`;
    const params: any[] = [limit, offset];
    if (orgId) {
      text += ` WHERE organization_id = $3`;
      params.push(orgId);
    }
    text += ` ORDER BY created_at DESC LIMIT $1 OFFSET $2`;
    const rows = await this.db.query(text, params);
    return rows.map(r => this.mapToEntity(r));
  }

  public async savePreference(pref: NotificationPreference): Promise<void> {
    const text = `
      INSERT INTO notification_preferences (user_id, slack_webhook, teams_webhook, discord_webhook, email, webhook_url, preferences)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id) DO UPDATE
      SET slack_webhook = EXCLUDED.slack_webhook,
          teams_webhook = EXCLUDED.teams_webhook,
          discord_webhook = EXCLUDED.discord_webhook,
          email = EXCLUDED.email,
          webhook_url = EXCLUDED.webhook_url,
          preferences = EXCLUDED.preferences;
    `;
    await this.db.query(text, [
      pref.userId,
      pref.slackWebhook || null,
      pref.teamsWebhook || null,
      pref.discordWebhook || null,
      pref.email || null,
      pref.webhookUrl || null,
      JSON.stringify(pref.preferences),
    ]);
  }

  public async getPreference(userId: string): Promise<NotificationPreference | null> {
    const text = `SELECT * FROM notification_preferences WHERE user_id = $1`;
    const rows = await this.db.query(text, [userId]);
    if (!rows.length) return null;
    const r = rows[0];
    return {
      userId: r.user_id,
      slackWebhook: r.slack_webhook,
      teamsWebhook: r.teams_webhook,
      discordWebhook: r.discord_webhook,
      email: r.email,
      webhookUrl: r.webhook_url,
      preferences: r.preferences || {},
    };
  }

  public async saveEscalationPolicy(policy: EscalationPolicy): Promise<void> {
    const text = `
      INSERT INTO escalation_policies (id, incident_id, current_level, max_level, status, last_escalated_at, next_escalation_at, policy_data)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE
      SET current_level = EXCLUDED.current_level,
          status = EXCLUDED.status,
          last_escalated_at = EXCLUDED.last_escalated_at,
          next_escalation_at = EXCLUDED.next_escalation_at;
    `;
    await this.db.query(text, [
      policy.id,
      policy.incidentId,
      policy.currentLevel,
      policy.maxLevel,
      policy.status,
      policy.lastEscalatedAt,
      policy.nextEscalationAt || null,
      JSON.stringify(policy.policyData),
    ]);
  }

  public async getEscalationPolicyByIncident(incidentId: string): Promise<EscalationPolicy | null> {
    const text = `SELECT * FROM escalation_policies WHERE incident_id = $1`;
    const rows = await this.db.query(text, [incidentId]);
    return rows.length ? this.mapToEscalationPolicy(rows[0]) : null;
  }

  public async getActiveEscalations(): Promise<EscalationPolicy[]> {
    const text = `SELECT * FROM escalation_policies WHERE status = 'ACTIVE' AND next_escalation_at <= NOW()`;
    const rows = await this.db.query(text);
    return rows.map(r => this.mapToEscalationPolicy(r));
  }

  public async getDeduplication(key: string): Promise<{ key: string; incidentId: string; lastSeenAt: string; occurrences: number } | null> {
    const text = `SELECT * FROM notification_deduplication WHERE key = $1`;
    const rows = await this.db.query(text, [key]);
    if (!rows.length) return null;
    const r = rows[0];
    return {
      key: r.key,
      incidentId: r.incident_id,
      lastSeenAt: r.last_seen_at,
      occurrences: r.occurrences,
    };
  }

  public async upsertDeduplication(key: string, incidentId: string): Promise<{ occurrences: number }> {
    const text = `
      INSERT INTO notification_deduplication (key, incident_id, last_seen_at, occurrences)
      VALUES ($1, $2, NOW(), 1)
      ON CONFLICT (key) DO UPDATE
      SET occurrences = notification_deduplication.occurrences + 1,
          last_seen_at = NOW()
      RETURNING occurrences;
    `;
    const rows = await this.db.query(text, [key, incidentId]);
    return { occurrences: rows[0].occurrences };
  }

  private mapToEntity(row: any): Notification {
    return {
      id: row.id,
      eventId: row.event_id,
      correlationId: row.correlation_id,
      channel: row.channel,
      recipient: row.recipient,
      status: row.status,
      attemptCount: row.attempt_count,
      providerName: row.provider_name,
      providerResponse: row.provider_response,
      errorMessage: row.error_message,
      templateVersion: row.template_version,
      renderedPayload: row.rendered_payload,
      retryHistory: row.retry_history || [],
      createdAt: row.created_at,
      deliveredAt: row.delivered_at,
      failedAt: row.failed_at,
    };
  }

  private mapToEscalationPolicy(row: any): EscalationPolicy {
    return {
      id: row.id,
      incidentId: row.incident_id,
      currentLevel: row.current_level,
      maxLevel: row.max_level,
      status: row.status,
      lastEscalatedAt: row.last_escalated_at,
      nextEscalationAt: row.next_escalation_at,
      policyData: row.policy_data,
    };
  }
}

export const notificationRepository = new NotificationRepository();
