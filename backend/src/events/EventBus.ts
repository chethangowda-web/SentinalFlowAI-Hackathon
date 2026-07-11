import { BaseDomainEvent } from './types/BaseDomainEvent';
import { eventRegistry } from './EventRegistry';
import { eventDispatcher } from './EventDispatcher';
import { EventMiddleware } from './Middleware';
import { deadLetterRepository } from '../database/repositories/DeadLetterRepository';
import { LoggerService } from '../mastra/services/loggerService';

export class EventBus {
  private middlewares: EventMiddleware[] = [];
  private log = new LoggerService('EventBus');

  public use(middleware: EventMiddleware): void {
    this.middlewares.push(middleware);
  }

  public async publish(event: BaseDomainEvent): Promise<void> {
    // We execute the middleware chain, and at the end of the chain, we dispatch
    let index = 0;

    const next = async (): Promise<void> => {
      if (index < this.middlewares.length) {
        const middleware = this.middlewares[index++];
        await middleware(event, next);
      } else {
        // Dispatch to handlers
        const handlers = eventRegistry.getHandlers(event.eventType);
        await eventDispatcher.dispatch(event, handlers);
      }
    };

    // Do not await the execution thread to avoid blocking request pipelines
    // Just fire and forget the middleware chain
    next().catch(err => {
      this.log.error(`[EventBus] Unhandled error in middleware chain for event ${event.eventId}: ${err}`);
    });
  }

  public async publishBatch(events: BaseDomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  // Event Replay Features for recovering from failures
  public async replay(eventId: string): Promise<void> {
    this.log.info(`[EventBus] Replaying event ${eventId}`);
    const event = await deadLetterRepository.getEventById(eventId);
    if (!event) {
      this.log.error(`[EventBus] Cannot replay: Event ${eventId} not found in DLQ`);
      return;
    }

    // Replay directly bypassing initial middlewares to avoid duplicate tracing/metrics inflation
    // Or we could send it through publish(). For recovery, dispatch directly is usually safer.
    const handlers = eventRegistry.getHandlers(event.eventType);
    await eventDispatcher.dispatch(event, handlers);
    await deadLetterRepository.markResolved(eventId);
    this.log.info(`[EventBus] Successfully replayed and resolved event ${eventId}`);
  }

  public async replayAll(): Promise<void> {
    this.log.info(`[EventBus] Starting ReplayAll from DLQ`);
    const unresolved = await deadLetterRepository.getUnresolvedEvents();
    this.log.info(`[EventBus] Found ${unresolved.length} unresolved events`);
    for (const event of unresolved) {
      await this.replay(event.eventId);
    }
  }
}

export const eventBus = new EventBus();
