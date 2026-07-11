import { randomUUID } from 'crypto';
import { BaseDomainEvent } from './types/BaseDomainEvent';
import { CorrelationContext } from './types/CorrelationContext';
import { eventBus } from './EventBus';

export class EventPublisher {
  public publish<T>(
    eventType: string,
    aggregateId: string,
    aggregateType: string,
    payload: T,
    context?: Partial<CorrelationContext>,
    metadata?: Record<string, unknown>
  ): void {
    const correlationContext: CorrelationContext = {
      correlationId: context?.correlationId || randomUUID(),
      traceId: context?.traceId,
      requestId: context?.requestId,
      userId: context?.userId,
      workflowId: context?.workflowId,
      tenantId: context?.tenantId,
      incidentId: context?.incidentId || (aggregateType === 'Incident' ? aggregateId : undefined),
    };

    const event: BaseDomainEvent<T> = {
      eventId: randomUUID(),
      eventType,
      aggregateId,
      aggregateType,
      occurredAt: new Date().toISOString(),
      version: 1,
      eventVersion: 'V1',
      correlationContext,
      payload,
      metadata,
    };

    // Fire and forget
    eventBus.publish(event).catch(() => {});
  }
}

export const eventPublisher = new EventPublisher();
