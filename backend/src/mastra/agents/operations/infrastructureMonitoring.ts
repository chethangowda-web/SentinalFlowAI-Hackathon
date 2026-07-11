import { Agent } from '@mastra/core/agent';
import { queryPrometheusTool, queryGrafanaTool } from '../../tools/monitoringTools';
import { prometheusService } from '../../../observability/services/PrometheusService';
import { agentResponseSchema } from '../../types/agent';
import { z } from 'zod';

export const infrastructureMonitoring = new Agent({
  id: 'infrastructure-monitoring',
  name: 'Infrastructure Monitoring',
  instructions: `You are the Infrastructure Monitoring Agent of SentinelFlow.
Your job is to analyze Prometheus and Grafana metrics, including CPU, memory, disk, network, latency, and error rates.`,
  model: 'groq/llama-3.1-8b-instant',
  tools: { queryPrometheusTool, queryGrafanaTool },
});

export const infrastructureMonitoringSchema = agentResponseSchema.extend({
  metricsReport: z.object({
    cpuUsage: z.any(),
    memoryUsage: z.any(),
    podRestarts: z.any(),
    nodeHealth: z.any(),
  }),
});

/**
 * Programmatic execution logic (Fast, Cheap SRE Platform Path)
 */
export async function executeInfrastructureMonitoringProgrammatically(
  serviceName: string
): Promise<z.infer<typeof infrastructureMonitoringSchema>> {
  try {
    const cpuMetrics = await prometheusService.getCpuMetrics(serviceName);
    const memMetrics = await prometheusService.getMemoryMetrics(serviceName);
    const restarts = await prometheusService.getPodRestarts(serviceName);
    const nodeHealth = await prometheusService.getNodeHealth();

    const evidence: string[] = [];
    if (cpuMetrics && cpuMetrics.length > 0) {
      evidence.push(`Prometheus CPU Metrics found for ${serviceName}: ${JSON.stringify(cpuMetrics[0].value)}`);
    }
    if (memMetrics && memMetrics.length > 0) {
      evidence.push(`Prometheus Memory Metrics found for ${serviceName}: ${JSON.stringify(memMetrics[0].value)}`);
    }
    if (restarts && restarts.length > 0) {
      evidence.push(`Prometheus Pod Restarts count for ${serviceName}: ${JSON.stringify(restarts[0].value)}`);
    }

    const hasIssue = (restarts && restarts.length > 0 && parseFloat(restarts[0].value[1]) > 0);

    return {
      agent: 'Infrastructure Monitoring',
      status: hasIssue ? 'warning' : 'success',
      confidence: 0.9,
      summary: `Metrics retrieval completed for service '${serviceName}'. Node status checked.`,
      reasoning: `Queried CPU, Memory, Pod restarts, and Node health for ${serviceName}. Found ${cpuMetrics.length} CPU data points and ${memMetrics.length} Memory data points.`,
      evidence,
      recommendations: hasIssue ? ['Check Pod configuration and resource allocations'] : [],
      nextActions: hasIssue ? ['Verify memory limits vs usage in Kubernetes'] : [],
      metricsReport: {
        cpuUsage: cpuMetrics,
        memoryUsage: memMetrics,
        podRestarts: restarts,
        nodeHealth: nodeHealth,
      },
    };
  } catch (err: any) {
    return {
      agent: 'Infrastructure Monitoring',
      status: 'failure',
      confidence: 0.8,
      summary: `Failed to query metrics programmatically: ${err?.message || String(err)}`,
      reasoning: 'Error encountered while querying Prometheus endpoint for resource usage indicators.',
      evidence: [err?.message || String(err)],
      recommendations: ['Check connection settings for Prometheus URL and target environment.'],
      nextActions: [],
      metricsReport: {
        cpuUsage: null,
        memoryUsage: null,
        podRestarts: null,
        nodeHealth: null,
      },
    };
  }
}
