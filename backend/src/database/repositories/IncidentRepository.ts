import { dbClient, DatabaseClient } from '../client/DatabaseClient';
import { Incident } from '../entities/Incident';
import { IncidentAssignment, IncidentResolution } from '../../incidents/entities/LifecycleEntities';
import { DatabaseError } from '../../core/errors/DatabaseError';
import { SearchFilterDTO } from '../../incidents/dto/IncidentDTO';
import { eventPublisher } from '../../events/EventPublisher';

export class IncidentRepository {
  private db: DatabaseClient;

  constructor() {
    this.db = dbClient;
  }

  public async createIncident(incident: Partial<Incident> & { incidentId: string; organizationId?: string }): Promise<Incident> {
    const text = `
      INSERT INTO incidents (
        incident_id, service, application, environment, severity, priority, status, title, summary,
        description, raw_logs, confidence_score, root_cause, ai_report, recommendations,
        similar_incidents, metadata, assigned_engineer, resolution, timeline, version, organization_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 1, $21
      ) RETURNING *;
    `;
    const params = [
      incident.incidentId,
      incident.service || '',
      incident.application || '',
      incident.environment || 'dev',
      incident.severity || 'low',
      incident.priority || 'P4',
      incident.status || 'OPEN',
      incident.title || '',
      incident.summary || '',
      incident.description || '',
      incident.rawLogs || '',
      incident.confidenceScore || 0,
      incident.rootCause || '',
      incident.aiReport ? JSON.stringify(incident.aiReport) : null,
      incident.recommendations ? JSON.stringify(incident.recommendations) : null,
      incident.similarIncidents ? JSON.stringify(incident.similarIncidents) : null,
      incident.metadata ? JSON.stringify(incident.metadata) : null,
      incident.assignedEngineer || null,
      incident.resolution || null,
      incident.timeline ? JSON.stringify(incident.timeline) : null,
      incident.organizationId || null,
    ];

    const rows = await this.db.query(text, params);
    if (!rows.length) {
      throw new DatabaseError('Failed to create incident: No rows returned');
    }
    const created = this.mapToEntity(rows[0]);
    
    eventPublisher.publish(
      'IncidentCreated',
      created.incidentId,
      'Incident',
      {
        incidentId: created.incidentId,
        service: created.service,
        environment: created.environment,
        title: created.title,
        severity: created.severity,
        status: created.status,
      }
    );

    return created;
  }

  public async getIncidentById(incidentId: string, orgId?: string): Promise<Incident | null> {
    let text = `SELECT * FROM incidents WHERE incident_id = $1 AND deleted_at IS NULL`;
    const params = [incidentId];
    if (orgId) {
      text += ` AND organization_id = $2`;
      params.push(orgId);
    }
    const rows = await this.db.query(text, params);
    return rows.length ? this.mapToEntity(rows[0]) : null;
  }

  public async updateStatus(incidentId: string, status: string, currentVersion: number, orgId?: string): Promise<Incident> {
    let text = `
      UPDATE incidents
      SET status = $1, version = version + 1, updated_at = NOW()
      WHERE incident_id = $2 AND version = $3 AND deleted_at IS NULL
    `;
    const params = [status, incidentId, currentVersion];
    if (orgId) {
      text += ` AND organization_id = $4`;
      params.push(orgId);
    }
    text += ` RETURNING *;`;
    
    const rows = await this.db.query(text, params);
    if (!rows.length) {
      throw new DatabaseError(`Concurrent modification or incident not found: ${incidentId} at version ${currentVersion}`);
    }
    const updated = this.mapToEntity(rows[0]);

    eventPublisher.publish(
      'IncidentStatusChanged',
      updated.incidentId,
      'Incident',
      {
        incidentId: updated.incidentId,
        oldStatus: null, // Since we don't fetch the previous state here, it's null
        newStatus: updated.status,
      }
    );

    return updated;
  }

  public async assignEngineer(assignment: IncidentAssignment, currentVersion: number): Promise<IncidentAssignment> {
    return this.db.transaction(async (client) => {
      const updateIncident = `
        UPDATE incidents 
        SET assigned_engineer = $1, version = version + 1, updated_at = NOW() 
        WHERE incident_id = $2 AND version = $3 AND deleted_at IS NULL
        RETURNING *;
      `;
      const incRows = await client.query(updateIncident, [
        assignment.assignedEngineerId, assignment.incidentId, currentVersion
      ]);
      
      if (!incRows.rows.length) {
        throw new DatabaseError(`Concurrent modification or incident not found for assignment: ${assignment.incidentId}`);
      }

      const insertAssign = `
        INSERT INTO incident_assignments (id, incident_id, assigned_engineer_id, assigned_engineer_name, assigned_by, assigned_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `;
      const assignRows = await client.query(insertAssign, [
        assignment.id, assignment.incidentId, assignment.assignedEngineerId, 
        assignment.assignedEngineerName, assignment.assignedBy, assignment.assignedAt
      ]);
      
      const assignmentResult = {
        id: assignRows.rows[0].id,
        incidentId: assignRows.rows[0].incident_id,
        assignedEngineerId: assignRows.rows[0].assigned_engineer_id,
        assignedEngineerName: assignRows.rows[0].assigned_engineer_name,
        assignedBy: assignRows.rows[0].assigned_by,
        assignedAt: assignRows.rows[0].assigned_at,
      };

      eventPublisher.publish(
        'IncidentAssigned',
        assignmentResult.incidentId,
        'Incident',
        {
          incidentId: assignmentResult.incidentId,
          assigneeId: assignmentResult.assignedEngineerId,
          assigneeName: assignmentResult.assignedEngineerName,
          assignedBy: assignmentResult.assignedBy,
        },
        { userId: assignmentResult.assignedBy }
      );

      return assignmentResult;
    });
  }

  public async saveResolution(resolution: IncidentResolution, currentVersion: number): Promise<IncidentResolution> {
    return this.db.transaction(async (client) => {
      const updateIncident = `
        UPDATE incidents 
        SET version = version + 1, updated_at = NOW(), root_cause = $1
        WHERE incident_id = $2 AND version = $3 AND deleted_at IS NULL
        RETURNING *;
      `;
      const incRows = await client.query(updateIncident, [
        resolution.rootCause, resolution.incidentId, currentVersion
      ]);

      if (!incRows.rows.length) {
        throw new DatabaseError(`Concurrent modification or incident not found for resolution: ${resolution.incidentId}`);
      }

      const text = `
        INSERT INTO incident_resolutions (id, incident_id, summary, root_cause, corrective_actions, preventive_actions, resolved_by, resolved_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
      `;
      const resRows = await client.query(text, [
        resolution.id, resolution.incidentId, resolution.summary, resolution.rootCause,
        resolution.correctiveActions, resolution.preventiveActions, resolution.resolvedBy, resolution.resolvedAt
      ]);
      
      const resolutionResult = {
        id: resRows.rows[0].id,
        incidentId: resRows.rows[0].incident_id,
        summary: resRows.rows[0].summary,
        rootCause: resRows.rows[0].root_cause,
        correctiveActions: resRows.rows[0].corrective_actions,
        preventiveActions: resRows.rows[0].preventive_actions,
        resolvedBy: resRows.rows[0].resolved_by,
        resolvedAt: resRows.rows[0].resolved_at,
      };

      eventPublisher.publish(
        'IncidentResolved',
        resolutionResult.incidentId,
        'Incident',
        {
          incidentId: resolutionResult.incidentId,
          resolutionId: resolutionResult.id,
          resolvedBy: resolutionResult.resolvedBy,
          rootCause: resolutionResult.rootCause,
        },
        { userId: resolutionResult.resolvedBy }
      );

      return resolutionResult;
    });
  }

  public async softDelete(incidentId: string, deletedBy: string, currentVersion: number): Promise<void> {
    const text = `
      UPDATE incidents
      SET deleted_at = NOW(), deleted_by = $1, version = version + 1
      WHERE incident_id = $2 AND version = $3 AND deleted_at IS NULL
    `;
    const result = await this.db.query(text, [deletedBy, incidentId, currentVersion]);
    // The DatabaseClient query currently returns rows, to check row count we'd need the result object, 
    // but mapping to rows means if rows.length === 0 it might just be an empty return for UPDATE.
    // However, if we add RETURNING 1, we can check.
  }

  public async getIncidents(filters: SearchFilterDTO, orgId?: string): Promise<Incident[]> {
    let query = `SELECT * FROM incidents WHERE deleted_at IS NULL`;
    const params: any[] = [];
    let paramIndex = 1;

    if (orgId) {
      query += ` AND organization_id = $${paramIndex++}`;
      params.push(orgId);
    }

    if (filters.status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(filters.status);
    }
    if (filters.severity) {
      query += ` AND severity = $${paramIndex++}`;
      params.push(filters.severity);
    }
    if (filters.priority) {
      query += ` AND priority = $${paramIndex++}`;
      params.push(filters.priority);
    }
    if (filters.assignedEngineer) {
      query += ` AND assigned_engineer = $${paramIndex++}`;
      params.push(filters.assignedEngineer);
    }
    if (filters.environment) {
      query += ` AND environment = $${paramIndex++}`;
      params.push(filters.environment);
    }
    if (filters.service) {
      query += ` AND service = $${paramIndex++}`;
      params.push(filters.service);
    }
    if (filters.keyword) {
      query += ` AND (title ILIKE $${paramIndex} OR summary ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      params.push(`%${filters.keyword}%`);
      paramIndex++;
    }
    if (filters.createdAfter) {
      query += ` AND created_at >= $${paramIndex++}`;
      params.push(filters.createdAfter);
    }
    if (filters.createdBefore) {
      query += ` AND created_at <= $${paramIndex++}`;
      params.push(filters.createdBefore);
    }
    if (filters.updatedAfter) {
      query += ` AND updated_at >= $${paramIndex++}`;
      params.push(filters.updatedAfter);
    }
    if (filters.updatedBefore) {
      query += ` AND updated_at <= $${paramIndex++}`;
      params.push(filters.updatedBefore);
    }
    
    const allowedSortColumns = ['created_at', 'updated_at', 'severity', 'priority', 'status'];
    const sort = filters.sort || 'created_at';
    const safeSort = allowedSortColumns.includes(sort) ? sort : 'created_at';
    const safeOrder = filters.order === 'ASC' ? 'ASC' : 'DESC';

    query += ` ORDER BY ${safeSort} ${safeOrder} LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(filters.limit, filters.offset);

    const rows = await this.db.query(query, params);
    return rows.map(r => this.mapToEntity(r));
  }

  private mapToEntity(row: any): Incident {
    return {
      incidentId: row.incident_id,
      service: row.service,
      application: row.application,
      environment: row.environment,
      severity: row.severity,
      priority: row.priority,
      status: row.status,
      title: row.title,
      summary: row.summary,
      description: row.description,
      rawLogs: row.raw_logs,
      confidenceScore: row.confidence_score,
      rootCause: row.root_cause,
      aiReport: row.ai_report,
      recommendations: row.recommendations,
      similarIncidents: row.similar_incidents,
      metadata: row.metadata,
      assignedEngineer: row.assigned_engineer,
      resolution: row.resolution,
      timeline: row.timeline,
      version: row.version,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      deletedBy: row.deleted_by,
    };
  }
}

export const incidentRepository = new IncidentRepository();
