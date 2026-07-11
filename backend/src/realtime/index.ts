import { webSocketGateway } from './gateway/WebSocketGateway';
import { RealtimeEventPublisher } from './events/RealtimeEventPublisher';
import { eventRegistry } from '../events/EventRegistry';

export async function initializeRealtime(): Promise<void> {
  // 1. Manually register RealtimeEventPublisher to all event types
  const publisher = new RealtimeEventPublisher();
  const eventTypes = [
    'IncidentCreated',
    'IncidentUpdated',
    'IncidentAssigned',
    'IncidentStatusChanged',
    'IncidentResolved',
    'IncidentClosed',
    'IncidentDeleted',
    'TimelineEventCreated',
    'NoteCreated',
    'NotificationRequested',
    'RunbookTriggered',
    'RunbookExecutionCompleted',
    'RunbookExecutionFailed',
    'TelemetryReceived',
    'AnomalyDetected',
    'IncidentAnalysisCompleted',
    'HealthCheckFailed',
    'JobCompleted',
    'DashboardStatisticsUpdated',
  ];

  for (const eventType of eventTypes) {
    eventRegistry.register(eventType, publisher);
  }

  // 2. Start WebSocket Gateway
  await webSocketGateway.start();
}
