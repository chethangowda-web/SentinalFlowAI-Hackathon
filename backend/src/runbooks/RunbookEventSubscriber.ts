import { EventHandler, IEventHandler } from '../events/EventRegistry';
import { BaseDomainEvent } from '../events/types/BaseDomainEvent';
import { runbookRepository } from '../database/repositories/RunbookRepository';
import { runbookEngine } from './engine/RunbookEngine';
import { eventPublisher } from '../events/EventPublisher';
import { RunbookExecutionContext } from './types';
import { timelineRepository } from '../database/repositories/TimelineRepository';
import { auditRepository } from '../database/repositories/AuditRepository';
import { TimelineEventType } from '../incidents/types/status';
import { randomUUID } from 'crypto';

@EventHandler('IncidentAnalysisCompleted')
export class RunbookIncidentAnalysisCompletedSubscriber implements IEventHandler {
  async handle(event: BaseDomainEvent): Promise<void> {
    const payload = event.payload as any;
    const service = event.correlationContext.incidentId ? 'kubernetes' : 'unknown'; // Derived or default service

    // Find runbooks matching the service and trigger event
    const runbooks = await runbookRepository.getRunbooksByTrigger('IncidentAnalysisCompleted');
    
    for (const runbook of runbooks) {
      const executionId = randomUUID();
      const context: RunbookExecutionContext = {
        incidentId: payload.incidentId || 'global',
        runbookId: runbook.id,
        executionId,
        traceId: event.correlationContext.traceId,
        requestId: event.correlationContext.requestId,
        service: runbook.service,
        environment: 'production',
        severity: runbook.severity,
        aiAnalysis: payload,
      };

      // Publish RunbookTriggered
      eventPublisher.publish(
        'RunbookTriggered',
        runbook.id,
        'Runbook',
        context,
        event.correlationContext
      );
    }
  }
}

@EventHandler('RunbookTriggered')
export class RunbookTriggeredEventSubscriber implements IEventHandler {
  async handle(event: BaseDomainEvent<RunbookExecutionContext>): Promise<void> {
    const context = event.payload;
    const runbook = await runbookRepository.getRunbookById(context.runbookId);
    if (runbook) {
      await runbookEngine.handleTrigger(runbook, context);
    }
  }
}

// ---------------------------------------------------------------------------
// Audit & Timeline Logging Handlers (Decoupled via EventBus)
// ---------------------------------------------------------------------------

@EventHandler('RunbookExecutionStarted')
export class RunbookExecutionStartedEventSubscriber implements IEventHandler {
  async handle(event: BaseDomainEvent): Promise<void> {
    const payload = event.payload as any;
    
    await timelineRepository.appendEvent({
      id: randomUUID(),
      incidentId: payload.incidentId,
      timestamp: new Date(event.occurredAt),
      actor: 'SYSTEM',
      action: 'RUNBOOK_TRIGGERED' as TimelineEventType,
      previousStatus: null,
      newStatus: null,
      oldValue: null,
      newValue: null,
      notes: `Runbook execution ${payload.executionId} started automatically.`,
      metadata: { runbookId: payload.runbookId },
    });

    await auditRepository.appendAudit({
      id: randomUUID(),
      incidentId: payload.incidentId,
      userId: 'SYSTEM',
      action: 'RUNBOOK_EXECUTION_STARTED',
      ipAddress: null,
      timestamp: new Date(event.occurredAt),
      metadata: { executionId: payload.executionId },
    });
  }
}

@EventHandler('RunbookExecutionCompleted')
export class RunbookExecutionCompletedEventSubscriber implements IEventHandler {
  async handle(event: BaseDomainEvent): Promise<void> {
    const payload = event.payload as any;
    
    await timelineRepository.appendEvent({
      id: randomUUID(),
      incidentId: payload.incidentId,
      timestamp: new Date(event.occurredAt),
      actor: 'SYSTEM',
      action: 'RUNBOOK_COMPLETED' as TimelineEventType,
      previousStatus: null,
      newStatus: null,
      oldValue: null,
      newValue: null,
      notes: `Runbook execution completed successfully in ${payload.durationMs}ms.`,
      metadata: { executionId: payload.executionId },
    });
  }
}

@EventHandler('RunbookExecutionFailed')
export class RunbookExecutionFailedEventSubscriber implements IEventHandler {
  async handle(event: BaseDomainEvent): Promise<void> {
    const payload = event.payload as any;
    
    await timelineRepository.appendEvent({
      id: randomUUID(),
      incidentId: payload.incidentId,
      timestamp: new Date(event.occurredAt),
      actor: 'SYSTEM',
      action: 'RUNBOOK_FAILED' as TimelineEventType,
      previousStatus: null,
      newStatus: null,
      oldValue: null,
      newValue: null,
      notes: `Runbook execution failed: ${payload.error}`,
      metadata: { executionId: payload.executionId },
    });
  }
}
