import { dbClient, DatabaseClient } from '../client/DatabaseClient';
import { IncidentAudit } from '../../incidents/entities/NotesEntities';

export class AuditRepository {
  private db: DatabaseClient;

  constructor() {
    this.db = dbClient;
  }

  public async appendAudit(audit: IncidentAudit): Promise<IncidentAudit> {
    const text = `
      INSERT INTO incident_audits (id, incident_id, user_id, action, ip_address, metadata, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const rows = await this.db.query(text, [
      audit.id, audit.incidentId, audit.userId, audit.action, 
      audit.ipAddress, audit.metadata ? JSON.stringify(audit.metadata) : null, audit.timestamp
    ]);
    return {
      id: rows[0].id,
      incidentId: rows[0].incident_id,
      userId: rows[0].user_id,
      action: rows[0].action,
      ipAddress: rows[0].ip_address,
      metadata: rows[0].metadata,
      timestamp: rows[0].timestamp,
    };
  }

  public async getAudits(incidentId: string): Promise<IncidentAudit[]> {
    const text = `SELECT * FROM incident_audits WHERE incident_id = $1 ORDER BY timestamp DESC`;
    const rows = await this.db.query(text, [incidentId]);
    return rows.map(r => ({
      id: r.id,
      incidentId: r.incident_id,
      userId: r.user_id,
      action: r.action,
      ipAddress: r.ip_address,
      metadata: r.metadata,
      timestamp: r.timestamp,
    }));
  }
}

export const auditRepository = new AuditRepository();
