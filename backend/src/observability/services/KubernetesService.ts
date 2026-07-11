import * as k8s from '@kubernetes/client-node';
import { config } from '../../config/config';
import { LoggerService } from '../../mastra/services/loggerService';

export class KubernetesService {
  private k8sApi: k8s.CoreV1Api;
  private appsApi: k8s.AppsV1Api;
  private log: LoggerService;

  constructor() {
    this.log = new LoggerService('KubernetesService');
    const kc = new k8s.KubeConfig();
    
    if (config.observability.k8sConfigPath) {
      kc.loadFromFile(config.observability.k8sConfigPath);
    } else {
      try {
        kc.loadFromCluster();
      } catch (e) {
        this.log.warn('Could not load from cluster, attempting default local load.');
        kc.loadFromDefault();
      }
    }

    this.k8sApi = kc.makeApiClient(k8s.CoreV1Api);
    this.appsApi = kc.makeApiClient(k8s.AppsV1Api);
  }

  public async listPods(namespace: string = 'default'): Promise<k8s.V1Pod[]> {
    try {
      const res = await this.k8sApi.listNamespacedPod({ namespace });
      return res.items;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.log.error(`Failed to list pods in ${namespace}: ${msg}`);
      return [];
    }
  }

  public async listDeployments(namespace: string = 'default'): Promise<k8s.V1Deployment[]> {
    try {
      const res = await this.appsApi.listNamespacedDeployment({ namespace });
      return res.items;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.log.error(`Failed to list deployments in ${namespace}: ${msg}`);
      return [];
    }
  }

  public async getPodLogs(namespace: string, podName: string, lines: number = 100): Promise<string> {
    try {
      const res = await this.k8sApi.readNamespacedPodLog({ name: podName, namespace, tailLines: lines });
      // readNamespacedPodLog returns string in res when using newer clients
      return typeof res === 'string' ? res : JSON.stringify(res);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.log.error(`Failed to get logs for pod ${podName} in ${namespace}: ${msg}`);
      return '';
    }
  }

  public async getEvents(namespace: string = 'default'): Promise<k8s.CoreV1Event[]> {
    try {
      const res = await this.k8sApi.listNamespacedEvent({ namespace });
      return res.items;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.log.error(`Failed to get events in ${namespace}: ${msg}`);
      return [];
    }
  }

  public async restartDeployment(namespace: string, name: string): Promise<boolean> {
    try {
      const now = new Date().toISOString();
      const patch = [
        {
          op: 'replace',
          path: '/spec/template/metadata/annotations/kubectl.kubernetes.io~1restartedAt',
          value: now
        }
      ];
      await this.appsApi.patchNamespacedDeployment({
        name,
        namespace,
        body: patch
      });
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.log.error(`Failed to restart deployment ${name} in ${namespace}: ${msg}`);
      return false;
    }
  }

  public async scaleDeployment(namespace: string, name: string, replicas: number): Promise<boolean> {
    try {
      await this.appsApi.replaceNamespacedDeploymentScale({
        name,
        namespace,
        body: { spec: { replicas } }
      });
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.log.error(`Failed to scale deployment ${name} to ${replicas} in ${namespace}: ${msg}`);
      return false;
    }
  }

  public async deletePod(namespace: string, name: string): Promise<boolean> {
    try {
      await this.k8sApi.deleteNamespacedPod({ name, namespace });
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.log.error(`Failed to delete pod ${name} in ${namespace}: ${msg}`);
      return false;
    }
  }

  public async cordonNode(nodeName: string): Promise<boolean> {
    try {
      const patch = { spec: { unschedulable: true } };
      await this.k8sApi.patchNode({
        name: nodeName,
        body: patch
      });
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.log.error(`Failed to cordon node ${nodeName}: ${msg}`);
      return false;
    }
  }
}

export const kubernetesService = new KubernetesService();
