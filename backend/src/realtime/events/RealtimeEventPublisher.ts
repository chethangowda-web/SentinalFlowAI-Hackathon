import { EventHandler, IEventHandler } from '../../events/EventRegistry';
import { BaseDomainEvent } from '../../events/types/BaseDomainEvent';
import { broadcastService } from '../services/BroadcastService';
import { incidentRepository } from '../../database/repositories/IncidentRepository';
import { dbClient } from '../../database/client/DatabaseClient';
import { LoggerService } from '../../mastra/services/loggerService';

@EventHandler('IncidentCreated')
@EventHandler('IncidentUpdated')
@EventHandler('IncidentAssigned')
@EventHandler('IncidentStatusChanged')
@EventHandler('IncidentResolved')
@EventHandler('IncidentClosed')
@EventHandler('IncidentDeleted')
@EventHandler('TimelineEventCreated')
@EventHandler('NoteCreated')
@EventHandler('NotificationRequested')
@EventHandler('RunbookTriggered')
@EventHandler('RunbookExecutionCompleted')
@EventHandler('RunbookExecutionFailed')
@EventHandler('TelemetryReceived')
@EventHandler('AnomalyDetected')
@EventHandler('IncidentAnalysisCompleted')
@EventHandler('HealthCheckFailed')
@EventHandler('JobCompleted')
@EventHandler('DashboardStatisticsUpdated')
export class RealtimeEventPublisher implements IEventHandler {
  private log = new LoggerService('RealtimeEventPublisher');

  public async handle(event: BaseDomainEvent<any>): Promise<void> {
    try {
      this.log.info(`[RealtimeEventPublisher] Propagating event: ${event.eventType} (${event.eventId})`);

      const orgId = await this.resolveOrganizationId(event);
      if (!orgId) {
        this.log.warn(`[RealtimeEventPublisher] No orgId resolved for event ${event.eventType}. Skipping broadcast.`);
        return;
      }

      const traceId = event.correlationContext?.traceId;
      const correlationId = event.correlationContext?.correlationId;

      // 1. Broadcast standard event to organization room
      await broadcastService.broadcastToOrganization(
        orgId,
        event.eventType,
        event.payload,
        traceId,
        correlationId
      );

      // 2. Broadcast to specific incident room if applicable
      const incidentId =
        event.payload?.incidentId ||
        event.correlationContext?.incidentId ||
        (event.aggregateType === 'Incident' ? event.aggregateId : null);
      if (incidentId) {
        const incidentRoom = `incident:${incidentId}`;
        await broadcastService.broadcastToRoom(
          incidentRoom,
          orgId,
          event.eventType,
          event.payload,
          traceId,
          correlationId
        );
      }

      // 3. Broadcast to user private room if applicable
      const targetUserId = event.payload?.target || event.correlationContext?.userId;
      if (targetUserId) {
        const userRoom = `user:${targetUserId}`;
        await broadcastService.broadcastToRoom(
          userRoom,
          orgId,
          event.eventType,
          event.payload,
          traceId,
          correlationId
        );
      }

      // 4. Trigger live dashboard updates if statistics are impacted
      if (this.shouldTriggerDashboardUpdate(event.eventType)) {
        await this.broadcastDashboardUpdate(orgId, traceId, correlationId);
      }
    } catch (err) {
      this.log.error(`[RealtimeEventPublisher] Process event ${event.eventId} failed: ${err}`);
    }
  }

  private async resolveOrganizationId(event: BaseDomainEvent<any>): Promise<string | null> {
    if (event.correlationContext?.tenantId) {
      return event.correlationContext.tenantId;
    }
    const payload = event.payload;
    if (payload) {
      if (payload.organizationId) return payload.organizationId;
      if (payload.tenantId) return payload.tenantId;
    }

    const incidentId =
      payload?.incidentId ||
      event.correlationContext?.incidentId ||
      (event.aggregateType === 'Incident' ? event.aggregateId : null);
    if (incidentId) {
      try {
        const incident = await incidentRepository.getIncidentById(incidentId);
        if (incident) {
          return (
            (incident as any).organizationId ||
            incident.metadata?.organizationId ||
            null
          );
        }
      } catch {
        // Ignore
      }
    }
    return null;
  }

  private shouldTriggerDashboardUpdate(eventType: string): boolean {
    const dashboardTriggerEvents = [
      'IncidentCreated',
      'IncidentUpdated',
      'IncidentStatusChanged',
      'IncidentAssigned',
      'IncidentResolved',
      'IncidentClosed',
      'IncidentDeleted',
      'TelemetryReceived',
      'AnomalyDetected',
      'RunbookTriggered',
      'RunbookExecutionCompleted',
      'RunbookExecutionFailed',
      'JobCompleted',
      'HealthCheckFailed',
      'DashboardStatisticsUpdated',
    ];
    return dashboardTriggerEvents.includes(eventType);
  }

  private async broadcastDashboardUpdate(orgId: string, traceId?: string, correlationId?: string): Promise<void> {
    try {
      const stats = await this.getTenantDashboardStats(orgId);
      const dashboardRoom = `org:${orgId}:dashboard`;

      await broadcastService.broadcastToRoom(
        dashboardRoom,
        orgId,
        'dashboard:update',
        stats,
        traceId,
        correlationId
      );
      this.log.info(`[RealtimeEventPublisher] Broadcasted dashboard update for organization ${orgId}`);
    } catch (err) {
      this.log.error(`[RealtimeEventPublisher] Failed to broadcast dashboard stats for org ${orgId}: ${err}`);
    }
  }

  private async getTenantDashboardStats(orgId: string) {
    const text = `
      SELECT 
        COUNT(*) as total_incidents,
        COUNT(*) FILTER (WHERE status = 'OPEN') as open_incidents,
        COUNT(*) FILTER (WHERE status = 'RESOLVED' OR status = 'CLOSED') as resolved_incidents,
        COUNT(*) FILTER (WHERE priority = 'P1' OR severity = 'critical') as critical_incidents,
        AVG(confidence_score) as avg_confidence,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as incidents_today,
        COUNT(*) FILTER (WHERE created_at >= date_trunc('week', CURRENT_DATE)) as incidents_this_week,
        COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)) as incidents_this_month
      FROM incidents
      WHERE deleted_at IS NULL AND organization_id = $1;
    `;

    const resRows = await dbClient.query(
      `
      SELECT AVG(EXTRACT(EPOCH FROM (r.resolved_at - i.created_at))) * 1000 as avg_resolution_time
      FROM incidents i
      JOIN incident_resolutions r ON i.incident_id = r.incident_id
      WHERE i.deleted_at IS NULL AND i.organization_id = $1;
    `,
      [orgId]
    );

    const rows = await dbClient.query(text, [orgId]);
    const row = rows[0] || {};
    const resRow = resRows[0] || {};

    return {
      totalIncidents: parseInt(row.total_incidents || '0', 10),
      openIncidents: parseInt(row.open_incidents || '0', 10),
      resolvedIncidents: parseInt(row.resolved_incidents || '0', 10),
      criticalIncidents: parseInt(row.critical_incidents || '0', 10),
      averageResolutionTimeMs: parseFloat(resRow.avg_resolution_time || '0'),
      averageAiConfidence: parseFloat(row.avg_confidence || '0'),
      incidentsToday: parseInt(row.incidents_today || '0', 10),
      incidentsThisWeek: parseInt(row.incidents_this_week || '0', 10),
      incidentsThisMonth: parseInt(row.incidents_this_month || '0', 10),
    };
  }
}
export default RealtimeEventPublisher;
