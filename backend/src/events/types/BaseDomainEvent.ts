import { CorrelationContext } from './CorrelationContext';

export interface BaseDomainEvent<T = unknown> {
  eventId: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  occurredAt: string;
  causationId?: string;
  version: number;
  eventVersion: string; // V1, V2 for forward compatibility
  correlationContext: CorrelationContext;
  payload: T;
  metadata?: Record<string, unknown>;
}
