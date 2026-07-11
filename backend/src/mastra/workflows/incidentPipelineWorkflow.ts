import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { anomalyDetectionSchema, anomalyDetector } from '../agents/anomalyDetector';
import { incidentAnalysisSchema, incidentAnalyzer } from '../agents/incidentAnalyzer';
import { embeddingService } from '../services/embeddingService';
import { qdrantMemory } from '../services/qdrantMemory';
import { eventPublisher } from '../../events/EventPublisher';
import { incidentRepository } from '../../database/repositories/IncidentRepository';

function parseAgentResponse(text: string, object?: any): any {
  if (object) return object;
  if (!text) throw new Error('Agent returned empty response');

  const cleanJson = (str: string) => {
    return str
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* ... */
      .replace(/(^|[^:"])\/\/.*$/gm, '$1'); // Remove // ... but NOT http://
  };

  try {
    return JSON.parse(cleanJson(text));
  } catch (e) {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(cleanJson(match[0]));
      } catch (innerErr) {
        throw new Error(`Failed to parse extracted JSON block: ${match[0]}. Original text: ${text}`);
      }
    }
    throw new Error(`Agent response does not contain valid JSON: ${text}`);
  }
}

// ---------------------------------------------------------------------------
// Helpers & Schemas
// ---------------------------------------------------------------------------

const logStep = (incidentId: string, step: string) => {
  console.log(`[IncidentPipeline] [Incident ${incidentId}] ${step} started at ${new Date().toISOString()}`);
};

const aiContextSchema = z.object({
  environment: z.string(),
  service: z.string(),
  telemetryLogs: z.string(),
  metricsSummary: z.string(),
  recentDeployments: z.string(),
  kubernetesEvents: z.string(),
  activeAlerts: z.string(),
  historicalResolutions: z.string(),
});

const similarIncidentSchema = z.object({
  incidentId: z.string(),
  score: z.number(),
  payload: z.record(z.string(), z.unknown()),
});

// ---------------------------------------------------------------------------
// Step 1 — Generate embedding from raw logs
// ---------------------------------------------------------------------------

const generateEmbeddingStep = createStep({
  id: 'generate-embedding',
  description: 'Generate a vector embedding from the raw logs in context',
  inputSchema: z.object({
    incidentId: z.string(),
    service: z.string(),
    environment: z.enum(['dev', 'staging', 'production']),
    context: aiContextSchema,
  }),
  outputSchema: z.object({
    incidentId: z.string(),
    service: z.string(),
    environment: z.enum(['dev', 'staging', 'production']),
    context: aiContextSchema,
    embedding: z.array(z.number()),
  }),
  execute: async ({ inputData }) => {
    if (!inputData) throw new Error('inputData is required');
    logStep(inputData.incidentId, 'GenerateEmbeddingStep');

    let embedding: number[] = [];
    if (!qdrantMemory.isDegraded()) {
      embedding = await embeddingService.generateEmbedding(inputData.context.telemetryLogs);
    } else {
      console.log(`[IncidentPipeline] Qdrant is degraded, skipping embedding generation.`);
    }
    
    eventPublisher.publish(
      'EmbeddingGenerated',
      inputData.incidentId,
      'Incident',
      { incidentId: inputData.incidentId, dimensions: embedding.length },
      { incidentId: inputData.incidentId }
    );

    return { ...inputData, embedding };
  },
});

// ---------------------------------------------------------------------------
// Step 2 — Search similar incidents
// ---------------------------------------------------------------------------

const searchSimilarIncidentsStep = createStep({
  id: 'search-similar-incidents',
  description: 'Search Qdrant for previously stored similar incidents',
  inputSchema: z.object({
    incidentId: z.string(),
    service: z.string(),
    environment: z.enum(['dev', 'staging', 'production']),
    context: aiContextSchema,
    embedding: z.array(z.number()),
  }),
  outputSchema: z.object({
    incidentId: z.string(),
    service: z.string(),
    environment: z.enum(['dev', 'staging', 'production']),
    context: aiContextSchema,
    embedding: z.array(z.number()),
    similarIncidents: z.array(similarIncidentSchema),
  }),
  execute: async ({ inputData }) => {
    if (!inputData) throw new Error('inputData is required');
    logStep(inputData.incidentId, 'SearchSimilarIncidentsStep');

    let similarIncidents: any[] = [];
    if (qdrantMemory.isDegraded()) {
      console.log(`[IncidentPipeline] Qdrant is degraded, falling back to PostgreSQL history search.`);
      const historicalIncidents = await incidentRepository.getIncidents({
        service: inputData.service,
        limit: 5,
        offset: 0,
      });
      similarIncidents = historicalIncidents.map(inc => ({
        incidentId: inc.incidentId,
        score: 1.0,
        payload: {
          incidentId: inc.incidentId,
          service: inc.service,
          severity: inc.severity,
          summary: inc.summary,
          rootCause: inc.rootCause,
          resolution: inc.resolution ? (inc.resolution as any).summary : null,
        }
      }));
    } else {
      similarIncidents = await qdrantMemory.searchSimilarIncidents({
        embedding: inputData.embedding,
        limit: 5,
      });
    }
    
    // Inject historical resolutions into the context before passing it to AI
    const historicalResolutions = similarIncidents
      .map(si => `Incident ${si.payload.incidentId} (${si.score.toFixed(2)} match): ${si.payload.resolution || 'No resolution logged'}`)
      .join('\n') || 'No historical resolutions found.';

    inputData.context.historicalResolutions = historicalResolutions;

    eventPublisher.publish(
      'SimilaritySearchCompleted',
      inputData.incidentId,
      'Incident',
      { incidentId: inputData.incidentId, matchCount: similarIncidents.length },
      { incidentId: inputData.incidentId }
    );

    return { ...inputData, similarIncidents };
  },
});

// ---------------------------------------------------------------------------
// Step 3 — Run anomaly detector
// ---------------------------------------------------------------------------

const runAnomalyDetectorStep = createStep({
  id: 'run-anomaly-detector',
  description: 'Use anomalyDetector agent to determine whether the telemetry is anomalous',
  inputSchema: z.object({
    incidentId: z.string(),
    service: z.string(),
    environment: z.enum(['dev', 'staging', 'production']),
    context: aiContextSchema,
    embedding: z.array(z.number()),
    similarIncidents: z.array(similarIncidentSchema),
  }),
  outputSchema: z.object({
    incidentId: z.string(),
    service: z.string(),
    environment: z.enum(['dev', 'staging', 'production']),
    context: aiContextSchema,
    embedding: z.array(z.number()),
    similarIncidents: z.array(similarIncidentSchema),
    anomalyDetection: anomalyDetectionSchema,
  }),
  execute: async ({ inputData, mastra }) => {
    if (!inputData) throw new Error('inputData is required');
    logStep(inputData.incidentId, 'RunAnomalyDetectorStep');

    const agent = mastra?.getAgent('anomalyDetector') || anomalyDetector;
    if (!agent) throw new Error('[IncidentPipeline] Anomaly Detector agent not found');

    const prompt = `Context:\n${JSON.stringify(inputData.context, null, 2)}`;
    const response = await agent.generate(prompt);
    
    const parsed = parseAgentResponse(response.text, response.object);

    if (parsed) {
      if (!parsed.affectedService) parsed.affectedService = inputData.service;
      if (!parsed.severity) parsed.severity = 'MEDIUM';
      if (!parsed.timestamp) parsed.timestamp = new Date().toISOString();
      if (parsed.isAnomaly === undefined) parsed.isAnomaly = true;
      if (parsed.confidence === undefined) parsed.confidence = 0.8;
    }

    eventPublisher.publish(
      'AnomalyDetected',
      inputData.incidentId,
      'Incident',
      { 
        incidentId: inputData.incidentId, 
        isAnomaly: parsed.isAnomaly,
        score: parsed.confidence
      },
      { incidentId: inputData.incidentId }
    );

    return { ...inputData, anomalyDetection: parsed };
  },
});

// ---------------------------------------------------------------------------
// Step 4 — Anomaly gate
// ---------------------------------------------------------------------------

const anomalyGateStep = createStep({
  id: 'anomaly-gate',
  description: 'Return NORMAL_INCIDENT if nothing anomalous',
  inputSchema: z.object({
    incidentId: z.string(),
    service: z.string(),
    environment: z.enum(['dev', 'staging', 'production']),
    context: aiContextSchema,
    embedding: z.array(z.number()),
    similarIncidents: z.array(similarIncidentSchema),
    anomalyDetection: anomalyDetectionSchema,
  }),
  outputSchema: z.object({
    incidentId: z.string(),
    service: z.string(),
    environment: z.enum(['dev', 'staging', 'production']),
    context: aiContextSchema,
    embedding: z.array(z.number()),
    similarIncidents: z.array(similarIncidentSchema),
    anomalyDetection: anomalyDetectionSchema,
    status: z.enum(['NORMAL_INCIDENT', 'ANOMALY_DETECTED']),
  }),
  execute: async ({ inputData }) => {
    if (!inputData) throw new Error('inputData is required');
    logStep(inputData.incidentId, 'AnomalyGateStep');
    const status = inputData.anomalyDetection.isAnomaly ? 'ANOMALY_DETECTED' : 'NORMAL_INCIDENT';
    return { ...inputData, status };
  },
});

// ---------------------------------------------------------------------------
// Step 5 — Run incident analyzer
// ---------------------------------------------------------------------------

const runIncidentAnalyzerStep = createStep({
  id: 'run-incident-analyzer',
  description: 'Use incidentAnalyzer agent to produce a full incident analysis based on rich context',
  inputSchema: z.object({
    incidentId: z.string(),
    service: z.string(),
    environment: z.enum(['dev', 'staging', 'production']),
    context: aiContextSchema,
    embedding: z.array(z.number()),
    similarIncidents: z.array(similarIncidentSchema),
    anomalyDetection: anomalyDetectionSchema,
    status: z.enum(['NORMAL_INCIDENT', 'ANOMALY_DETECTED']),
  }),
  outputSchema: z.object({
    incidentId: z.string(),
    service: z.string(),
    environment: z.enum(['dev', 'staging', 'production']),
    context: aiContextSchema,
    embedding: z.array(z.number()),
    similarIncidents: z.array(similarIncidentSchema),
    anomalyDetection: anomalyDetectionSchema,
    status: z.enum(['NORMAL_INCIDENT', 'ANOMALY_DETECTED']),
    incidentAnalysis: incidentAnalysisSchema.optional(),
  }),
  execute: async ({ inputData, mastra }) => {
    if (!inputData) throw new Error('inputData is required');
    logStep(inputData.incidentId, 'RunIncidentAnalyzerStep');

    if (inputData.status === 'NORMAL_INCIDENT') return { ...inputData, incidentAnalysis: undefined };

    const agent = mastra?.getAgent('incidentAnalyzer') || incidentAnalyzer;
    if (!agent) throw new Error('[IncidentPipeline] Incident Analyzer agent not found');

    const prompt = `Context:\n${JSON.stringify(inputData.context, null, 2)}`;
    const response = await agent.generate(prompt);
    
    const parsed = parseAgentResponse(response.text, response.object);

    if (parsed) {
      if (!parsed.service) parsed.service = inputData.service;
      if (!parsed.incidentId) parsed.incidentId = inputData.incidentId;
      if (!parsed.timestamp) parsed.timestamp = new Date().toISOString();
      if (!parsed.severity) parsed.severity = 'MEDIUM';
      if (!parsed.recommendedPriority) parsed.recommendedPriority = 'P3';
      if (!parsed.counterEvidence) parsed.counterEvidence = [];
      if (!parsed.relatedTechnologies) parsed.relatedTechnologies = [];
      if (!parsed.evidence) parsed.evidence = [];
      if (!parsed.anomalousLogLines) parsed.anomalousLogLines = [];
      if (!parsed.suggestedActions) parsed.suggestedActions = [];
    }

    return { ...inputData, incidentAnalysis: parsed };
  },
});

// ---------------------------------------------------------------------------
// Step 6 — Store analyzed incident into Qdrant
// ---------------------------------------------------------------------------

const storeIncidentStep = createStep({
  id: 'store-incident',
  description: 'Persist the analyzed incident into Qdrant for future similarity searches',
  inputSchema: z.object({
    incidentId: z.string(),
    service: z.string(),
    environment: z.enum(['dev', 'staging', 'production']),
    context: aiContextSchema,
    embedding: z.array(z.number()),
    similarIncidents: z.array(similarIncidentSchema),
    anomalyDetection: anomalyDetectionSchema,
    status: z.enum(['NORMAL_INCIDENT', 'ANOMALY_DETECTED']),
    incidentAnalysis: incidentAnalysisSchema.optional(),
  }),
  outputSchema: z.object({
    incidentId: z.string(),
    service: z.string(),
    environment: z.enum(['dev', 'staging', 'production']),
    context: aiContextSchema,
    embedding: z.array(z.number()),
    similarIncidents: z.array(similarIncidentSchema),
    anomalyDetection: anomalyDetectionSchema,
    status: z.enum(['NORMAL_INCIDENT', 'ANOMALY_DETECTED']),
    incidentAnalysis: incidentAnalysisSchema.optional(),
  }),
  execute: async ({ inputData }) => {
    if (!inputData) throw new Error('inputData is required');
    logStep(inputData.incidentId, 'StoreIncidentStep');

    if (inputData.status === 'NORMAL_INCIDENT') return inputData;

    const analysis = inputData.incidentAnalysis;
    await qdrantMemory.storeIncident({
      incidentId: inputData.incidentId,
      service: inputData.service,
      severity: analysis?.severity ?? inputData.anomalyDetection.severity,
      summary: analysis?.summary ?? inputData.anomalyDetection.reason,
      rootCause: analysis?.rootCause ?? 'Unknown',
      embedding: inputData.embedding,
      metadata: {
        environment: inputData.environment,
        storedAt: new Date().toISOString(),
      },
    });

    return inputData;
  },
});

// ---------------------------------------------------------------------------
// Step 7 — Build final incident report
// ---------------------------------------------------------------------------

export const finalReportSchema = z.object({
  incidentId: z.string(),
  status: z.enum(['NORMAL_INCIDENT', 'ANOMALY_DETECTED']),
  service: z.string(),
  environment: z.enum(['dev', 'staging', 'production']),
  anomalyDetection: anomalyDetectionSchema,
  incidentAnalysis: incidentAnalysisSchema.optional(),
  similarIncidents: z.array(similarIncidentSchema),
  generatedAt: z.string(),
});

const buildFinalReportStep = createStep({
  id: 'build-final-report',
  description: 'Assemble and return the final incident report',
  inputSchema: z.object({
    incidentId: z.string(),
    service: z.string(),
    environment: z.enum(['dev', 'staging', 'production']),
    context: aiContextSchema,
    embedding: z.array(z.number()),
    similarIncidents: z.array(similarIncidentSchema),
    anomalyDetection: anomalyDetectionSchema,
    status: z.enum(['NORMAL_INCIDENT', 'ANOMALY_DETECTED']),
    incidentAnalysis: incidentAnalysisSchema.optional(),
  }),
  outputSchema: finalReportSchema,
  execute: async ({ inputData }) => {
    if (!inputData) throw new Error('inputData is required');
    logStep(inputData.incidentId, 'BuildFinalReportStep');

    return {
      incidentId: inputData.incidentId,
      status: inputData.status,
      service: inputData.service,
      environment: inputData.environment,
      anomalyDetection: inputData.anomalyDetection,
      incidentAnalysis: inputData.incidentAnalysis,
      similarIncidents: inputData.similarIncidents,
      generatedAt: new Date().toISOString(),
    };
  },
});

// ---------------------------------------------------------------------------
// Workflow assembly
// ---------------------------------------------------------------------------

export const IncidentPipelineWorkflow = createWorkflow({
  id: 'IncidentPipelineWorkflow',
  inputSchema: z.object({
    incidentId: z.string(),
    service: z.string(),
    environment: z.enum(['dev', 'staging', 'production']),
    context: aiContextSchema,
  }),
  outputSchema: finalReportSchema,
})
  .then(generateEmbeddingStep)
  .then(searchSimilarIncidentsStep)
  .then(runAnomalyDetectorStep)
  .then(anomalyGateStep)
  .then(runIncidentAnalyzerStep)
  .then(storeIncidentStep)
  .then(buildFinalReportStep);

IncidentPipelineWorkflow.commit();
