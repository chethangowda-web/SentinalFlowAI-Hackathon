import { randomUUID } from 'crypto';
import { IEventHandler, EventHandler } from '../EventRegistry';
import { BaseDomainEvent } from '../types/BaseDomainEvent';
import { timelineRepository } from '../../database/repositories/TimelineRepository';
import { TimelineEventType, IncidentStatus } from '../../incidents/types/status';
import { IncidentStatusChangedPayload, TimelineEventCreatedPayload } from '../types/EventTypes';

@EventHandler('IncidentStatusChanged')
export class IncidentStatusChangedTimelineHandler implements IEventHandler {
  async handle(event: BaseDomainEvent<IncidentStatusChangedPayload>): Promise<void> {
    await timelineRepository.appendEvent({
      id: randomUUID(),
      incidentId: event.payload.incidentId,
      timestamp: new Date(event.occurredAt),
      actor: event.correlationContext.userId || 'SYSTEM',
      action: TimelineEventType.STATUS_CHANGED,
      previousStatus: event.payload.oldStatus as IncidentStatus | null,
      newStatus: event.payload.newStatus as IncidentStatus,
      oldValue: event.payload.oldStatus,
      newValue: event.payload.newStatus,
      notes: event.payload.reason || null,
      metadata: event.metadata || null,
    });
  }
}

@EventHandler('TimelineEventCreated')
export class GenericTimelineHandler implements IEventHandler {
  async handle(event: BaseDomainEvent<TimelineEventCreatedPayload>): Promise<void> {
    await timelineRepository.appendEvent({
      id: randomUUID(),
      incidentId: event.payload.incidentId,
      timestamp: new Date(event.occurredAt),
      actor: event.payload.actor,
      action: event.payload.action as TimelineEventType,
      previousStatus: null,
      newStatus: null,
      oldValue: event.payload.oldValue || null,
      newValue: event.payload.newValue || null,
      notes: null,
      metadata: event.metadata || null,
    });
  }
}
