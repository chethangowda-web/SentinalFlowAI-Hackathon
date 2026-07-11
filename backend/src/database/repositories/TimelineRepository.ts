import { dbClient, DatabaseClient } from '../client/DatabaseClient';
import { IncidentTimelineEvent } from '../../incidents/entities/LifecycleEntities';

export class TimelineRepository {
  private db: DatabaseClient;

  constructor() {
    this.db = dbClient;
  }

  public async appendEvent(event: IncidentTimelineEvent): Promise<IncidentTimelineEvent> {
    const text = `
      INSERT INTO incident_timeline (
        id, incident_id, timestamp, actor, action, 
        previous_status, new_status, old_value, new_value, notes, metadata
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      )
      RETURNING *;
    `;
    const rows = await this.db.query(text, [
      event.id, event.incidentId, event.timestamp, event.actor, event.action, 
      event.previousStatus, event.newStatus, event.oldValue, event.newValue, 
      event.notes, event.metadata ? JSON.stringify(event.metadata) : null
    ]);
    return {
      id: rows[0].id,
      incidentId: rows[0].incident_id,
      timestamp: rows[0].timestamp,
      actor: rows[0].actor,
      action: rows[0].action,
      previousStatus: rows[0].previous_status,
      newStatus: rows[0].new_status,
      oldValue: rows[0].old_value,
      newValue: rows[0].new_value,
      notes: rows[0].notes,
      metadata: rows[0].metadata,
    };
  }

  public async getTimeline(incidentId: string): Promise<IncidentTimelineEvent[]> {
    const text = `SELECT * FROM incident_timeline WHERE incident_id = $1 ORDER BY timestamp DESC`;
    const rows = await this.db.query(text, [incidentId]);
    return rows.map((r: any) => ({
      id: r.id,
      incidentId: r.incident_id,
      timestamp: r.timestamp,
      actor: r.actor,
      action: r.action,
      previousStatus: r.previous_status,
      newStatus: r.new_status,
      oldValue: r.old_value,
      newValue: r.new_value,
      notes: r.notes,
      metadata: r.metadata,
    }));
  }
}

export const timelineRepository = new TimelineRepository();
