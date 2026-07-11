import { dbClient } from '../../database/client/DatabaseClient';
import { randomUUID } from 'crypto';

export interface AuditLogPayload {
  traceId?: string;
  actor: string;
  action: string;
  scope: string;
  metadata?: Record<string, any>;
  complianceIndicators?: {
    soc2?: boolean;
    iso27001?: boolean;
    gdpr?: boolean;
  };
}

export class PlatformAuditService {
  public async log(payload: AuditLogPayload): Promise<string> {
    const id = randomUUID();
    const traceId = payload.traceId || randomUUID();
    const metadata = payload.metadata || {};
    const compliance = payload.complianceIndicators || { soc2: true, iso27001: true, gdpr: false };

    await dbClient.query(
      `
      INSERT INTO platform_audit_logs (id, trace_id, actor, action, scope, metadata, compliance_indicators)
      VALUES ($1, $2, $3, $4, $5, $6, $7);
    `,
      [id, traceId, payload.actor, payload.action, payload.scope, JSON.stringify(metadata), JSON.stringify(compliance)]
    );

    return id;
  }

  public async executeGdprDelete(userId: string, requestingActor: string): Promise<void> {
    const traceId = randomUUID();
    await this.log({
      traceId,
      actor: requestingActor,
      action: 'GDPR_DELETE_REQUEST',
      scope: 'Compliance',
      metadata: { deletedUserId: userId },
      complianceIndicators: { gdpr: true, soc2: true },
    });

    // Anonymize user records in PostgreSQL
    await dbClient.query(
      `
      UPDATE users
      SET email = 'anonymous_' || $1 || '@sentinelflow.ai',
          full_name = 'Anonymous User',
          password_hash = '[REDACTED]',
          status = 'DEACTIVATED',
          updated_at = NOW()
      WHERE user_id = $2;
    `,
      [randomUUID().substring(0, 8), userId]
    );

    await this.log({
      traceId,
      actor: 'SYSTEM',
      action: 'GDPR_DELETE_COMPLETED',
      scope: 'Compliance',
      metadata: { deletedUserId: userId },
      complianceIndicators: { gdpr: true, soc2: true },
    });
  }
}

export const platformAuditService = new PlatformAuditService();
export default platformAuditService;
