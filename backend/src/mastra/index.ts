import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { Observability, MastraStorageExporter, MastraPlatformExporter, SensitiveDataFilter } from '@mastra/observability';
import { createGroq } from '@ai-sdk/groq';
import { incidentAnalyzer } from './agents/incident/incidentAnalyzer';
import { anomalyDetector } from './agents/incident/anomalyDetector';
import { sreAssistant } from './agents/incident/sreAssistant';
import { rootCauseAnalyzer } from './agents/incident/rootCauseAnalyzer';
import { postmortemGenerator } from './agents/incident/postmortemGenerator';
import { decisionIntelligence } from './agents/incident/decisionIntelligence';
import { runbookRecommender } from './agents/operations/runbookRecommender';
import { kubernetesOperations } from './agents/operations/kubernetesOperations';
import { infrastructureMonitoring } from './agents/operations/infrastructureMonitoring';
import { alertCorrelation } from './agents/incident/alertCorrelation';
import { securityCompliance } from './agents/security/securityCompliance';
import { learningAgent } from './agents/learning/learningAgent';
import { enkryptAiGovernance } from './agents/governance/enkryptAiGovernance';
import { notificationAgent } from './agents/communication/notificationAgent';
import { IncidentWorkflow } from './workflows/incidentWorkflow';
import { IncidentPipelineWorkflow } from './workflows/incidentPipelineWorkflow';
import { analyzeIncidentRoute } from '../routes/incidentRoutes';
import {
  registerRoute,
  loginRoute,
  logoutRoute,
  getMeRoute,
  getSessionsRoute,
  revokeSessionRoute,
  getOrganizationsRoute,
  createOrganizationRoute,
  getTeamsRoute,
  createTeamRoute,
  refreshRoute,
  forgotPasswordRoute,
  resetPasswordRoute,
  switchOrganizationRoute,
  updateProfileRoute
} from '../routes/authRoutes';
import { embeddingService } from './services/embeddingService';
import { HuggingFaceEmbeddingProvider } from './services/providers/huggingFaceEmbeddingProvider';
import { config } from '../config/config';
import { 
  createIncidentRoute, 
  getIncidentsRoute, 
  getIncidentByIdRoute, 
  updateIncidentStatusRoute, 
  assignIncidentRoute, 
  resolveIncidentRoute, 
  closeIncidentRoute,
  deleteIncidentRoute,
  addNoteRoute,
  getNotesRoute,
  getTimelineRoute,
  getAuditRoute,
  dashboardOverviewRoute,
  dashboardTrendsRoute,
  dashboardSeverityRoute,
  dashboardServicesRoute
} from '../routes/lifecycleRoutes';
import { telemetryIngestionRoute, demoStartRoute, demoStopRoute } from '../routes/telemetryRoutes';
import { healthRoute, dependenciesHealthRoute, metricsRoute, readyHealthRoute, readyRoute, liveRoute } from '../routes/healthRoutes';
import {
  getNotificationsRoute,
  getNotificationByIdRoute,
  getNotificationHistoryRoute,
  testNotificationRoute,
  updatePreferencesRoute
} from '../routes/notificationRoutes';
import {
  listRunbooksRoute,
  createRunbookRoute,
  updateRunbookRoute,
  deleteRunbookRoute,
  executeRunbookRoute,
  listExecutionsRoute,
  getExecutionByIdRoute,
  getRunbookHistoryRoute
} from '../routes/runbookRoutes';
import { jobScheduler } from '../jobs/JobScheduler';
import { initializeEventBus } from '../events';
import { initializeRealtime } from '../realtime';
import { 
  realtimeConnectionsRoute, 
  realtimeStatisticsRoute, 
  realtimeRoomsRoute,
  realtimeMetricsRoute,
  realtimeHealthRoute
} from '../routes/realtimeRoutes';
import {
  intelligenceDashboardRoute,
  intelligenceDecisionRoute,
  intelligenceHistoryRoute,
  intelligenceStatisticsRoute,
  intelligenceRecommendationsRoute,
  intelligenceRootCausesRoute,
  intelligenceConfidenceRoute,
  intelligenceRecomputeRoute,
  intelligenceApproveRoute,
  intelligenceRejectRoute,
  intelligenceFeedbackRoute,
  intelligenceRunbookRecommendationsRoute,
  intelligenceEngineerRecommendationsRoute
} from '../intelligence/routes/intelligenceRoutes';
import { assistantChatRoute } from '../intelligence/routes/assistantRoutes';
import {
  platformLiveRoute,
  platformReadyRoute,
  platformStartupRoute,
  platformMetricsRoute,
  platformSwaggerRoute
} from '../platform/api/platformRoutes';
import { platformLifecycle, workerManager } from '../platform';
import {
  learningStatisticsRoute,
  learningHistoryRoute,
  learningPromptsRoute,
  learningFeedbackRoute,
  learningRetrainRoute,
  learningReindexRoute,
  learningRecommendationsRoute
} from '../learning/routes/learningRoutes';
import { learningEventSubscriber } from '../learning/events/LearningEventSubscriber';
import {
  listAgentsRoute,
  getAgentMetricsRoute,
  getAgentByIdRoute,
  pauseAgentRoute,
  resumeAgentRoute,
  restartAgentRoute
} from '../agents/routes/agentsRoutes';
import {
  governanceOverviewRoute,
  governanceDetectorsRoute,
  governanceHistoryRoute,
  governanceApprovalsRoute,
  governanceAuditRoute,
  governanceMetricsRoute
} from '../governance/routes/governanceRoutes';
import {
  learningOverviewRoute,
  learningGrowthRoute,
  learningSimilarRoute
} from '../learning/routes/learningRoutes';
import { qdrantMemory } from './services/qdrantMemory';
import { demoService } from './services/DemoService';
import { dbClient } from '../database/client/DatabaseClient';

const groq = createGroq({ apiKey: config.groq.apiKey });

jobScheduler.initializeJobs();
initializeEventBus();
initializeRealtime().catch((err) => {
  console.error(`[Mastra] Failed to initialize Realtime module: ${err}`);
});

platformLifecycle.bootstrap().then(async () => {
  try {
    await qdrantMemory.ensureInitialized();
    console.log('[PlatformLifecycle] Qdrant memory initialized.');
  } catch (err: any) {
    console.error('[PlatformLifecycle] WARNING: Qdrant memory initialization failed. Is Qdrant running? AI Search will be disabled.', err.message);
  }
  workerManager.start();

  // Check if DB is empty, if so, trigger Demo Mode
  try {
    const incidents = await dbClient.query('SELECT 1 FROM incidents LIMIT 1');
    if (incidents.length === 0 && process.env.SKIP_DEMO_AUTO_START !== 'true') {
      console.log('[PlatformLifecycle] DB has no incidents. Starting Demo Mode simulation...');
      demoService.startDemoMode();
    }
  } catch (err: any) {
    console.error('[PlatformLifecycle] Failed to check and auto-start Demo Mode:', err.message);
  }
}).catch(err => {
  console.error('[Mastra] Platform Operations bootstrap failed:', err);
});

// Register AI Learning & Continuous Improvement event subscribers
try {
  learningEventSubscriber.register();
} catch (err) {
  console.error('[Mastra] Learning event subscriber registration failed:', err);
}

// Register agents in the agent registry for the API
import { registerAgent } from '../agents/routes/agentsRoutes';

const agentList = [
  { id: 'incident-analyzer', name: 'Incident Analyzer', model: 'groq/llama-3.1-8b' },
  { id: 'anomaly-detector', name: 'Anomaly Detector', model: 'groq/llama-3.1-8b' },
  { id: 'sre-assistant', name: 'SRE Assistant', model: 'groq/llama-3.1-8b' },
  { id: 'root-cause-analyzer', name: 'Root Cause Analyzer', model: 'groq/llama-3.1-8b' },
  { id: 'postmortem-generator', name: 'Postmortem Generator', model: 'groq/llama-3.1-8b' },
  { id: 'decision-intelligence', name: 'Decision Intelligence', model: 'groq/llama-3.1-8b' },
  { id: 'runbook-recommender', name: 'Runbook Recommender', model: 'groq/llama-3.1-8b' },
  { id: 'kubernetes-ops', name: 'Kubernetes Operations', model: 'k8s-api' },
  { id: 'infra-monitoring', name: 'Infrastructure Monitoring', model: 'prometheus/grafana' },
  { id: 'alert-correlation', name: 'Alert Correlation', model: 'groq/llama-3.1-8b' },
  { id: 'security-compliance', name: 'Security Compliance', model: 'static-analysis' },
  { id: 'learning-agent', name: 'Learning Agent', model: 'groq/llama-3.1-8b' },
  { id: 'enkrypt-governance', name: 'Enkrypt Governance', model: 'governance-firewall' },
  { id: 'notification-agent', name: 'Notification Agent', model: 'slack/teams/email' },
];
agentList.forEach(a => registerAgent(a.id, a.name, a.model));

// Global Error Handling
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
  // Optional: send to telemetry or alerting
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

// Graceful shutdown is handled by PlatformLifecycle (SIGINT/SIGTERM)
// which tears down WebSocket, workers, and DB connection pool.

export const mastra = new Mastra({
  workflows: { IncidentWorkflow, IncidentPipelineWorkflow },
  agents: {
    incidentAnalyzer,
    anomalyDetector,
    sreAssistant,
    rootCauseAnalyzer,
    postmortemGenerator,
    decisionIntelligence,
    runbookRecommender,
    kubernetesOperations,
    infrastructureMonitoring,
    alertCorrelation,
    securityCompliance,
    learningAgent,
      notificationAgent,
  },
  server: {
    cors: {
      origin: ['https://app.sentinelflow.io', 'https://sentinelflow.vercel.app', 'https://sentinal-flow-ai-hackathon-murex.vercel.app', 'http://localhost:5173'],
      allowHeaders: ['Content-Type', 'Authorization', 'x-mastra-client-type', 'x-mastra-dev-playground', 'x-request-id', 'X-Tenant-Id'],
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      exposeHeaders: ['Content-Length', 'X-Requested-With'],
      credentials: true,
    },
    apiRoutes: [
      registerRoute,
      loginRoute,
      logoutRoute,
      getMeRoute,
      getSessionsRoute,
      revokeSessionRoute,
      getOrganizationsRoute,
      createOrganizationRoute,
      getTeamsRoute,
      createTeamRoute,
      refreshRoute,
      forgotPasswordRoute,
      resetPasswordRoute,
      switchOrganizationRoute,
      updateProfileRoute,
      analyzeIncidentRoute,
      createIncidentRoute,
      getIncidentsRoute,
      getIncidentByIdRoute,
      updateIncidentStatusRoute,
      assignIncidentRoute,
      resolveIncidentRoute,
      closeIncidentRoute,
      deleteIncidentRoute,
      addNoteRoute,
      getNotesRoute,
      getTimelineRoute,
      getAuditRoute,
      dashboardOverviewRoute,
      dashboardTrendsRoute,
      dashboardSeverityRoute,
      dashboardServicesRoute,
      telemetryIngestionRoute,
      demoStartRoute,
      demoStopRoute,
      healthRoute,
      dependenciesHealthRoute,
      readyHealthRoute,
      readyRoute,
      liveRoute,
      metricsRoute,
      getNotificationsRoute,
      getNotificationByIdRoute,
      getNotificationHistoryRoute,
      testNotificationRoute,
      updatePreferencesRoute,
      listRunbooksRoute,
      createRunbookRoute,
      updateRunbookRoute,
      deleteRunbookRoute,
      executeRunbookRoute,
      listExecutionsRoute,
      getExecutionByIdRoute,
      getRunbookHistoryRoute,
      realtimeConnectionsRoute,
      realtimeStatisticsRoute,
      realtimeRoomsRoute,
      realtimeMetricsRoute,
      realtimeHealthRoute,
      intelligenceDashboardRoute,
      intelligenceDecisionRoute,
      intelligenceHistoryRoute,
      intelligenceStatisticsRoute,
      intelligenceRecommendationsRoute,
      intelligenceRootCausesRoute,
      intelligenceConfidenceRoute,
      intelligenceRecomputeRoute,
      intelligenceApproveRoute,
      intelligenceRejectRoute,
      intelligenceFeedbackRoute,
      intelligenceRunbookRecommendationsRoute,
      intelligenceEngineerRecommendationsRoute,
      assistantChatRoute,
      platformLiveRoute,
      platformReadyRoute,
      platformStartupRoute,
      platformMetricsRoute,
      platformSwaggerRoute,
      // Agents
      listAgentsRoute,
      getAgentMetricsRoute,
      getAgentByIdRoute,
      pauseAgentRoute,
      resumeAgentRoute,
      restartAgentRoute,
      // Governance
      governanceOverviewRoute,
      governanceDetectorsRoute,
      governanceHistoryRoute,
      governanceApprovalsRoute,
      governanceAuditRoute,
      governanceMetricsRoute,
      // AI Learning & Continuous Improvement
      learningStatisticsRoute,
      learningHistoryRoute,
      learningPromptsRoute,
      learningFeedbackRoute,
      learningRetrainRoute,
      learningReindexRoute,
      learningRecommendationsRoute,
      learningOverviewRoute,
      learningGrowthRoute,
      learningSimilarRoute
    ],
  },
  storage: new LibSQLStore({
    id: "mastra-storage",
    url: "file:./mastra.db",
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: config.logging.level as any,
  }),
  providers: {
    groq,
  },
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'mastra',
        exporters: [
          new MastraStorageExporter(), // Persists observability events to Mastra Storage
          new MastraPlatformExporter(), // Sends observability events to Mastra Platform (if MASTRA_PLATFORM_ACCESS_TOKEN is set)
        ],
        spanOutputProcessors: [
          new SensitiveDataFilter(), // Redacts sensitive data like passwords, tokens, keys
        ],
      },
    },
  }),
});

// ---------------------------------------------------------------------------
// Startup: register the embedding provider
// ---------------------------------------------------------------------------
try {
  embeddingService.setProvider(new HuggingFaceEmbeddingProvider());
} catch (error) {
  if (error instanceof Error) {
    console.warn(`[Mastra] Embedding provider not registered: ${error.message}`);
  } else {
    console.warn('[Mastra] Embedding provider not registered: unknown error');
  }
}
