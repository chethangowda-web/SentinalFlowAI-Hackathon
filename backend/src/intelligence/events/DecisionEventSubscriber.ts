import { EventHandler, IEventHandler } from '../../events/EventRegistry';
import { BaseDomainEvent } from '../../events/types/BaseDomainEvent';
import { decisionEngine } from '../services/DecisionEngine';
import { decisionRepository } from '../repositories/DecisionRepository';
import { eventPublisher } from '../../events/EventPublisher';
import { notificationService } from '../../notifications/NotificationService';
import { runbookRepository } from '../../database/repositories/RunbookRepository';
import { RunbookExecutionContext } from '../../runbooks/types';
import { randomUUID } from 'crypto';

import { incidentRepository } from '../../database/repositories/IncidentRepository';
import { incidentOrchestrator } from '../../mastra/services/incidentOrchestrator';

@EventHandler('IncidentCreated')
export class DecisionIncidentCreatedSubscriber implements IEventHandler {
  async handle(event: BaseDomainEvent): Promise<void> {
    const payload = event.payload as any;
    const incidentId = payload.incidentId;
    if (!incidentId) return;

    const incident = await incidentRepository.getIncidentById(incidentId);
    if (!incident || incident.aiReport) return; // Already analyzed or doesn't exist

    // Trigger AI Incident Pipeline
    await incidentOrchestrator.analyze({
      incidentId: incident.incidentId,
      rawLogs: incident.rawLogs || incident.description || 'No logs provided.',
      service: incident.service || 'unknown',
      environment: (incident.environment as any) || 'production',
      context: {
        requestId: event.correlationContext.requestId || randomUUID(),
        receivedAt: new Date().toISOString(),
        source: 'manual_creation'
      }
    });
  }
}

@EventHandler('IncidentAnalysisCompleted')
export class DecisionIncidentAnalysisCompletedSubscriber implements IEventHandler {
  async handle(event: BaseDomainEvent): Promise<void> {
    const payload = event.payload as any;
    const incidentId = payload.incidentId;
    if (!incidentId) return;

    // Trigger AI SRE decision execution
    const report = await decisionEngine.computeDecision(incidentId, payload);

    // If decision engine recommends Auto-Remediation, trigger the approved loop
    if (report.approvalRecommendation === 'AUTO_REMEDIATE') {
      eventPublisher.publish(
        'DecisionApproved',
        report.id,
        'Decision',
        report,
        event.correlationContext
      );
    }
  }
}

@EventHandler('DecisionApproved')
export class DecisionApprovedEventSubscriber implements IEventHandler {
  async handle(event: BaseDomainEvent): Promise<void> {
    const report = event.payload as any;
    const incidentId = report.incidentId;

    // Update state to EXECUTING
    await decisionRepository.updateDecision(report.id, 'EXECUTING');

    const recommendedRunbooks = report.recommendedRunbooks || [];
    if (recommendedRunbooks.length === 0) {
      await decisionRepository.updateDecision(
        report.id,
        'FAILED',
        'No recommended runbook found to execute'
      );
      eventPublisher.publish('DecisionRejected', report.id, 'Decision', report, event.correlationContext);
      return;
    }

    const topRunbook = recommendedRunbooks[0];
    const runbook = await runbookRepository.getRunbookById(topRunbook.runbookId);
    if (!runbook) {
      await decisionRepository.updateDecision(
        report.id,
        'FAILED',
        `Recommended runbook ${topRunbook.name} not found in database`
      );
      eventPublisher.publish('DecisionRejected', report.id, 'Decision', report, event.correlationContext);
      return;
    }

    // Prepare runbook execution context
    const executionId = randomUUID();
    const context: RunbookExecutionContext = {
      incidentId,
      runbookId: runbook.id,
      executionId,
      traceId: event.correlationContext.traceId,
      requestId: event.correlationContext.requestId,
      service: runbook.service,
      environment: 'production',
      node_modules: undefined, // Type check bypass
      severity: runbook.severity,
      aiAnalysis: report.evidence,
    };

    // Trigger runbook execution by publishing RunbookTriggered
    eventPublisher.publish(
      'RunbookTriggered',
      runbook.id,
      'Runbook',
      context,
      event.correlationContext
    );

    // Update state to EXECUTED
    await decisionRepository.updateDecision(
      report.id,
      'EXECUTED',
      `Auto-remediation completed using runbook ${runbook.name}. Execution ID: ${executionId}`
    );

    eventPublisher.publish(
      'DecisionExecuted',
      report.id,
      'Decision',
      { decisionId: report.id, executionId },
      event.correlationContext
    );
  }
}

@EventHandler('DecisionRejected')
export class DecisionRejectedEventSubscriber implements IEventHandler {
  async handle(event: BaseDomainEvent): Promise<void> {
    const report = event.payload as any;
    await decisionRepository.updateDecision(report.id, 'OVERRIDDEN', 'Remediation rejected by operator.');
  }
}

@EventHandler('RiskCalculated')
export class DecisionRiskCalculatedSubscriber implements IEventHandler {
  async handle(event: BaseDomainEvent): Promise<void> {
    const risk = event.payload as any;
    const overallRisk = risk.overallRisk;

    if (overallRisk === 'CRITICAL' || overallRisk === 'HIGH') {
      // Package into CriticalAlert template format
      const notificationEvent: BaseDomainEvent = {
        eventId: randomUUID(),
        eventType: 'CriticalAlert',
        aggregateId: event.aggregateId,
        aggregateType: 'Incident',
        payload: {
          incidentId: event.correlationContext.incidentId,
          details: `CRITICAL SRE RISK DETECTED. Risk details: ${risk.reasoning}. Availability Impact: ${risk.availabilityImpact}.`,
        },
        occurredAt: new Date().toISOString(),
        correlationContext: event.correlationContext,
      };

      // Direct handleEvent execution
      await notificationService.handleEvent(notificationEvent);
    }
  }
}
export default DecisionApprovedEventSubscriber;
