import { BaseDomainEvent } from './types/BaseDomainEvent';
import { IEventHandler } from './EventRegistry';
import { deadLetterRepository } from '../database/repositories/DeadLetterRepository';
import { LoggerService } from '../mastra/services/loggerService';

export class EventDispatcher {
  private log = new LoggerService('EventDispatcher');
  private maxRetries = 3;
  private timeoutMs = 5000;

  public async dispatch(event: BaseDomainEvent, handlers: IEventHandler[]): Promise<void> {
    if (handlers.length === 0) {
      this.log.warn(`No handlers registered for event type ${event.eventType}`);
      return;
    }

    // Execute handlers in parallel, but isolate their failures
    const promises = handlers.map(handler => this.executeWithResilience(event, handler));
    await Promise.allSettled(promises);
  }

  private async executeWithResilience(event: BaseDomainEvent, handler: IEventHandler): Promise<void> {
    const handlerName = handler.constructor.name;
    let attempt = 0;

    while (attempt <= this.maxRetries) {
      try {
        await this.withTimeout(handler.handle(event), this.timeoutMs);
        return; // Success
      } catch (error) {
        attempt++;
        const msg = error instanceof Error ? error.message : 'Unknown error';
        
        if (attempt <= this.maxRetries) {
          const backoff = Math.pow(2, attempt) * 100; // Exponential backoff: 200ms, 400ms, 800ms
          this.log.warn(`[Dispatcher] Handler ${handlerName} failed for event ${event.eventId}. Retrying in ${backoff}ms... (${attempt}/${this.maxRetries})`);
          await new Promise(res => setTimeout(res, backoff));
        } else {
          this.log.error(`[Dispatcher] Handler ${handlerName} permanently failed for event ${event.eventId} after ${this.maxRetries} retries. Routing to DLQ. Error: ${msg}`);
          await deadLetterRepository.persistFailedEvent(event, error instanceof Error ? error : new Error(msg), attempt - 1);
        }
      }
    }
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
  }
}

export const eventDispatcher = new EventDispatcher();
