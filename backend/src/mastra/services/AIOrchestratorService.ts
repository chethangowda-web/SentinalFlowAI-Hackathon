import { LoggerService } from './loggerService';
import { enkryptService } from '../../security/EnkryptService';

export interface AgentExecutionResult {
  agent: string;
  status: string;
  confidence: number;
  summary: string;
  reasoning: string;
  evidence: string[];
  recommendations: string[];
  nextActions: string[];
  sources: string[];
  durationMs: number;
}

export interface DeploymentEvent {
  timestamp: string;
  service: string;
  version: string;
  platform: string;
  status: string;
  commitHash?: string;
}

export interface OrchestrationContext {
  incidentId: string;
  service: string;
  environment: string;
  severity: string;
  telemetryLogs: string;
  metricsSummary: string;
  kubernetesEvents: string;
  recentDeployments: string;
  activeAlerts: string;
  historicalResolutions: string;
  cloudProvider?: string;
  deploymentHistory?: DeploymentEvent[];
}

export interface ConfidenceAggregation {
  overallConfidence: number;
  aiTrust: number;
  risk: string;
  escalationNeeded: boolean;
  humanApprovalRequired: boolean;
  details: {
    agentConfidenceAvg: number;
    telemetryRichnessScore: number;
    historicalSimilarityScore: number;
    governanceTrust: number;
  };
}

export interface RoutingDecision {
  requiredAgents: string[];
  cloudProvider: string;
  deploymentCorrelation: {
    recentDeploymentFound: boolean;
    deploymentDetails: string[];
    rollbackSuggested: boolean;
  };
  confidenceAggregation: ConfidenceAggregation;
}

export class AIOrchestratorService {
  private log: LoggerService;

  constructor() {
    this.log = new LoggerService('AIOrchestratorService');
  }

  public async route(context: OrchestrationContext): Promise<RoutingDecision> {
    this.log.info(`Routing incident ${context.incidentId} for service ${context.service}`);

    const cloudProvider = this.detectCloudProvider(context);
    const deploymentCorrelation = this.analyzeDeploymentCorrelation(context);
    const requiredAgents = this.determineRequiredAgents(context, cloudProvider, deploymentCorrelation);
    const confidenceAggregation = this.computeConfidenceAggregation(context, requiredAgents);

    return {
      requiredAgents,
      cloudProvider,
      deploymentCorrelation,
      confidenceAggregation,
    };
  }

  public aggregateConfidence(results: AgentExecutionResult[], governanceTrust: number, historicalSimilarity: number): ConfidenceAggregation {
    const agentConfidences = results.filter(r => r.status === 'success').map(r => r.confidence);
    const agentConfidenceAvg = agentConfidences.length > 0
      ? agentConfidences.reduce((a, b) => a + b, 0) / agentConfidences.length
      : 0;

    const telemetryRichnessScore = this.calculateTelemetryRichness(results);

    const overallConfidence = parseFloat((
      agentConfidenceAvg * 0.4 +
      telemetryRichnessScore * 0.2 +
      historicalSimilarity * 0.2 +
      governanceTrust * 0.2
    ).toFixed(3));

    const risk = this.determineRiskLevel(overallConfidence, agentConfidenceAvg, governanceTrust);

    return {
      overallConfidence: Math.max(0, Math.min(1, overallConfidence)),
      aiTrust: governanceTrust,
      risk,
      escalationNeeded: risk === 'CRITICAL' || risk === 'HIGH' || overallConfidence < 0.5,
      humanApprovalRequired: overallConfidence < 0.7 || risk === 'CRITICAL',
      details: {
        agentConfidenceAvg: parseFloat(agentConfidenceAvg.toFixed(3)),
        telemetryRichnessScore: parseFloat(telemetryRichnessScore.toFixed(3)),
        historicalSimilarityScore: historicalSimilarity,
        governanceTrust,
      },
    };
  }

  private detectCloudProvider(context: OrchestrationContext): string {
    const logs = (context.telemetryLogs + ' ' + context.kubernetesEvents + ' ' + context.metricsSummary).toLowerCase();

    if (logs.includes('eks') || logs.includes('aws') || logs.includes('amazon')) return 'AWS';
    if (logs.includes('aks') || logs.includes('azure')) return 'Azure';
    if (logs.includes('gke') || logs.includes('gcp') || logs.includes('google')) return 'GCP';
    if (logs.includes('openshift') || logs.includes('on-prem') || logs.includes('bare-metal')) return 'On-Prem';

    if (context.cloudProvider) return context.cloudProvider;
    return 'AWS';
  }

  private analyzeDeploymentCorrelation(context: OrchestrationContext): {
    recentDeploymentFound: boolean;
    deploymentDetails: string[];
    rollbackSuggested: boolean;
  } {
    const deploymentDetails: string[] = [];

    if (context.recentDeployments && context.recentDeployments.trim()) {
      const deployLines = context.recentDeployments.split('\n').filter(l => l.trim());
      deployLines.forEach(line => deploymentDetails.push(line.trim()));
    }

    if (context.deploymentHistory && context.deploymentHistory.length > 0) {
      const recent = context.deploymentHistory.filter(d => {
        const age = Date.now() - new Date(d.timestamp).getTime();
        return age < 3600000;
      });
      recent.forEach(d => {
        deploymentDetails.push(`[${d.platform}] ${d.service}@${d.version} deployed at ${d.timestamp}`);
      });
    }

    const recentDeploymentFound = deploymentDetails.length > 0;
    const rollbackSuggested = recentDeploymentFound && (
      context.severity === 'CRITICAL' || context.severity === 'HIGH'
    );

    return { recentDeploymentFound, deploymentDetails, rollbackSuggested };
  }

  private determineRequiredAgents(
    context: OrchestrationContext,
    cloudProvider: string,
    deploymentCorrelation: { recentDeploymentFound: boolean; rollbackSuggested: boolean }
  ): string[] {
    const agents: string[] = ['incident-analyzer'];

    const logs = context.telemetryLogs.toLowerCase();
    const metrics = context.metricsSummary.toLowerCase();
    const k8s = context.kubernetesEvents.toLowerCase();

    if (logs.includes('cpu') || logs.includes('memory') || logs.includes('disk') ||
        metrics.includes('cpu') || metrics.includes('memory') || metrics.includes('latency')) {
      agents.push('infrastructure-monitoring');
    }

    if (k8s.includes('pod') || k8s.includes('node') || k8s.includes('namespace') ||
        k8s.includes('deployment') || k8s.includes('replicaset') || k8s.includes('oom')) {
      agents.push('kubernetes-operations');
    }

    const securityKeywords = ['secret', 'credential', 'rbac', 'privilege', 'permission', 'vulnerability', 'cve', 'token', 'key'];
    if (securityKeywords.some(k => logs.includes(k))) {
      agents.push('security-compliance');
    }

    const alertKeywords = ['alert', 'warning', 'threshold', 'trigger', 'page', 'pagerduty', 'incident-multiple'];
    if (alertKeywords.some(k => logs.includes(k)) || context.activeAlerts.trim()) {
      agents.push('alert-correlation');
    }

    if (context.severity === 'CRITICAL' || context.severity === 'HIGH') {
      agents.push('root-cause-analyzer');
      agents.push('runbook-recommender');
    }

    if (deploymentCorrelation.recentDeploymentFound && !agents.includes('alert-correlation')) {
      agents.push('alert-correlation');
    }

    const uniqueAgents = [...new Set(agents)];
    return uniqueAgents;
  }

  private computeConfidenceAggregation(
    context: OrchestrationContext,
    requiredAgents: string[]
  ): ConfidenceAggregation {
    const agentConfidenceBase = requiredAgents.length > 0
      ? Math.min(0.95, 0.6 + (requiredAgents.length * 0.05))
      : 0.5;

    const telemetryRichnessScore = this.calculateTelemetryRichnessFromContext(context);
    const historicalSimilarityScore = context.historicalResolutions &&
      !context.historicalResolutions.includes('No historical resolutions found') ? 0.75 : 0.3;

    // Use Enkrypt AI trust score if available, otherwise default to 0.85
    const governanceTrust = enkryptService.isEnabled() ? 0.75 : 0.85;

    const overallConfidence = parseFloat((
      agentConfidenceBase * 0.4 +
      telemetryRichnessScore * 0.2 +
      historicalSimilarityScore * 0.2 +
      governanceTrust * 0.2
    ).toFixed(3));

    const risk = this.determineRiskLevel(overallConfidence, agentConfidenceBase, governanceTrust);

    return {
      overallConfidence: Math.max(0, Math.min(1, overallConfidence)),
      aiTrust: governanceTrust,
      risk,
      escalationNeeded: risk === 'CRITICAL' || risk === 'HIGH' || overallConfidence < 0.5,
      humanApprovalRequired: overallConfidence < 0.7 || risk === 'CRITICAL',
      details: {
        agentConfidenceAvg: parseFloat(agentConfidenceBase.toFixed(3)),
        telemetryRichnessScore: parseFloat(telemetryRichnessScore.toFixed(3)),
        historicalSimilarityScore: historicalSimilarityScore,
        governanceTrust,
      },
    };
  }

  private calculateTelemetryRichness(results: AgentExecutionResult[]): number {
    const totalSources = new Set(results.flatMap(r => r.sources || [])).size;
    const totalEvidence = results.reduce((sum, r) => sum + (r.evidence || []).length, 0);

    let score = 0.3;
    if (totalSources > 3) score += 0.3;
    else if (totalSources > 1) score += 0.2;
    if (totalEvidence > 10) score += 0.3;
    else if (totalEvidence > 5) score += 0.2;
    else if (totalEvidence > 2) score += 0.1;

    return Math.min(1, score);
  }

  private calculateTelemetryRichnessFromContext(context: OrchestrationContext): number {
    let score = 0.2;

    if (context.metricsSummary && context.metricsSummary.trim()) score += 0.2;
    if (context.kubernetesEvents && context.kubernetesEvents.trim()) score += 0.2;
    if (context.recentDeployments && context.recentDeployments.trim()) score += 0.15;
    if (context.activeAlerts && context.activeAlerts.trim()) score += 0.15;
    if (context.telemetryLogs && context.telemetryLogs.split('\n').length > 10) score += 0.1;

    return Math.min(1, score);
  }

  private determineRiskLevel(overallConfidence: number, agentConfidence: number, governanceTrust: number): string {
    const effectiveConfidence = (overallConfidence * 0.5 + agentConfidence * 0.3 + governanceTrust * 0.2);

    if (effectiveConfidence < 0.3) return 'CRITICAL';
    if (effectiveConfidence < 0.5) return 'HIGH';
    if (effectiveConfidence < 0.7) return 'MEDIUM';
    return 'LOW';
  }
}

export const aiOrchestratorService = new AIOrchestratorService();
export default aiOrchestratorService;
