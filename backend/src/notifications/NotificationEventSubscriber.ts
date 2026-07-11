import { EventHandler, IEventHandler } from '../events/EventRegistry';
import { BaseDomainEvent } from '../events/types/BaseDomainEvent';
import { notificationService } from './NotificationService';

@EventHandler('IncidentCreated')
export class NotificationIncidentCreatedSubscriber implements IEventHandler {
  async handle(event: BaseDomainEvent): Promise<void> {
    await notificationService.handleEvent(event);
  }
}

@EventHandler('IncidentAssigned')
export class NotificationIncidentAssignedSubscriber implements IEventHandler {
  async handle(event: BaseDomainEvent): Promise<void> {
    await notificationService.handleEvent(event);
  }
}

@EventHandler('IncidentStatusChanged')
export class NotificationIncidentStatusChangedSubscriber implements IEventHandler {
  async handle(event: BaseDomainEvent): Promise<void> {
    await notificationService.handleEvent(event);
  }
}

@EventHandler('IncidentResolved')
export class NotificationIncidentResolvedSubscriber implements IEventHandler {
  async handle(event: BaseDomainEvent): Promise<void> {
    await notificationService.handleEvent(event);
  }
}

@EventHandler('IncidentClosed')
export class NotificationIncidentClosedSubscriber implements IEventHandler {
  async handle(event: BaseDomainEvent): Promise<void> {
    await notificationService.handleEvent(event);
  }
}

@EventHandler('HealthCheckFailed')
export class NotificationHealthCheckFailedSubscriber implements IEventHandler {
  async handle(event: BaseDomainEvent): Promise<void> {
    await notificationService.handleEvent(event);
  }
}

@EventHandler('AnomalyDetected')
export class NotificationAnomalyDetectedSubscriber implements IEventHandler {
  async handle(event: BaseDomainEvent): Promise<void> {
    await notificationService.handleEvent(event);
  }
}

@EventHandler('RunbookTriggered')
export class NotificationRunbookTriggeredSubscriber implements IEventHandler {
  async handle(event: BaseDomainEvent): Promise<void> {
    await notificationService.handleEvent(event);
  }
}

@EventHandler('JobCompleted')
export class NotificationJobCompletedSubscriber implements IEventHandler {
  async handle(event: BaseDomainEvent): Promise<void> {
    await notificationService.handleEvent(event);
  }
}

@EventHandler('NotificationRequested')
export class NotificationRequestedEventSubscriber implements IEventHandler {
  async handle(event: BaseDomainEvent): Promise<void> {
    await notificationService.handleEvent(event);
  }
}
