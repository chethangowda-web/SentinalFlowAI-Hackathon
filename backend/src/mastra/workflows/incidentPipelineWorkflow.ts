import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { anomalyDetectionSchema } from '../agents/incident/anomalyDetector';
import { incidentAnalysisSchema } from '../agents/incident/incidentAnalyzer';
import { incidentAnalyzer } from '../agents/incident/incidentAnalyzer';
import { anomalyDetector } from '../agents/incident/anomalyDetector';
import { rootCauseAnalyzer } from '../agents/incident/rootCauseAnalyzer';
import { decisionIntelligence } from '../agents/incident/decisionIntelligence';
import { postmortemGenerator } from '../agents/incident/postmortemGenerator';
import { runbookRecommender } from '../agents/operations/runbookRecommender';
import { kubernetesOperations, executeKubernetesOperationsProgrammatically } from '../agents/operations/kubernetesOperations';
import { infrastructureMonitoring, executeInfrastructureMonitoringProgrammatically } from '../agents/operations/infrastructureMonitoring';
import { alertCorrelation, executeAlertCorrelationProgrammatically } from '../agents/incident/alertCorrelation';
import { securityCompliance, executeSecurityComplianceProgrammatically } from '../agents/security/securityCompliance';
import { learningAgent, executeLearningAgentProgrammatically } from '../agents/learning/learningAgent';
import { enkryptAiGovernance, runGovernanceFirewall } from '../agents/governance/enkryptAiGovernance';
import { executeNotificationAgentProgrammatically } from '../agents/communication/notificationAgent';
import { embeddingService } from '../services/embeddingService';
import { qdrantMemory } from '../services/qdrantMemory';
import { aiOrchestratorService, RoutingDecision, AgentExecutionResult, OrchestrationContext } from '../services/AIOrchestratorService';
import { eventPublisher } from '../../events/EventPublisher';
import { incidentRepository } from '../../database/repositories/IncidentRepository';
import { timelineGenerator } from '../../intelligence/services/timelineGenerator';
import { costImpactEstimator } from '../../intelligence/services/CostImpactEstimator';
import { enkryptMiddleware } from '../../security/EnkryptMiddleware';
import { enkryptService } from '../../security/EnkryptService';

function parseAgentResponse(text: string, object?: any): any {
  if (object) return object;
  if (!text) throw new Error('Agent returned empty response');

  const cleanJson = (str: string) => {
    return str
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:"])\/\/.*$/gm, '$1');
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

/**
 * Wrapper to execute an LLM agent call with Enkrypt AI governance
 * Scans prompt before LLM and response after LLM.
 * Publishes AgentStarted/AgentCompleted/AgentFailed WebSocket events.
 */
async function executeAgentWithGovernance(
  incidentId: string,
  agentName: string,
  prompt: string,
  agentGenerate: () => Promise<{ text: string; object?: any }>
): Promise<{ text: string; object?: any }> {
  const startTime = Date.now();

  eventPublisher.publish(
    'AgentStarted',
    incidentId,
    'Incident',
    { incidentId, agentName, timestamp: new Date().toISOString() },
    { incidentId }
  );

  const guardResult = await enkryptMiddleware.wrapAgentCall(
    incidentId,
    agentName,
    prompt,
    () => agentGenerate(),
    (r) => r.text
  );

  const durationMs = Date.now() - startTime;

  if (guardResult.blocked) {
    console.warn(`[Enkrypt] Agent ${agentName} blocked: ${guardResult.blockedReason}`);
    eventPublisher.publish(
      'AgentFailed',
      incidentId,
      'Incident',
      { incidentId, agentName, reason: guardResult.blockedReason, durationMs, timestamp: new Date().toISOString() },
      { incidentId }
    );
    throw new Error(`Enkrypt AI blocked ${agentName}: ${guardResult.blockedReason}`);
  }

  eventPublisher.publish(
    'AgentCompleted',
    incidentId,
    'Incident',
    { incidentId, agentName, durationMs, timestamp: new Date().toISOString() },
    { incidentId }
  );

  return guardResult.result!;
}

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

const agentResultSchema = z.object({
  agent: z.string(),
  status: z.string(),
  confidence: z.number(),
  summary: z.string(),
  reasoning: z.string(),
  evidence: z.array(z.string()),
  recommendations: z.array(z.string()),
  nextActions: z.array(z.string()),
  sources: z.array(z.string()),
  durationMs: z.number(),
});

const confidenceAggregationSchema = z.object({
  overallConfidence: z.number(),
  aiTrust: z.number(),
  risk: z.string(),
  escalationNeeded: z.boolean(),
  humanApprovalRequired: z.boolean(),
  details: z.object({
    agentConfidenceAvg: z.number(),
    telemetryRichnessScore: z.number(),
    historicalSimilarityScore: z.number(),
    governanceTrust: z.number(),
  }),
});

// ---------------------------------------------------------------------------
// Step 1 — Incident Intake & Embedding Generation
// ---------------------------------------------------------------------------

const incidentIntakeStep = createStep({
  id: 'incident-intake',
  description: 'Generate embedding from raw logs and prepare orchestration context',
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
    orchestratorInput: z.any(),
  }),
  execute: async ({ inputData }) => {
    if (!inputData) throw new Error('inputData is required');
    logStep(inputData.incidentId, 'IncidentIntakeStep');

    let embedding: number[] = [];
    if (!qdrantMemory.isDegraded()) {
      embedding = await embeddingService.generateEmbedding(inputData.context.telemetryLogs);
    }

    const orchestratorInput: OrchestrationContext = {
      incidentId: inputData.incidentId,
      service: inputData.service,
      environment: inputData.environment,
      severity: 'MEDIUM',
      telemetryLogs: inputData.context.telemetryLogs,
      metricsSummary: inputData.context.metricsSummary,
      kubernetesEvents: inputData.context.kubernetesEvents,
      recentDeployments: inputData.context.recentDeployments,
      activeAlerts: inputData.context.activeAlerts,
      historicalResolutions: inputData.context.historicalResolutions,
    };

    // Initialize Enkrypt AI governance context
    enkryptMiddleware.initializeContext(inputData.incidentId, 'incident-pipeline');

    eventPublisher.publish(
      'IncidentIntakeCompleted',
      inputData.incidentId,
      'Incident',
      { incidentId: inputData.incidentId, dimensions: embedding.length },
      { incidentId: inputData.incidentId }
    );

    return { ...inputData, embedding, orchestratorInput };
  },
});

// ---------------------------------------------------------------------------
// Step 2 — Search Similar Incidents (Qdrant Memory RAG)
// ---------------------------------------------------------------------------

const learningRetrievalStep = createStep({
  id: 'learning-retrieval',
  description: 'Retrieve similar incidents and root causes from Qdrant memory before agent execution',
  inputSchema: z.object({
    incidentId: z.string(),
    service: z.string(),
    environment: z.enum(['dev', 'staging', 'production']),
    context: aiContextSchema,
    embedding: z.array(z.number()),
    orchestratorInput: z.any(),
  }),
  outputSchema: z.object({
    incidentId: z.string(),
    service: z.string(),
    environment: z.enum(['dev', 'staging', 'production']),
    context: aiContextSchema,
    embedding: z.array(z.number()),
    orchestratorInput: z.any(),
    similarIncidents: z.array(similarIncidentSchema),
  }),
  execute: async ({ inputData }) => {
    if (!inputData) throw new Error('inputData is required');
    logStep(inputData.incidentId, 'LearningRetrievalStep');

    let similarIncidents: any[] = [];
    if (qdrantMemory.isDegraded()) {
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

    const historicalResolutions = similarIncidents
      .map(si => `Incident ${si.payload.incidentId} (${si.score.toFixed(2)} match): ${si.payload.resolution || 'No resolution logged'}`)
      .join('\n') || 'No historical resolutions found.';

    inputData.context.historicalResolutions = historicalResolutions;
    inputData.orchestratorInput.historicalResolutions = historicalResolutions;

    return { ...inputData, similarIncidents };
  },
});

// ---------------------------------------------------------------------------
// Step 3 — Anomaly Detection
// ---------------------------------------------------------------------------

const runAnomalyDetectorStep = createStep({
  id: 'run-anomaly-detector',
  description: 'Detect anomalies in telemetry using anomalyDetector agent',
  inputSchema: z.object({
    incidentId: z.string(),
    service: z.string(),
    environment: z.enum(['dev', 'staging', 'production']),
    context: aiContextSchema,
    embedding: z.array(z.number()),
    orchestratorInput: z.any(),
    similarIncidents: z.array(similarIncidentSchema),
  }),
  outputSchema: z.object({
    incidentId: z.string(),
    service: z.string(),
    environment: z.enum(['dev', 'staging', 'production']),
    context: aiContextSchema,
    embedding: z.array(z.number()),
    orchestratorInput: z.any(),
    similarIncidents: z.array(similarIncidentSchema),
    anomalyDetection: anomalyDetectionSchema,
    orchestratorRouting: z.any().optional(),
  }),
  execute: async ({ inputData, mastra }) => {
    if (!inputData) throw new Error('inputData is required');
    logStep(inputData.incidentId, 'RunAnomalyDetectorStep');

    const agent = mastra?.getAgent('anomalyDetector') || anomalyDetector;
    if (!agent) throw new Error('[IncidentPipeline] Anomaly Detector agent not found');

    const prompt = `Context:\n${JSON.stringify(inputData.context, null, 2)}`;

    // Execute with Enkrypt AI governance
    let response: { text: string; object?: any };
    try {
      response = await executeAgentWithGovernance(
        inputData.incidentId,
        'anomaly-detector',
        prompt,
        () => agent.generate(prompt)
      );
    } catch (enkryptErr) {
      console.error(`[Enkrypt] Anomaly detector blocked: ${enkryptErr}`);
      // Fallback: allow anomaly detection to proceed with safe defaults
      const fallbackResponse = await agent.generate(prompt);
      response = fallbackResponse;
    }
    
    const parsed = parseAgentResponse(response.text, response.object);
    if (parsed) {
      if (!parsed.affectedService) parsed.affectedService = inputData.service;
      if (!parsed.severity) parsed.severity = 'MEDIUM';
      if (!parsed.timestamp) parsed.timestamp = new Date().toISOString();
      if (parsed.isAnomaly === undefined) parsed.isAnomaly = true;
      if (parsed.confidence === undefined) parsed.confidence = 0.8;
    }

    inputData.orchestratorInput.severity = parsed.severity || 'MEDIUM';

    // Route via AIOrchestratorService programmatically
    const routing: RoutingDecision = await aiOrchestratorService.route(inputData.orchestratorInput);

    eventPublisher.publish(
      'AnomalyDetected',
      inputData.incidentId,
      'Incident',
      { incidentId: inputData.incidentId, isAnomaly: parsed.isAnomaly, score: parsed.confidence, routing },
      { incidentId: inputData.incidentId }
    );

    return { ...inputData, anomalyDetection: parsed, orchestratorRouting: routing };
  },
});

// ---------------------------------------------------------------------------
// Step 4 — Infrastructure Monitoring
// ---------------------------------------------------------------------------

const infrastructureMonitoringStep = createStep({
  id: 'infrastructure-monitoring',
  description: 'Query Prometheus/Grafana metrics for infrastructure health',
  inputSchema: z.object({
    incidentId: z.string(),
    service: z.string(),
    context: aiContextSchema,
    anomalyDetection: anomalyDetectionSchema,
    orchestratorRouting: z.any().optional(),
    environment: z.enum(['dev', 'staging', 'production']).optional(),
    embedding: z.array(z.number()).optional(),
    orchestratorInput: z.any().optional(),
    similarIncidents: z.array(similarIncidentSchema).optional(),
  }),
  outputSchema: z.object({
    infrastructureMonitoring: z.any().optional(),
  }),
  execute: async ({ inputData }) => {
    if (!inputData) throw new Error('inputData is required');
    if (!inputData.anomalyDetection?.isAnomaly) return {};

    const routing = inputData.orchestratorRouting as RoutingDecision | undefined;
    if (routing && !routing.requiredAgents.includes('infrastructure-monitoring')) {
      return {};
    }

    logStep(inputData.incidentId, 'InfrastructureMonitoringStep');
    const result = await executeInfrastructureMonitoringProgrammatically(inputData.service);
    return { infrastructureMonitoring: result };
  },
});

// ---------------------------------------------------------------------------
// Step 5 — Kubernetes Operations
// ---------------------------------------------------------------------------

const kubernetesOperationsStep = createStep({
  id: 'kubernetes-operations',
  description: 'Analyze pod/node states from Kubernetes cluster',
  inputSchema: z.object({
    incidentId: z.string(),
    service: z.string(),
    context: aiContextSchema,
    anomalyDetection: anomalyDetectionSchema,
    orchestratorRouting: z.any().optional(),
    environment: z.enum(['dev', 'staging', 'production']).optional(),
    embedding: z.array(z.number()).optional(),
    orchestratorInput: z.any().optional(),
    similarIncidents: z.array(similarIncidentSchema).optional(),
  }),
  outputSchema: z.object({
    kubernetesOperations: z.any().optional(),
  }),
  execute: async ({ inputData }) => {
    if (!inputData) throw new Error('inputData is required');
    if (!inputData.anomalyDetection?.isAnomaly) return {};

    const routing = inputData.orchestratorRouting as RoutingDecision | undefined;
    if (routing && !routing.requiredAgents.includes('kubernetes-operations')) {
      return {};
    }

    logStep(inputData.incidentId, 'KubernetesOperationsStep');
    const result = await executeKubernetesOperationsProgrammatically(inputData.service, 'default');
    return { kubernetesOperations: result };
  },
});

// ---------------------------------------------------------------------------
// Step 6 — Security Compliance
// ---------------------------------------------------------------------------

const securityComplianceStep = createStep({
  id: 'security-compliance',
  description: 'Scan configurations for security violations',
  inputSchema: z.object({
    incidentId: z.string(),
    service: z.string(),
    context: aiContextSchema,
    anomalyDetection: anomalyDetectionSchema,
    orchestratorRouting: z.any().optional(),
    environment: z.enum(['dev', 'staging', 'production']).optional(),
    embedding: z.array(z.number()).optional(),
    orchestratorInput: z.any().optional(),
    similarIncidents: z.array(similarIncidentSchema).optional(),
  }),
  outputSchema: z.object({
    securityCompliance: z.any().optional(),
  }),
  execute: async ({ inputData }) => {
    if (!inputData) throw new Error('inputData is required');
    if (!inputData.anomalyDetection?.isAnomaly) return {};

    const routing = inputData.orchestratorRouting as RoutingDecision | undefined;
    if (routing && !routing.requiredAgents.includes('security-compliance')) {
      return {};
    }

    logStep(inputData.incidentId, 'SecurityComplianceStep');
    const result = await executeSecurityComplianceProgrammatically(inputData.context.telemetryLogs, 'kubernetes');
    return { securityCompliance: result };
  },
});

// ---------------------------------------------------------------------------
// Step 7 — Alert Correlation & Deployment Correlation
// ---------------------------------------------------------------------------

const alertCorrelationStep = createStep({
  id: 'alert-correlation',
  description: 'Correlate alerts and match deployment history to isolate deployment-caused outages',
  inputSchema: z.object({
    incidentId: z.string(),
    service: z.string(),
    context: aiContextSchema,
    anomalyDetection: anomalyDetectionSchema,
    orchestratorRouting: z.any().optional(),
    environment: z.enum(['dev', 'staging', 'production']).optional(),
    embedding: z.array(z.number()).optional(),
    orchestratorInput: z.any().optional(),
    similarIncidents: z.array(similarIncidentSchema).optional(),
  }),
  outputSchema: z.object({
    alertCorrelation: z.any().optional(),
    deploymentCorrelation: z.any().optional(),
  }),
  execute: async ({ inputData }) => {
    if (!inputData) throw new Error('inputData is required');
    if (!inputData.anomalyDetection?.isAnomaly) return {};

    const routing = inputData.orchestratorRouting as RoutingDecision | undefined;
    if (routing && !routing.requiredAgents.includes('alert-correlation')) {
      return {};
    }

    logStep(inputData.incidentId, 'AlertCorrelationStep');

    const alertCorr = await executeAlertCorrelationProgrammatically(inputData.service, inputData.context.telemetryLogs);

    const deploymentCorrelation = routing?.deploymentCorrelation || {
      recentDeploymentFound: false,
      deploymentDetails: [],
      rollbackSuggested: false,
    };

    eventPublisher.publish(
      'AlertCorrelationCompleted',
      inputData.incidentId,
      'Incident',
      {
        incidentId: inputData.incidentId,
        alertCount: alertCorr.correlatedAlerts?.length || 0,
        deploymentFound: deploymentCorrelation.recentDeploymentFound,
        rollbackSuggested: deploymentCorrelation.rollbackSuggested,
      },
      { incidentId: inputData.incidentId }
    );

    return {
      alertCorrelation: {
        ...alertCorr,
        deploymentCorrelation,
      },
      deploymentCorrelation,
    };
  },
});

// ---------------------------------------------------------------------------
// Step 8 — Root Cause Analysis
// ---------------------------------------------------------------------------

const rootCauseAnalysisStep = createStep({
  id: 'root-cause-analysis',
  description: 'Perform root cause analysis using LLM agent',
  inputSchema: z.object({
    incidentId: z.string(),
    service: z.string(),
    environment: z.enum(['dev', 'staging', 'production']).optional(),
    context: aiContextSchema,
    anomalyDetection: anomalyDetectionSchema,
    orchestratorRouting: z.any().optional(),
    similarIncidents: z.array(similarIncidentSchema).optional(),
    embedding: z.array(z.number()).optional(),
    orchestratorInput: z.any().optional(),
    infrastructureMonitoring: z.any().optional(),
    kubernetesOperations: z.any().optional(),
    securityCompliance: z.any().optional(),
    alertCorrelation: z.any().optional(),
    deploymentCorrelation: z.any().optional(),
  }),
  outputSchema: z.object({
    rootCauseAnalysis: z.any().optional(),
  }),
  execute: async ({ inputData, mastra }) => {
    if (!inputData) throw new Error('inputData is required');
    if (!inputData.anomalyDetection?.isAnomaly) return {};

    const routing = inputData.orchestratorRouting as RoutingDecision | undefined;
    if (routing && !routing.requiredAgents.includes('root-cause-analyzer')) {
      return {};
    }

    logStep(inputData.incidentId, 'RootCauseAnalysisStep');

    const agent = mastra?.getAgent('rootCauseAnalyzer') || rootCauseAnalyzer;
    const promptContext = `
Incident ID: ${inputData.incidentId}
Service: ${inputData.service}
Environment: ${inputData.environment}
Logs: ${inputData.context.telemetryLogs}
Metrics Summary: ${inputData.context.metricsSummary}
Kubernetes Events: ${inputData.context.kubernetesEvents}
Recent Deployments: ${inputData.context.recentDeployments}
Active Alerts: ${inputData.context.activeAlerts}
Historical Match: ${inputData.context.historicalResolutions}
Infrastructure: ${JSON.stringify(inputData.infrastructureMonitoring || {})}
K8s State: ${JSON.stringify(inputData.kubernetesOperations || {})}
Security: ${JSON.stringify(inputData.securityCompliance || {})}
Alerts: ${JSON.stringify(inputData.alertCorrelation || {})}
`;
    try {
      // Execute with Enkrypt AI governance
      const response = await executeAgentWithGovernance(
        inputData.incidentId,
        'root-cause-analyzer',
        promptContext,
        () => agent.generate(promptContext)
      );
      const parsed = parseAgentResponse(response.text, response.object);
      return { rootCauseAnalysis: parsed };
    } catch (err) {
      console.error('[Orchestrator] root-cause-analyzer execution failed:', err);
      return {};
    }
  },
});

// ---------------------------------------------------------------------------
// Step 9 — Runbook Recommendation
// ---------------------------------------------------------------------------

const runbookRecommendationStep = createStep({
  id: 'runbook-recommendation',
  description: 'Match incident with remediation runbooks from the database',
  inputSchema: z.object({
    incidentId: z.string(),
    service: z.string(),
    context: aiContextSchema,
    anomalyDetection: anomalyDetectionSchema,
    rootCauseAnalysis: z.any().optional(),
    environment: z.enum(['dev', 'staging', 'production']).optional(),
    orchestratorRouting: z.any().optional(),
    similarIncidents: z.array(similarIncidentSchema).optional(),
    embedding: z.array(z.number()).optional(),
    orchestratorInput: z.any().optional(),
  }),
  outputSchema: z.object({
    runbookRecommendation: z.any().optional(),
  }),
  execute: async ({ inputData, mastra }) => {
    if (!inputData) throw new Error('inputData is required');
    if (!inputData.anomalyDetection?.isAnomaly) return {};

    const routing = inputData.orchestratorRouting as RoutingDecision | undefined;
    if (routing && !routing.requiredAgents.includes('runbook-recommender')) {
      return {};
    }

    logStep(inputData.incidentId, 'RunbookRecommendationStep');

    const agent = mastra?.getAgent('runbookRecommender') || runbookRecommender;
    const promptContext = `
Incident ID: ${inputData.incidentId}
Service: ${inputData.service}
Root Cause: ${JSON.stringify(inputData.rootCauseAnalysis || {})}
Logs: ${inputData.context.telemetryLogs}
Historical Match: ${inputData.context.historicalResolutions}
`;
    try {
      // Execute with Enkrypt AI governance
      const response = await executeAgentWithGovernance(
        inputData.incidentId,
        'runbook-recommender',
        promptContext,
        () => agent.generate(promptContext)
      );
      const parsed = parseAgentResponse(response.text, response.object);
      return { runbookRecommendation: parsed };
    } catch (err) {
      console.error('[Orchestrator] runbook-recommender execution failed:', err);
      return {};
    }
  },
});

// ---------------------------------------------------------------------------
// Step 10 — Decision Intelligence
// ---------------------------------------------------------------------------

const runDecisionIntelligenceStep = createStep({
  id: 'run-decision-intelligence',
  description: 'Synthesize all agent reports into a decision intelligence report with cost impact',
  inputSchema: z.object({
    incidentId: z.string(),
    service: z.string(),
    environment: z.enum(['dev', 'staging', 'production']).optional(),
    context: aiContextSchema,
    anomalyDetection: anomalyDetectionSchema,
    orchestratorRouting: z.any().optional(),
    similarIncidents: z.array(similarIncidentSchema).optional(),
    embedding: z.array(z.number()).optional(),
    orchestratorInput: z.any().optional(),
    infrastructureMonitoring: z.any().optional(),
    kubernetesOperations: z.any().optional(),
    securityCompliance: z.any().optional(),
    alertCorrelation: z.any().optional(),
    deploymentCorrelation: z.any().optional(),
    rootCauseAnalysis: z.any().optional(),
    runbookRecommendation: z.any().optional(),
  }),
  outputSchema: z.object({
    decisionIntelligence: z.any().optional(),
    costImpact: z.any().optional(),
  }),
  execute: async ({ inputData, mastra }) => {
    if (!inputData) throw new Error('inputData is required');
    if (!inputData.anomalyDetection?.isAnomaly) return {};
    logStep(inputData.incidentId, 'RunDecisionIntelligenceStep');

    const agent = mastra?.getAgent('decisionIntelligence') || decisionIntelligence;
    const prompt = `
Compile and synthesize the following SRE analysis outputs into a final consolidated Decision Intelligence Report:
- Incident ID: ${inputData.incidentId}
- Service: ${inputData.service}
- Environment: ${inputData.environment}

Agent Outputs:
${JSON.stringify({
  infrastructureMonitoring: inputData.infrastructureMonitoring,
  kubernetesOperations: inputData.kubernetesOperations,
  securityCompliance: inputData.securityCompliance,
  alertCorrelation: inputData.alertCorrelation,
  rootCauseAnalysis: inputData.rootCauseAnalysis,
  runbookRecommendation: inputData.runbookRecommendation,
  deploymentCorrelation: inputData.deploymentCorrelation,
}, null, 2)}
`;

    let decisionIntelligenceReport: any = {};
    try {
      // Execute with Enkrypt AI governance
      const response = await executeAgentWithGovernance(
        inputData.incidentId,
        'decision-intelligence',
        prompt,
        () => agent.generate(prompt)
      );
      decisionIntelligenceReport = parseAgentResponse(response.text, response.object);
    } catch (err) {
      console.error('[Orchestrator] decision-intelligence execution failed:', err);
    }

    const costImpact = costImpactEstimator.estimate(
      inputData.anomalyDetection.severity || 'MEDIUM',
      inputData.environment || 'production',
      30
    );

    return { decisionIntelligence: decisionIntelligenceReport, costImpact };
  },
});

// ---------------------------------------------------------------------------
// Step 11 — Timeline Generator
// ---------------------------------------------------------------------------

const timelineGeneratorStep = createStep({
  id: 'timeline-generator',
  description: 'Compile a unified chronological incident timeline from all pipeline outputs',
  inputSchema: z.object({
    incidentId: z.string(),
    service: z.string(),
    context: aiContextSchema,
    anomalyDetection: anomalyDetectionSchema,
    decisionIntelligence: z.any().optional(),
    orchestratorRouting: z.any().optional(),
    environment: z.enum(['dev', 'staging', 'production']).optional(),
    embedding: z.array(z.number()).optional(),
    orchestratorInput: z.any().optional(),
    similarIncidents: z.array(similarIncidentSchema).optional(),
  }),
  outputSchema: z.object({
    timeline: z.any().optional(),
  }),
  execute: async ({ inputData }) => {
    if (!inputData) throw new Error('inputData is required');
    if (!inputData.anomalyDetection?.isAnomaly) return {};
    logStep(inputData.incidentId, 'TimelineGeneratorStep');

    const events = timelineGenerator.generate({
      telemetryLogs: inputData.context.telemetryLogs,
      metricsSummary: inputData.context.metricsSummary,
      kubernetesEvents: inputData.context.kubernetesEvents,
      recentDeployments: inputData.context.recentDeployments,
      activeAlerts: inputData.context.activeAlerts,
    });

    return { timeline: events };
  },
});

// ---------------------------------------------------------------------------
// Step 12 — Postmortem Generator
// ---------------------------------------------------------------------------

const postmortemGeneratorStep = createStep({
  id: 'postmortem-generator',
  description: 'Generate structured postmortem document from pipeline findings',
  inputSchema: z.object({
    incidentId: z.string(),
    service: z.string(),
    environment: z.enum(['dev', 'staging', 'production']).optional(),
    context: aiContextSchema,
    anomalyDetection: anomalyDetectionSchema,
    decisionIntelligence: z.any().optional(),
    rootCauseAnalysis: z.any().optional(),
    costImpact: z.any().optional(),
    timeline: z.any().optional(),
    orchestratorRouting: z.any().optional(),
    similarIncidents: z.array(similarIncidentSchema).optional(),
    embedding: z.array(z.number()).optional(),
    orchestratorInput: z.any().optional(),
  }),
  outputSchema: z.object({
    postmortem: z.any().optional(),
  }),
  execute: async ({ inputData, mastra }) => {
    if (!inputData) throw new Error('inputData is required');
    if (!inputData.anomalyDetection?.isAnomaly) return {};
    logStep(inputData.incidentId, 'PostmortemGeneratorStep');

    const agent = mastra?.getAgent('postmortemGenerator') || postmortemGenerator;
    const prompt = `
Generate a structured postmortem report for Incident ${inputData.incidentId}.

Service: ${inputData.service}
Environment: ${inputData.environment}
Severity: ${inputData.anomalyDetection.severity}

Root Cause: ${JSON.stringify(inputData.rootCauseAnalysis || {})}
Timeline Events: ${JSON.stringify(inputData.timeline || [])}
Decision Report: ${JSON.stringify(inputData.decisionIntelligence || {})}
Cost Impact: ${JSON.stringify(inputData.costImpact || {})}
Historical Incidents: ${JSON.stringify(inputData.similarIncidents || [])}
`;

    try {
      // Execute with Enkrypt AI governance
      const response = await executeAgentWithGovernance(
        inputData.incidentId,
        'postmortem-generator',
        prompt,
        () => agent.generate(prompt)
      );
      const parsed = parseAgentResponse(response.text, response.object);
      return { postmortem: parsed };
    } catch (err) {
      console.error('[Orchestrator] postmortem-generator execution failed:', err);
      return {};
    }
  },
});

// ---------------------------------------------------------------------------
// Step 13 — Enkrypt AI Governance (Firewall Gatekeeper)
// ---------------------------------------------------------------------------

const runEnkryptAiGovernanceStep = createStep({
  id: 'run-enkrypt-ai-governance',
  description: 'Run safety firewall checks via Enkrypt AI Governance',
  inputSchema: z.object({
    incidentId: z.string(),
    service: z.string(),
    context: aiContextSchema,
    anomalyDetection: anomalyDetectionSchema,
    decisionIntelligence: z.any().optional(),
    timeline: z.any().optional(),
    postmortem: z.any().optional(),
    orchestratorRouting: z.any().optional(),
    environment: z.enum(['dev', 'staging', 'production']).optional(),
    embedding: z.array(z.number()).optional(),
    orchestratorInput: z.any().optional(),
    similarIncidents: z.array(similarIncidentSchema).optional(),
    costImpact: z.any().optional(),
  }),
  outputSchema: z.object({
    enkryptAiGovernance: z.any().optional(),
    aggregatedConfidence: confidenceAggregationSchema.optional(),
  }),
  execute: async ({ inputData, mastra }) => {
    if (!inputData) throw new Error('inputData is required');
    if (!inputData.anomalyDetection?.isAnomaly) return {};
    logStep(inputData.incidentId, 'RunEnkryptAiGovernanceStep');

    const compiledReport = JSON.stringify({
      decisionIntelligence: inputData.decisionIntelligence,
      timeline: inputData.timeline,
      postmortem: inputData.postmortem,
      costImpact: inputData.costImpact,
    });

    const agent = mastra?.getAgent('enkryptAiGovernance') || enkryptAiGovernance;
    const governanceReport = await runGovernanceFirewall(inputData.incidentId, compiledReport, agent);

    // Compute final confidence aggregation
    const routing = inputData.orchestratorRouting as RoutingDecision | undefined;
    const governanceTrust = governanceReport?.trustScore ?? 0.85;
    const historicalSimilarity = inputData.similarIncidents?.length > 0
      ? Math.max(...inputData.similarIncidents.map(s => s.score))
      : 0.3;

    const historicalResults: AgentExecutionResult[] = [];
    if (inputData.infrastructureMonitoring) {
      historicalResults.push({
        agent: 'infrastructure-monitoring',
        status: 'success',
        confidence: inputData.infrastructureMonitoring.confidence || 0.85,
        summary: inputData.infrastructureMonitoring.summary || '',
        reasoning: '',
        evidence: inputData.infrastructureMonitoring.evidence || [],
        recommendations: inputData.infrastructureMonitoring.recommendations || [],
        nextActions: [],
        sources: inputData.infrastructureMonitoring.sources || ['prometheus'],
        durationMs: 0,
      });
    }
    if (inputData.kubernetesOperations) {
      historicalResults.push({
        agent: 'kubernetes-operations',
        status: 'success',
        confidence: inputData.kubernetesOperations.confidence || 0.8,
        summary: inputData.kubernetesOperations.summary || '',
        reasoning: '',
        evidence: inputData.kubernetesOperations.evidence || [],
        recommendations: inputData.kubernetesOperations.recommendations || [],
        nextActions: [],
        sources: inputData.kubernetesOperations.sources || ['k8s-api'],
        durationMs: 0,
      });
    }

    const aggregatedConfidence = aiOrchestratorService.aggregateConfidence(
      historicalResults,
      governanceTrust,
      historicalSimilarity
    );

    eventPublisher.publish(
      'GovernanceUpdated',
      inputData.incidentId,
      'Incident',
      {
        incidentId: inputData.incidentId,
        decision: governanceReport?.decision,
        riskScore: governanceReport?.riskScore,
        trustScore: governanceReport?.trustScore,
        threatLevel: governanceReport?.threatLevel,
        timestamp: new Date().toISOString(),
      },
      { incidentId: inputData.incidentId }
    );

    return {
      enkryptAiGovernance: governanceReport,
      aggregatedConfidence,
    };
  },
});

// ---------------------------------------------------------------------------
// Step 14 — Notification Agent
// ---------------------------------------------------------------------------

const runNotificationAgentStep = createStep({
  id: 'run-notification-agent',
  description: 'Dispatch notifications via Slack/Teams/Email if governance approved',
  inputSchema: z.object({
    incidentId: z.string(),
    service: z.string(),
    context: aiContextSchema,
    anomalyDetection: anomalyDetectionSchema,
    decisionIntelligence: z.any().optional(),
    enkryptAiGovernance: z.any().optional(),
    aggregatedConfidence: confidenceAggregationSchema.optional(),
    environment: z.enum(['dev', 'staging', 'production']).optional(),
    embedding: z.array(z.number()).optional(),
    orchestratorInput: z.any().optional(),
    similarIncidents: z.array(similarIncidentSchema).optional(),
    status: z.enum(['NORMAL_INCIDENT', 'ANOMALY_DETECTED']).optional(),
  }),
  outputSchema: z.object({
    notificationReport: z.any().optional(),
  }),
  execute: async ({ inputData }) => {
    if (!inputData) throw new Error('inputData is required');
    if (!inputData.anomalyDetection?.isAnomaly) return {};
    logStep(inputData.incidentId, 'RunNotificationAgentStep');

    const govDecision = inputData.enkryptAiGovernance?.governanceReport?.decision;
    if (govDecision === 'blocked') {
      console.warn(`[Orchestrator] Notification skipped: Enkrypt AI Governance BLOCKED.`);
      return {
        notificationReport: {
          agent: 'Notification Agent',
          status: 'blocked',
          confidence: 1.0,
          summary: 'Notifications blocked by governance security policies.',
          reasoning: 'Enkrypt AI Governance flagged the generated output as unsafe/non-compliant.',
          evidence: inputData.enkryptAiGovernance?.evidence || [],
          recommendations: [],
          nextActions: [],
          notificationsSent: [],
        }
      };
    }

    const decision = inputData.decisionIntelligence?.decisionReport;
    const priority = decision?.priority || 'MEDIUM';
    const summary = decision?.reasoning || 'SRE incident detected and under analysis.';

    const notificationReport = await executeNotificationAgentProgrammatically(
      inputData.incidentId,
      summary,
      priority
    );

    return { notificationReport };
  },
});

// ---------------------------------------------------------------------------
// Step 15 — Learning Store (Vector Storage)
// ---------------------------------------------------------------------------

const runLearningAgentStep = createStep({
  id: 'run-learning-agent',
  description: 'Store incident resolution history and root cause in Qdrant memory',
  inputSchema: z.object({
    incidentId: z.string(),
    service: z.string(),
    anomalyDetection: anomalyDetectionSchema,
    decisionIntelligence: z.any().optional(),
    rootCauseAnalysis: z.any().optional(),
    postmortem: z.any().optional(),
    aggregatedConfidence: confidenceAggregationSchema.optional(),
    environment: z.enum(['dev', 'staging', 'production']).optional(),
    embedding: z.array(z.number()).optional(),
    orchestratorInput: z.any().optional(),
    similarIncidents: z.array(similarIncidentSchema).optional(),
    context: aiContextSchema.optional(),
  }),
  outputSchema: z.object({
    learningReport: z.any().optional(),
  }),
  execute: async ({ inputData }) => {
    if (!inputData) throw new Error('inputData is required');
    if (!inputData.anomalyDetection?.isAnomaly) return {};
    logStep(inputData.incidentId, 'RunLearningAgentStep');

    const decision = inputData.decisionIntelligence?.decisionReport;
    const rca = inputData.rootCauseAnalysis;
    const postmortem = inputData.postmortem?.postmortemReport;

    const summary = postmortem?.executiveSummary || decision?.reasoning || 'Incident resolved.';
    const rootCause = rca?.rootCause || postmortem?.rootCauseAnalysisDetail || 'Unknown';

    const learningReport = await executeLearningAgentProgrammatically(
      `Incident summary: ${summary}. Service: ${inputData.service}. Root Cause: ${rootCause}. Confidence: ${inputData.aggregatedConfidence?.overallConfidence || 'N/A'}`
    );

    eventPublisher.publish(
      'LearningUpdated',
      inputData.incidentId,
      'Incident',
      {
        incidentId: inputData.incidentId,
        summary,
        rootCause,
        confidence: inputData.aggregatedConfidence?.overallConfidence,
        timestamp: new Date().toISOString(),
      },
      { incidentId: inputData.incidentId }
    );

    return { learningReport };
  },
});

// ---------------------------------------------------------------------------
// Step 16 — PostgreSQL Persistence
// ---------------------------------------------------------------------------

const storeIncidentStep = createStep({
  id: 'store-incident',
  description: 'Persist the full incident analysis into PostgreSQL for future reference',
  inputSchema: z.object({
    incidentId: z.string(),
    service: z.string(),
    environment: z.enum(['dev', 'staging', 'production']).optional(),
    context: aiContextSchema.optional(),
    embedding: z.array(z.number()).optional(),
    similarIncidents: z.array(similarIncidentSchema),
    anomalyDetection: anomalyDetectionSchema,
    incidentAnalysis: incidentAnalysisSchema.optional(),
    infrastructureMonitoring: z.any().optional(),
    kubernetesOperations: z.any().optional(),
    securityCompliance: z.any().optional(),
    alertCorrelation: z.any().optional(),
    deploymentCorrelation: z.any().optional(),
    rootCauseAnalysis: z.any().optional(),
    runbookRecommendation: z.any().optional(),
    decisionIntelligence: z.any().optional(),
    costImpact: z.any().optional(),
    timeline: z.any().optional(),
    postmortem: z.any().optional(),
    enkryptAiGovernance: z.any().optional(),
    aggregatedConfidence: confidenceAggregationSchema.optional(),
    notificationReport: z.any().optional(),
    learningReport: z.any().optional(),
  }),
  outputSchema: z.object({
    stored: z.boolean(),
  }),
  execute: async ({ inputData }) => {
    if (!inputData) throw new Error('inputData is required');
    logStep(inputData.incidentId, 'StoreIncidentStep');

    if (!inputData.anomalyDetection?.isAnomaly) {
      return { stored: false };
    }

    const analysis = inputData.incidentAnalysis || inputData.anomalyDetection;
    await qdrantMemory.storeIncident({
      incidentId: inputData.incidentId,
      service: inputData.service,
      severity: analysis?.severity ?? 'MEDIUM',
      summary: analysis?.summary ?? 'Incident analyzed',
      rootCause: inputData.rootCauseAnalysis?.rootCause ?? inputData.postmortem?.postmortemReport?.rootCauseAnalysisDetail ?? 'Unknown',
      embedding: inputData.embedding || [],
      metadata: {
        environment: inputData.environment,
        storedAt: new Date().toISOString(),
        confidence: inputData.aggregatedConfidence?.overallConfidence,
        risk: inputData.aggregatedConfidence?.risk,
        humanApprovalRequired: inputData.aggregatedConfidence?.humanApprovalRequired,
        decisionSummary: inputData.decisionIntelligence?.decisionReport?.reasoning,
        costImpact: inputData.costImpact?.overallCost,
        timelineEventCount: inputData.timeline?.length || 0,
      },
    });

    return { stored: true };
  },
});

// ---------------------------------------------------------------------------
// Final Report Schema & Step
// ---------------------------------------------------------------------------

export const finalReportSchema = z.object({
  incidentId: z.string(),
  status: z.enum(['NORMAL_INCIDENT', 'ANOMALY_DETECTED']),
  service: z.string(),
  environment: z.enum(['dev', 'staging', 'production']),
  anomalyDetection: anomalyDetectionSchema,
  incidentAnalysis: z.any().optional(),
  infrastructureMonitoring: z.any().optional(),
  kubernetesOperations: z.any().optional(),
  securityCompliance: z.any().optional(),
  alertCorrelation: z.any().optional(),
  deploymentCorrelation: z.any().optional(),
  rootCauseAnalysis: z.any().optional(),
  runbookRecommendation: z.any().optional(),
  decisionIntelligence: z.any().optional(),
  costImpact: z.any().optional(),
  timeline: z.any().optional(),
  postmortem: z.any().optional(),
  enkryptAiGovernance: z.any().optional(),
  aggregatedConfidence: confidenceAggregationSchema.optional(),
  notificationReport: z.any().optional(),
  learningReport: z.any().optional(),
  similarIncidents: z.array(similarIncidentSchema),
  generatedAt: z.string(),
});

const buildFinalReportStep = createStep({
  id: 'build-final-report',
  description: 'Assemble and return the final incident report',
  inputSchema: z.object({
    incidentId: z.string(),
    service: z.string(),
    environment: z.enum(['dev', 'staging', 'production']).optional(),
    context: z.any().optional(),
    embedding: z.any().optional(),
    orchestratorInput: z.any().optional(),
    orchestratorRouting: z.any().optional(),
    similarIncidents: z.array(similarIncidentSchema),
    anomalyDetection: anomalyDetectionSchema,
    incidentAnalysis: z.any().optional(),
    infrastructureMonitoring: z.any().optional(),
    kubernetesOperations: z.any().optional(),
    securityCompliance: z.any().optional(),
    alertCorrelation: z.any().optional(),
    deploymentCorrelation: z.any().optional(),
    rootCauseAnalysis: z.any().optional(),
    runbookRecommendation: z.any().optional(),
    decisionIntelligence: z.any().optional(),
    costImpact: z.any().optional(),
    timeline: z.any().optional(),
    postmortem: z.any().optional(),
    enkryptAiGovernance: z.any().optional(),
    aggregatedConfidence: confidenceAggregationSchema.optional(),
    notificationReport: z.any().optional(),
    learningReport: z.any().optional(),
  }),
  outputSchema: finalReportSchema,
  execute: async ({ inputData }) => {
    if (!inputData) throw new Error('inputData is required');
    logStep(inputData.incidentId, 'BuildFinalReportStep');

    const status = inputData.anomalyDetection?.isAnomaly ? 'ANOMALY_DETECTED' as const : 'NORMAL_INCIDENT' as const;

    return {
      incidentId: inputData.incidentId,
      status,
      service: inputData.service,
      environment: inputData.environment || 'production',
      anomalyDetection: inputData.anomalyDetection,
      incidentAnalysis: inputData.incidentAnalysis,
      infrastructureMonitoring: inputData.infrastructureMonitoring,
      kubernetesOperations: inputData.kubernetesOperations,
      securityCompliance: inputData.securityCompliance,
      alertCorrelation: inputData.alertCorrelation,
      deploymentCorrelation: inputData.deploymentCorrelation,
      rootCauseAnalysis: inputData.rootCauseAnalysis,
      runbookRecommendation: inputData.runbookRecommendation,
      decisionIntelligence: inputData.decisionIntelligence,
      costImpact: inputData.costImpact,
      timeline: inputData.timeline,
      postmortem: inputData.postmortem,
      enkryptAiGovernance: inputData.enkryptAiGovernance,
      aggregatedConfidence: inputData.aggregatedConfidence,
      notificationReport: inputData.notificationReport,
      learningReport: inputData.learningReport,
      similarIncidents: inputData.similarIncidents,
      generatedAt: new Date().toISOString(),
    };
  },
});

// ---------------------------------------------------------------------------
// Workflow assembly — Linear 16-Stage Pipeline
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
  .then(incidentIntakeStep)
  .then(learningRetrievalStep)
  .then(runAnomalyDetectorStep)
  .then(infrastructureMonitoringStep)
  .then(kubernetesOperationsStep)
  .then(securityComplianceStep)
  .then(alertCorrelationStep)
  .then(rootCauseAnalysisStep)
  .then(runbookRecommendationStep)
  .then(runDecisionIntelligenceStep)
  .then(timelineGeneratorStep)
  .then(postmortemGeneratorStep)
  .then(runEnkryptAiGovernanceStep)
  .then(runNotificationAgentStep)
  .then(runLearningAgentStep)
  .then(storeIncidentStep)
  .then(buildFinalReportStep);

IncidentPipelineWorkflow.commit();
