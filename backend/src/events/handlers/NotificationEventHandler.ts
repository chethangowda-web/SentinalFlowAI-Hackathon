import { IEventHandler, EventHandler } from '../EventRegistry';
import { BaseDomainEvent } from '../types/BaseDomainEvent';
import { IncidentCreatedPayload, IncidentAssignedPayload, NotificationRequestedPayload } from '../types/EventTypes';
import { LoggerService } from '../../mastra/services/loggerService';

@EventHandler('IncidentCreated')
export class IncidentCreatedNotificationHandler implements IEventHandler {
  private log = new LoggerService('NotificationHandler');

  async handle(event: BaseDomainEvent<IncidentCreatedPayload>): Promise<void> {
    // Check severity. If CRITICAL, push to PagerDuty/Slack (future)
    if (event.payload.severity === 'CRITICAL' || event.payload.severity === 'high') {
      this.log.info(`[Notification] Would alert on-call for Critical incident ${event.payload.incidentId}`);
    }
  }
}

@EventHandler('IncidentAssigned')
export class IncidentAssignedNotificationHandler implements IEventHandler {
  private log = new LoggerService('NotificationHandler');

  async handle(event: BaseDomainEvent<IncidentAssignedPayload>): Promise<void> {
    this.log.info(`[Notification] Would email ${event.payload.assigneeName} regarding assignment to ${event.payload.incidentId}`);
  }
}

@EventHandler('NotificationRequested')
export class GenericNotificationHandler implements IEventHandler {
  private log = new LoggerService('NotificationHandler');

  async handle(event: BaseDomainEvent<NotificationRequestedPayload>): Promise<void> {
    this.log.info(`[Notification] Sending ${event.payload.urgency} alert to ${event.payload.target}: ${event.payload.message}`);
  }
}
