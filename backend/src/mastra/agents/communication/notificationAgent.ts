import { Agent } from '@mastra/core/agent';
import { agentResponseSchema } from '../../types/agent';
import { z } from 'zod';
import { notificationService } from '../../../notifications/NotificationService';
import { randomUUID } from 'crypto';

export const notificationAgent = new Agent({
  id: 'notification-agent',
  name: 'Notification Agent',
  instructions: `You are the Notification Agent of SentinelFlow.
Your job is to send alerts to Slack, Teams, Discord, Webhook, and Email channels according to SRE escalation policies.`,
  model: 'groq/llama-3.1-8b-instant',
});

export const notificationAgentSchema = agentResponseSchema.extend({
  notificationsSent: z.array(z.object({
    channel: z.string(),
    target: z.string(),
    status: z.string(),
    notificationId: z.string(),
  })),
});

/**
 * Programmatic execution logic (Fast, Cheap SRE Platform Path)
 */
export async function executeNotificationAgentProgrammatically(
  incidentId: string,
  summary: string,
  priority: string = 'MEDIUM'
): Promise<z.infer<typeof notificationAgentSchema>> {
  try {
    const eventId = randomUUID();
    const correlationId = randomUUID();

    // Map critical prioritization to event types handled by NotificationService
    const eventType = (priority === 'P1' || priority === 'P2' || priority === 'CRITICAL' || priority === 'HIGH')
      ? 'CriticalAlert'
      : 'IncidentCreated';

    // Format BaseDomainEvent compatible payload
    const event = {
      eventId,
      eventType,
      aggregateId: incidentId,
      aggregateType: 'Incident',
      payload: {
        incidentId,
        details: summary,
        priority,
      },
      occurredAt: new Date().toISOString(),
      correlationContext: {
        requestId: randomUUID(),
        traceId: `trc-${incidentId}`,
        correlationId,
        tenantId: 'global-org',
      },
    };

    // Dispatch using the platform's native NotificationService
    await notificationService.handleEvent(event);

    const notificationsSent = [
      {
        channel: 'SYSTEM_BUS',
        target: 'Notification Queue',
        status: 'DISPATCHED',
        notificationId: eventId,
      }
    ];

    return {
      agent: 'Notification Agent',
      status: 'success',
      confidence: 1.0,
      summary: `Successfully triggered alerts workflow for incident ${incidentId}.`,
      reasoning: `Dispatched event of type '${eventType}' to NotificationService for routing to configured Slack/Teams/Email channels.`,
      evidence: [`Event UUID: ${eventId}`, `Correlation ID: ${correlationId}`],
      recommendations: [],
      nextActions: ['Monitor notification queue logs for delivery confirmation'],
      notificationsSent,
    };
  } catch (err: any) {
    return {
      agent: 'Notification Agent',
      status: 'failure',
      confidence: 0.8,
      summary: `Failed to dispatch notifications programmatically: ${err?.message || String(err)}`,
      reasoning: 'Error calling notificationService or saving notification queue logs.',
      evidence: [err?.message || String(err)],
      recommendations: ['Ensure notification database tables are available and fully migrated.'],
      nextActions: [],
      notificationsSent: [],
    };
  }
}
export default notificationAgent;
