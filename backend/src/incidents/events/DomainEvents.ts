import { eventPublisher } from '../../events/EventPublisher';
import { TimelineEventType, IncidentStatus } from '../types/status';

export interface DomainEventPayload {
  incidentId: string;
  actor: string;
  ipAddress?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface StatusChangedEvent extends DomainEventPayload {
  previousStatus: IncidentStatus | null;
  newStatus: IncidentStatus;
}

export interface GenericTimelineEvent extends DomainEventPayload {
  action: TimelineEventType;
  oldValue?: string;
  newValue?: string;
}

/**
 * Adapter mapping legacy event emitting to the central Event-Driven Architecture.
 */
class DomainEvents {
  public emitStatusChanged(event: StatusChangedEvent): void {
    eventPublisher.publish(
      'IncidentStatusChanged',
      event.incidentId,
      'Incident',
      {
        incidentId: event.incidentId,
        oldStatus: event.previousStatus,
        newStatus: event.newStatus,
        reason: event.notes,
      },
      {
        userId: event.actor,
        incidentId: event.incidentId,
      },
      event.metadata
    );
  }

  public emitTimelineEvent(event: GenericTimelineEvent): void {
    eventPublisher.publish(
      'TimelineEventCreated',
      event.incidentId,
      'Incident',
      {
        incidentId: event.incidentId,
        action: event.action,
        actor: event.actor,
        oldValue: event.oldValue,
        newValue: event.newValue,
      },
      {
        userId: event.actor,
        incidentId: event.incidentId,
      },
      event.metadata
    );
  }

  public emitAudit(event: GenericTimelineEvent): void {
    eventPublisher.publish(
      'AuditLogCreated',
      event.incidentId,
      'Incident',
      {
        incidentId: event.incidentId,
        action: event.action,
        userId: event.actor,
        ipAddress: event.ipAddress,
      },
      {
        userId: event.actor,
        incidentId: event.incidentId,
      },
      event.metadata
    );
  }
}

export const domainEvents = new DomainEvents();
