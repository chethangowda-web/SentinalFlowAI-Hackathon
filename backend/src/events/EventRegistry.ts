import { BaseDomainEvent } from './types/BaseDomainEvent';

export interface IEventHandler<T extends BaseDomainEvent = BaseDomainEvent> {
  handle(event: T): Promise<void>;
}

// Internal store for decorators to push to before the registry is instantiated
const uninitializedHandlers = new Map<string, Array<new () => IEventHandler>>();

/**
 * Decorator to auto-register an event handler class for a specific event type.
 */
export function EventHandler(eventType: string) {
  return function (target: new () => IEventHandler) {
    if (!uninitializedHandlers.has(eventType)) {
      uninitializedHandlers.set(eventType, []);
    }
    uninitializedHandlers.get(eventType)!.push(target);
  };
}

export class EventRegistry {
  private handlers = new Map<string, IEventHandler[]>();

  constructor() {
    this.discoverDecoratedHandlers();
  }

  public discoverDecoratedHandlers() {
    for (const [eventType, handlerClasses] of uninitializedHandlers.entries()) {
      for (const HandlerClass of handlerClasses) {
        const existing = this.handlers.get(eventType) || [];
        const alreadyRegistered = existing.some(h => h.constructor.name === HandlerClass.name);
        if (!alreadyRegistered) {
          this.register(eventType, new HandlerClass());
        }
      }
    }
  }

  public register(eventType: string, handler: IEventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  public getHandlers(eventType: string): IEventHandler[] {
    return this.handlers.get(eventType) || [];
  }
}

export const eventRegistry = new EventRegistry();
