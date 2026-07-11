import { BaseDomainEvent } from './types/BaseDomainEvent';
import { LoggerService } from '../mastra/services/loggerService';

export type NextFunction = () => Promise<void>;
export type EventMiddleware = (event: BaseDomainEvent, next: NextFunction) => Promise<void>;

export class LoggingMiddleware {
  static create(): EventMiddleware {
    const logger = new LoggerService('EventBus');
    return async (event, next) => {
      logger.info(`[Event] Started processing ${event.eventType} (${event.eventId})`);
      const start = performance.now();
      try {
        await next();
        const duration = Math.round(performance.now() - start);
        logger.info(`[Event] Successfully processed ${event.eventType} (${event.eventId}) in ${duration}ms`);
      } catch (error) {
        const duration = Math.round(performance.now() - start);
        const msg = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`[Event] Failed to process ${event.eventType} (${event.eventId}) after ${duration}ms: ${msg}`);
        throw error;
      }
    };
  }
}

export class MetricsMiddleware {
  static create(): EventMiddleware {
    // In a real observability platform, this would push to a statsd or prometheus gauge
    const logger = new LoggerService('EventMetrics');
    return async (event, next) => {
      const start = performance.now();
      try {
        await next();
        const duration = Math.round(performance.now() - start);
        logger.info(`metric=event_processed type=${event.eventType} status=success duration_ms=${duration}`);
      } catch (error) {
        const duration = Math.round(performance.now() - start);
        logger.info(`metric=event_processed type=${event.eventType} status=failure duration_ms=${duration}`);
        throw error;
      }
    };
  }
}

export class ValidationMiddleware {
  static create(): EventMiddleware {
    return async (event, next) => {
      if (!event.eventId || !event.eventType || !event.occurredAt) {
        throw new Error('Event is missing required base fields');
      }
      await next();
    };
  }
}

export class TracingMiddleware {
  static create(): EventMiddleware {
    return async (event, next) => {
      if (!event.correlationContext.traceId) {
        // Automatically inject a trace ID if one doesn't exist
        event.correlationContext.traceId = `tr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
      await next();
    };
  }
}
