import { randomUUID } from 'crypto';
import { IEventHandler, EventHandler } from '../EventRegistry';
import { BaseDomainEvent } from '../types/BaseDomainEvent';
import { auditRepository } from '../../database/repositories/AuditRepository';
import { AuditLogCreatedPayload, IncidentStatusChangedPayload } from '../types/EventTypes';

@EventHandler('AuditLogCreated')
export class GenericAuditLogHandler implements IEventHandler {
  async handle(event: BaseDomainEvent<AuditLogCreatedPayload>): Promise<void> {
    await auditRepository.appendAudit({
      id: randomUUID(),
      incidentId: event.payload.incidentId,
      userId: event.payload.userId,
      action: event.payload.action,
      ipAddress: event.payload.ipAddress || null,
      metadata: event.metadata || null,
      timestamp: new Date(event.occurredAt),
    });
  }
}

@EventHandler('IncidentStatusChanged')
export class IncidentStatusChangedAuditHandler implements IEventHandler {
  async handle(event: BaseDomainEvent<IncidentStatusChangedPayload>): Promise<void> {
    await auditRepository.appendAudit({
      id: randomUUID(),
      incidentId: event.payload.incidentId,
      userId: event.correlationContext.userId || 'SYSTEM',
      action: 'STATUS_CHANGED',
      ipAddress: null,
      metadata: { from: event.payload.oldStatus, to: event.payload.newStatus },
      timestamp: new Date(event.occurredAt),
    });
  }
}
