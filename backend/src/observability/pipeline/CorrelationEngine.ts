import { AIContext, aiContextBuilder } from './AIContextBuilder';
import { LoggerService } from '../../mastra/services/loggerService';
import { eventPublisher } from '../../events/EventPublisher';
import { IncidentPipelineWorkflow, finalReportSchema } from '../../mastra/workflows/incidentPipelineWorkflow';
import { incidentRepository } from '../../database/repositories/IncidentRepository';
import { randomUUID } from 'crypto';
import { TelemetryReceivedPayload } from '../../events/types/EventTypes';

export interface TelemetryPayload {
  service: string;
  environment: string;
  logs: string;
  metrics?: Record<string, number>;
  traces?: unknown[];
}

export class CorrelationEngine {
  private log: LoggerService;

  constructor() {
    this.log = new LoggerService('CorrelationEngine');
  }

  /**
   * Normalizes raw OTLP/JSON telemetry, correlates it with K8s/Prometheus/Qdrant, 
   * builds the context, and kicks off the AI incident pipeline.
   */
  public async processTelemetry(payload: TelemetryPayload): Promise<string> {
    try {
      this.log.info(`[Telemetry Pipeline] Normalizing and correlating telemetry for ${payload.service} in ${payload.environment}`);
      
      const context: AIContext = await aiContextBuilder.buildContext(
        payload.service,
        payload.environment,
        payload.logs
      );

      this.log.info(`[Telemetry Pipeline] AI Context built successfully. Triggering Workflow.`);

      // 3. Kick off the AI pipeline
      const incidentId = randomUUID();
      
      eventPublisher.publish<TelemetryReceivedPayload>(
        'TelemetryReceived',
        incidentId,
        'Incident',
        { service: payload.service, environment: payload.environment, logCount: 1 },
        { incidentId, traceId: `trc-${incidentId}` }
      );

      const run = await IncidentPipelineWorkflow.createRun();
      const result = await run.start({ inputData: {
        incidentId,
        service: payload.service,
        environment: payload.environment,
        context: context as any
      }});

      if (result.status !== 'success') {
        throw new Error(`Workflow failed: ${result.status}`);
      }

      this.log.info(`[Telemetry Pipeline] Workflow completed successfully. Parsing final report.`);
      const report = finalReportSchema.parse(result.result);

      // Save incident to database (Source of Truth)
      this.log.info(`[Telemetry Pipeline] Saving incident ${incidentId} to Postgres database`);
      await incidentRepository.createIncident({
        incidentId,
        service: report.service,
        application: report.service,
        environment: report.environment,
        severity: report.incidentAnalysis?.severity || report.anomalyDetection.severity || 'low',
        status: report.status,
        title: report.incidentAnalysis?.summary || report.anomalyDetection.reason || 'Incident',
        summary: report.incidentAnalysis?.summary || report.anomalyDetection.reason || 'Incident',
        description: payload.logs.substring(0, 5000),
        rawLogs: payload.logs,
        confidenceScore: report.incidentAnalysis?.confidence || report.anomalyDetection.confidence || 0,
        rootCause: report.incidentAnalysis?.rootCause || 'Unknown',
        aiReport: report.incidentAnalysis || null,
        recommendations: report.incidentAnalysis?.suggestedActions ? { actions: report.incidentAnalysis.suggestedActions } : null,
        similarIncidents: report.similarIncidents || [],
        metadata: {
          anomalyDetection: report.anomalyDetection,
        },
      });

      // Publish IncidentAnalysisCompleted event to trigger runbooks, notifications, etc.
      this.log.info(`[Telemetry Pipeline] Publishing IncidentAnalysisCompleted event for ${incidentId}`);
      eventPublisher.publish(
        'IncidentAnalysisCompleted',
        incidentId,
        'Incident',
        {
          incidentId,
          confidence: report.anomalyDetection.confidence,
          isAnomaly: report.anomalyDetection.isAnomaly,
          rootCause: report.incidentAnalysis?.rootCause,
        },
        { incidentId, traceId: `trc-${incidentId}` }
      );
      
      return result.result?.incidentId || 'UNKNOWN';

    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.log.error(`[Telemetry Pipeline] Failed to process telemetry: ${msg}`);
      throw error;
    }
  }
}

export const correlationEngine = new CorrelationEngine();
export default correlationEngine;
