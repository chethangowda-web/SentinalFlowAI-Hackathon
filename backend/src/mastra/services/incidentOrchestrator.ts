import { z } from 'zod';
import { IncidentPipelineWorkflow, finalReportSchema } from '../workflows/incidentPipelineWorkflow';
import { qdrantMemory } from './qdrantMemory';
import { incidentRepository } from '../../database/repositories/IncidentRepository';
import { eventPublisher } from '../../events/EventPublisher';
import { domainEvents } from '../../incidents/events/DomainEvents';
import { TimelineEventType } from '../../incidents/types/status';
import { LoggerService } from './loggerService';
import type { Mastra } from '@mastra/core/mastra';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RequestContext {
  requestId: string;
  userId?: string;
  traceId?: string;
  receivedAt: string;
  source?: string;
}

export interface AnalyzeIncidentInput {
  incidentId: string;
  rawLogs: string;
  service: string;
  environment: 'dev' | 'staging' | 'production';
  context: RequestContext;
}

export type FinalReport = z.infer<typeof finalReportSchema>;

export interface OrchestratorError {
  code: string;
  message: string;
  timestamp: string;
  details?: unknown;
}

export interface OrchestratorSuccess {
  success: true;
  incidentId: string;
  report: FinalReport;
  durationMs: number;
}

export interface OrchestratorFailure {
  success: false;
  incidentId: string;
  error: OrchestratorError;
  durationMs: number;
}

export type OrchestratorResult = OrchestratorSuccess | OrchestratorFailure;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildError(code: string, message: string, details?: unknown): OrchestratorError {
  return {
    code,
    message,
    timestamp: new Date().toISOString(),
    ...(details !== undefined && { details }),
  };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class IncidentOrchestrator {

  constructor() {}

  /**
   * Execute the full incident analysis pipeline.
   *
   * 1. Ensure Qdrant is initialised (delegated to QdrantMemoryService).
   * 2. Execute the workflow.
   * 3. Validate the output.
   * 4. Return a structured result with timing.
   *
   * @param input  Validated incident request data with context.
   * @param mastra Optional Mastra instance for logger resolution.
   */
  public async analyze(
    input: AnalyzeIncidentInput,
    mastra?: Mastra,
  ): Promise<OrchestratorResult> {
    const log = new LoggerService('IncidentOrchestrator', mastra?.getLogger());
    const startTime = performance.now();
    const { incidentId, context } = input;

    log.info(`[${incidentId}] Starting incident analysis (requestId: ${context.requestId})`);

    // ---------------------------------------------------------------------
    // 1. Ensure Qdrant is initialised (concurrency-safe, self-managed)
    // ---------------------------------------------------------------------

    try {
      await qdrantMemory.ensureInitialized();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown Error';
      log.warn(`[${incidentId}] Qdrant initialisation failed (falling back to degraded mode): ${msg}`);
    }

    // ---------------------------------------------------------------------
    // 2. Execute the workflow
    // ---------------------------------------------------------------------

    try {
      log.info(`[${incidentId}] Creating workflow run`);

      const run = await IncidentPipelineWorkflow.createRun();
      const result = await run.start({ inputData: input });

      if (result.status === 'failed') {
        const msg = result.error instanceof Error ? result.error.message : 'Unknown Error';
        log.error(`[${incidentId}] Workflow failed: ${msg}`);
        return {
          success: false,
          incidentId,
          error: buildError('WORKFLOW_FAILED', msg),
          durationMs: Math.round(performance.now() - startTime),
        };
      }

      if (result.status !== 'success') {
        log.error(`[${incidentId}] Workflow ended with unexpected status: ${result.status}`);
        return {
          success: false,
          incidentId,
          error: buildError('WORKFLOW_UNEXPECTED_STATUS', `Unexpected status: ${result.status}`),
          durationMs: Math.round(performance.now() - startTime),
        };
      }

      // -------------------------------------------------------------------
      // 3. Validate the output
      // -------------------------------------------------------------------

      const report = finalReportSchema.parse(result.result);

      // -------------------------------------------------------------------
      // 4. Persist to PostgreSQL (Source of Truth)
      // -------------------------------------------------------------------
      try {
        log.info(`[${incidentId}] Persisting authoritative incident record to database`);
        
        const decision = report.decisionIntelligence?.decisionReport;
        const recommendations = decision?.recommendations 
          ? { actions: decision.recommendations } 
          : report.incidentAnalysis?.suggestedActions 
            ? { actions: report.incidentAnalysis.suggestedActions } 
            : null;

        await incidentRepository.createIncident({
          incidentId,
          service: report.service,
          application: report.service,
          environment: report.environment,
          severity: decision?.severity || report.incidentAnalysis?.severity || report.anomalyDetection.severity || 'low',
          status: report.status,
          title: decision?.reasoning || report.incidentAnalysis?.summary || report.anomalyDetection.reason || 'Incident',
          summary: decision?.reasoning || report.incidentAnalysis?.summary || report.anomalyDetection.reason || 'Incident',
          description: input.rawLogs.substring(0, 5000), // Ensure we don't blow up if logs are huge, but they are stored
          rawLogs: input.rawLogs,
          confidenceScore: decision?.confidence || report.incidentAnalysis?.confidence || report.anomalyDetection.confidence || 0,
          rootCause: report.rootCauseAnalysis?.rootCause || report.incidentAnalysis?.rootCause || 'Unknown',
          aiReport: report || null,
          recommendations,
          similarIncidents: report.similarIncidents || [],
          metadata: {
            context: input.context,
            anomalyDetection: report.anomalyDetection,
            enkryptAiGovernance: report.enkryptAiGovernance,
          },
        });
      } catch (dbError) {
        const msg = dbError instanceof Error ? dbError.message : 'Unknown Database Error';
        log.error(`[${incidentId}] Database persistence failed: ${msg}`);
        return {
          success: false,
          incidentId,
          error: buildError('DATABASE_PERSISTENCE_FAILED', msg),
          durationMs: Math.round(performance.now() - startTime),
        };
      }

      domainEvents.emitTimelineEvent({
        incidentId,
        actor: 'SYSTEM_AI',
        action: TimelineEventType.AI_ANALYSIS_COMPLETED,
        metadata: { confidence: report.decisionIntelligence?.decisionReport?.confidence || report.incidentAnalysis?.confidence || report.anomalyDetection.confidence }
      });

      // -------------------------------------------------------------------
      // 5. Emit Orchestrator Events
      // -------------------------------------------------------------------
      eventPublisher.publish(
        'IncidentAnalysisCompleted',
        incidentId,
        'Incident',
        {
          incidentId,
          confidence: report.decisionIntelligence?.decisionReport?.confidence || report.incidentAnalysis?.confidence || report.anomalyDetection.confidence,
          isAnomaly: report.anomalyDetection.isAnomaly,
          rootCause: report.rootCauseAnalysis?.rootCause || report.incidentAnalysis?.rootCause || 'Unknown',
        },
        { incidentId, traceId: `trc-${incidentId}` }
      );

      const durationMs = Math.round(performance.now() - startTime);

      log.info(`[${incidentId}] Analysis complete — status: ${report.status} — total: ${(durationMs / 1000).toFixed(2)}s`);

      return { success: true, incidentId: report.incidentId, report, durationMs };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown Error';
      log.error(`[${incidentId}] Orchestration error: ${msg}`);
      return {
        success: false,
        incidentId,
        error: buildError('ORCHESTRATION_ERROR', msg),
        durationMs: Math.round(performance.now() - startTime),
      };
    }
  }
}

export const incidentOrchestrator = new IncidentOrchestrator();
