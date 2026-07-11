import { randomUUID } from 'crypto';
import { contextAggregator } from './ContextAggregator';
import { confidenceEngine } from './ConfidenceEngine';
import { riskEngine } from './risk/RiskEngine';
import { changeImpactAnalyzer } from './change-impact/ChangeImpactAnalyzer';
import { runbookRecommender } from './runbook/RunbookRecommender';
import { assignmentEngine } from './assignment/AssignmentEngine';
import { rootCauseEngine } from './root-cause/RootCauseEngine';
import { recommendationEngine } from './recommendation/RecommendationEngine';
import { decisionRepository } from '../repositories/DecisionRepository';
import { eventPublisher } from '../../events/EventPublisher';
import { broadcastService } from '../../realtime/services/BroadcastService';
import { DecisionReport, DecisionLifecycleState } from '../types';
import { LoggerService } from '../../mastra/services/loggerService';

export class DecisionEngine {
  private log = new LoggerService('DecisionEngine');

  public async computeDecision(incidentId: string, aiAnalysis: Record<string, any>): Promise<DecisionReport> {
    const startTime = Date.now();
    this.log.info(`[DecisionEngine] Computing SRE decision report for incident ${incidentId}`);

    // 1. Gather context
    const context = await contextAggregator.aggregate(incidentId, aiAnalysis);

    // 2. Execute sub-engines
    const risk = riskEngine.calculate(context);
    const confidence = confidenceEngine.calculate(context);
    const rootCauses = rootCauseEngine.calculate(context);
    const changeImpact = changeImpactAnalyzer.analyze(context);
    const runbooks = await runbookRecommender.recommend(context);
    const engineer = assignmentEngine.recommend(context);

    // 3. Generate recommendation report payload
    const recReport = recommendationEngine.generate(
      context,
      risk,
      confidence,
      runbooks,
      engineer,
      rootCauses,
      changeImpact
    );

    // 4. Decision Lifecycle & Remediation Strategy
    // Auto-remediate if overallScore >= 70, confidence >= 0.75, and overall risk is LOW/MEDIUM
    const isAutoRemediateAllowed =
      recReport.overallScore >= 70 &&
      confidence.overallConfidence >= 0.75 &&
      risk.overallRisk !== 'CRITICAL' &&
      risk.overallRisk !== 'HIGH';

    const approvalRecommendation = isAutoRemediateAllowed ? 'AUTO_REMEDIATE' : 'MANUAL_APPROVAL';
    const status: DecisionLifecycleState = isAutoRemediateAllowed ? 'GENERATED' : 'REVIEW_REQUIRED';

    const modelLatencyMs = 280; // Mocked model generation latency
    const executionTimeMs = Date.now() - startTime;

    const report: DecisionReport = {
      id: randomUUID(),
      incidentId,
      overallScore: recReport.overallScore,
      confidence: confidence.overallConfidence,
      riskLevel: risk.overallRisk,
      recommendedAction: recReport.recommendedAction,
      recommendedRunbooks: runbooks,
      recommendedEngineer: engineer,
      estimatedResolutionTime: recReport.estimatedResolutionTime,
      estimatedBusinessImpact: recReport.estimatedBusinessImpact,
      similarIncidents: recReport.similarIncidents,
      possibleRootCauses: rootCauses,
      reasoning: recReport.reasoning,
      evidence: recReport.evidence,
      supportingMetrics: recReport.supportingMetrics,
      supportingIncidents: recReport.supportingIncidents,
      confidenceBreakdown: {
        aiConfidence: confidence.aiConfidenceScore,
        telemetryQuality: confidence.telemetryQualityScore,
        historicalAccuracy: confidence.historicalAccuracyScore,
        similarityMatch: confidence.similarityMatchScore,
      },
      explanation: recReport.explanation,
      approvalRecommendation,
      status,
      outcome: null,
      version: 1,
      decisionModelVersion: 'sentinelflow-intelligence-v1',
      promptVersion: 'sre-decision-prompt-v1.4',
      embeddingVersion: 'huggingface-bge-large-v1.5',
      createdByModel: 'Mastra Agent',
      modelLatencyMs,
      tokenUsage: { promptTokens: 1140, completionTokens: 420, totalTokens: 1560 },
      executionTimeMs,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 5. Persist to Postgres
    const saved = await decisionRepository.saveDecision(report);

    // 6. Emit Observable Events
    const correlationCtx = {
      incidentId,
      tenantId: (context.incident.metadata?.organizationId as string) || ((context.incident as any).organizationId as string),
      traceId: randomUUID(),
      correlationId: randomUUID(),
    };

    eventPublisher.publish('DecisionCreated', saved.id, 'Decision', saved, correlationCtx);
    eventPublisher.publish('DecisionGenerated', saved.id, 'Decision', saved, correlationCtx);
    eventPublisher.publish('RiskCalculated', saved.id, 'Decision', risk, correlationCtx);
    eventPublisher.publish('RecommendationGenerated', saved.id, 'Decision', recReport, correlationCtx);
    eventPublisher.publish('RootCauseRanked', saved.id, 'Decision', { rootCauses }, correlationCtx);
    eventPublisher.publish('EngineerRecommended', saved.id, 'Decision', engineer, correlationCtx);
    eventPublisher.publish('RunbookRecommended', saved.id, 'Decision', { runbooks }, correlationCtx);
    eventPublisher.publish('ConfidenceCalculated', saved.id, 'Decision', confidence, correlationCtx);

    // 7. Stream Decision updates to existing realtime layer
    const orgId = correlationCtx.tenantId || 'global-org';
    const roomName = `org:${orgId}:dashboard`;

    // Broadcast to org dashboard
    await broadcastService.broadcastToRoom(roomName, orgId, 'intelligence:decision_update', saved);

    // Broadcast to specific incident room
    await broadcastService.broadcastToRoom(`incident:${incidentId}`, orgId, 'intelligence:decision_update', saved);

    this.log.info(`[DecisionEngine] Completed SRE decision for incident ${incidentId}. Status: ${status}`);

    return saved;
  }
}

export const decisionEngine = new DecisionEngine();
export default decisionEngine;
