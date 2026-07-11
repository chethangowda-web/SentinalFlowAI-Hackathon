import { Agent } from '@mastra/core/agent';
import { getPodsTool, describePodTool, rolloutStatusTool, getLogsTool, getEventsTool } from '../../tools/kubernetesTools';
import { kubernetesService } from '../../../observability/services/KubernetesService';
import { agentResponseSchema } from '../../types/agent';
import { z } from 'zod';

export const kubernetesOperations = new Agent({
  id: 'kubernetes-operations',
  name: 'Kubernetes Operations',
  instructions: `You are the Kubernetes Operations Agent of SentinelFlow.
Your job is to inspect pods, deployments, replicasets, services, namespaces, events, and restart history.
You use Kubernetes client tools to gather details.`,
  model: 'groq/llama-3.1-8b-instant',
  tools: { getPodsTool, describePodTool, rolloutStatusTool, getLogsTool, getEventsTool },
});

export const kubernetesOperationsSchema = agentResponseSchema.extend({
  kubernetesState: z.object({
    podCount: z.number(),
    failingPodCount: z.number(),
    restartsCount: z.number(),
    recentEventsCount: z.number(),
  }),
});

/**
 * Programmatic execution logic (Fast, Cheap SRE Platform Path)
 */
export async function executeKubernetesOperationsProgrammatically(
  serviceName: string,
  namespace: string = 'default'
): Promise<z.infer<typeof kubernetesOperationsSchema>> {
  try {
    const pods = await kubernetesService.listPods(namespace);
    const events = await kubernetesService.getEvents(namespace);
    
    const servicePods = pods.filter(pod => 
      pod.metadata?.name?.includes(serviceName) ||
      (pod.metadata?.labels && Object.values(pod.metadata.labels).some(v => v.includes(serviceName)))
    );

    let failingPodCount = 0;
    let restartsCount = 0;
    const evidence: string[] = [];

    servicePods.forEach(pod => {
      const phase = pod.status?.phase;
      if (phase !== 'Running' && phase !== 'Succeeded') {
        failingPodCount++;
        evidence.push(`Pod ${pod.metadata?.name} is in phase ${phase}`);
      }
      pod.status?.containerStatuses?.forEach(cs => {
        if (cs.restartCount > 0) {
          restartsCount += cs.restartCount;
          evidence.push(`Container ${cs.name} in Pod ${pod.metadata?.name} restarted ${cs.restartCount} times`);
        }
      });
    });

    const recentEvents = events.filter(e => 
      e.involvedObject.name?.includes(serviceName) || 
      e.message?.includes(serviceName)
    ).slice(0, 10);

    recentEvents.forEach(e => {
      evidence.push(`K8s Event [${e.type}]: Reason ${e.reason} - ${e.message}`);
    });

    const status = (failingPodCount > 0 || restartsCount > 0) ? 'warning' : 'success';
    const summary = servicePods.length > 0 
      ? `Found ${servicePods.length} pods matching service '${serviceName}' on namespace '${namespace}'.`
      : `No pods matching service '${serviceName}' were found in namespace '${namespace}'.`;

    const reasoning = `Checked all pods and events in namespace '${namespace}'. Identified ${failingPodCount} failing pods and ${restartsCount} cumulative container restarts related to service '${serviceName}'.`;

    return {
      agent: 'Kubernetes Operations',
      status,
      confidence: 0.95,
      summary,
      reasoning,
      evidence,
      recommendations: failingPodCount > 0 ? ['Investigate failing pods logs', 'Check pod resource configurations'] : [],
      nextActions: failingPodCount > 0 ? ['run getLogs for failing pods'] : [],
      kubernetesState: {
        podCount: servicePods.length,
        failingPodCount,
        restartsCount,
        recentEventsCount: recentEvents.length,
      },
    };
  } catch (err: any) {
    return {
      agent: 'Kubernetes Operations',
      status: 'failure',
      confidence: 0.8,
      summary: `Failed to query Kubernetes cluster details programmatically: ${err?.message || String(err)}`,
      reasoning: 'Attempted to retrieve pods and events from default Kubernetes client API but encountered an error.',
      evidence: [err?.message || String(err)],
      recommendations: ['Ensure Kubernetes config/credentials are correctly injected and service is reachable.'],
      nextActions: [],
      kubernetesState: {
        podCount: 0,
        failingPodCount: 0,
        restartsCount: 0,
        recentEventsCount: 0,
      },
    };
  }
}
