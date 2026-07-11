import { IEventHandler, EventHandler } from '../EventRegistry';
import { BaseDomainEvent } from '../types/BaseDomainEvent';
import { IncidentCreatedPayload, IncidentResolvedPayload } from '../types/EventTypes';
import { LoggerService } from '../../mastra/services/loggerService';

@EventHandler('IncidentCreated')
export class IncidentCreatedStatisticsHandler implements IEventHandler {
  private log = new LoggerService('StatisticsHandler');

  async handle(event: BaseDomainEvent<IncidentCreatedPayload>): Promise<void> {
    this.log.info(`[Stats] Tracking creation for incident ${event.payload.incidentId}`);
    // Future: Update daily counter materialized view, push to Prometheus custom metrics, etc.
  }
}

@EventHandler('IncidentResolved')
export class IncidentResolvedStatisticsHandler implements IEventHandler {
  private log = new LoggerService('StatisticsHandler');

  async handle(event: BaseDomainEvent<IncidentResolvedPayload>): Promise<void> {
    this.log.info(`[Stats] Tracking resolution for incident ${event.payload.incidentId} to calculate MTTR`);
    // Future: Compute Mean Time to Resolution (MTTR) updates
  }
}
