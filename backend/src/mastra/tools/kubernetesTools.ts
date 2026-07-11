import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { kubernetesService } from '../../observability/services/KubernetesService';

export const getPodsTool = createTool({
  id: 'getPods',
  description: 'List pods in a specific namespace (defaults to "default")',
  inputSchema: z.object({
    namespace: z.string().default('default').describe('The Kubernetes namespace to query'),
  }),
  outputSchema: z.any(),
  execute: async ({ namespace }) => {
    return await kubernetesService.listPods(namespace);
  },
});

export const describePodTool = createTool({
  id: 'describePod',
  description: 'Retrieve details for a specific pod',
  inputSchema: z.object({
    podName: z.string().describe('The name of the pod'),
    namespace: z.string().default('default').describe('The namespace of the pod'),
  }),
  outputSchema: z.any(),
  execute: async ({ podName, namespace }) => {
    try {
      const res = await (kubernetesService as any).k8sApi.readNamespacedPod({ name: podName, namespace });
      return res;
    } catch (err: any) {
      return { error: `Failed to describe pod: ${err?.message || String(err)}` };
    }
  },
});

export const rolloutStatusTool = createTool({
  id: 'rolloutStatus',
  description: 'Get rollout status of a deployment',
  inputSchema: z.object({
    deploymentName: z.string().describe('The name of the deployment'),
    namespace: z.string().default('default').describe('The namespace of the deployment'),
  }),
  outputSchema: z.any(),
  execute: async ({ deploymentName, namespace }) => {
    try {
      const res = await (kubernetesService as any).appsApi.readNamespacedDeployment({ name: deploymentName, namespace });
      const status = res.status;
      return {
        replicas: status?.replicas || 0,
        updatedReplicas: status?.updatedReplicas || 0,
        readyReplicas: status?.readyReplicas || 0,
        availableReplicas: status?.availableReplicas || 0,
        unavailableReplicas: status?.unavailableReplicas || 0,
        conditions: status?.conditions || [],
      };
    } catch (err: any) {
      return { error: `Failed to get rollout status: ${err?.message || String(err)}` };
    }
  },
});

export const getLogsTool = createTool({
  id: 'getLogs',
  description: 'Get container logs from a pod',
  inputSchema: z.object({
    podName: z.string().describe('The name of the pod'),
    namespace: z.string().default('default').describe('The namespace of the pod'),
    tailLines: z.number().default(100).describe('Number of lines of logs to retrieve'),
  }),
  outputSchema: z.any(),
  execute: async ({ podName, namespace, tailLines }) => {
    const logs = await kubernetesService.getPodLogs(namespace, podName, tailLines);
    return { logs };
  },
});

export const getEventsTool = createTool({
  id: 'getEvents',
  description: 'List events in a namespace',
  inputSchema: z.object({
    namespace: z.string().default('default').describe('The namespace to fetch events for'),
  }),
  outputSchema: z.any(),
  execute: async ({ namespace }) => {
    return await kubernetesService.getEvents(namespace);
  },
});
