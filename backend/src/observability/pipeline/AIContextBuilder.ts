import { prometheusService } from '../services/PrometheusService';
import { kubernetesService } from '../services/KubernetesService';
import { qdrantMemory } from '../../mastra/services/qdrantMemory';

export interface AIContext {
  environment: string;
  service: string;
  telemetryLogs: string;
  metricsSummary: string;
  recentDeployments: string;
  kubernetesEvents: string;
  activeAlerts: string;
  historicalResolutions: string;
}

export class AIContextBuilder {
  
  public async buildContext(service: string, environment: string, logs: string): Promise<AIContext> {
    const [
      cpuMetrics,
      memMetrics,
      podRestarts,
      deployments,
      events
    ] = await Promise.all([
      prometheusService.getCpuMetrics(service),
      prometheusService.getMemoryMetrics(service),
      prometheusService.getPodRestarts(service),
      kubernetesService.listDeployments(environment),
      kubernetesService.getEvents(environment)
    ]);

    const metricsSummary = `
CPU Usage (5m avg): ${cpuMetrics.length ? JSON.stringify(cpuMetrics[0].value) : 'Unknown'}
Memory Working Set: ${memMetrics.length ? JSON.stringify(memMetrics[0].value) : 'Unknown'}
Pod Restarts: ${podRestarts.length ? JSON.stringify(podRestarts[0].value) : 'Unknown'}
    `.trim();

    const recentDeployments = deployments
      .filter(d => d.metadata?.name?.includes(service))
      .map(d => `${d.metadata?.name}: generation ${d.metadata?.generation}, availableReplicas: ${d.status?.availableReplicas}`)
      .join('\n') || 'No recent deployments found.';

    const kubernetesEvents = events
      .filter(e => e.type === 'Warning' || e.message?.includes(service))
      .slice(0, 5)
      .map(e => `[${e.type}] ${e.reason}: ${e.message} (Pod: ${e.involvedObject.name})`)
      .join('\n') || 'No critical events found.';

    // This could also come from Prometheus Alertmanager, mock string for now based on logic
    const activeAlerts = podRestarts.length > 0 && parseInt(podRestarts[0].value[1], 10) > 2
      ? 'CRITICAL: High Pod Restart Rate Detected'
      : 'No active Prometheus alerts.';

    const historicalResolutions = 'Fetched during AI pipeline.';

    return {
      environment,
      service,
      telemetryLogs: logs,
      metricsSummary,
      recentDeployments,
      kubernetesEvents,
      activeAlerts,
      historicalResolutions
    };
  }
}

export const aiContextBuilder = new AIContextBuilder();
