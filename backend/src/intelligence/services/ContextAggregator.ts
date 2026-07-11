import { incidentRepository } from '../../database/repositories/IncidentRepository';
import { runbookRepository } from '../../database/repositories/RunbookRepository';
import { kubernetesService } from '../../observability/services/KubernetesService';
import { qdrantMemory } from '../../mastra/services/qdrantMemory';
import { embeddingService } from '../../mastra/services/embeddingService';
import { DecisionContext } from '../types';
import { dbClient } from '../../database/client/DatabaseClient';

export class ContextAggregator {
  public async aggregate(incidentId: string, aiAnalysis: Record<string, any>): Promise<DecisionContext> {
    // 1. Fetch incident from DB
    const incident = await incidentRepository.getIncidentById(incidentId);
    if (!incident) {
      throw new Error(`Incident not found: ${incidentId}`);
    }

    // 2. Fetch similar incidents using Qdrant (with safe fallback)
    let similarIncidents: any[] = [];
    try {
      await qdrantMemory.ensureInitialized();
      // Generate embedding from incident summary
      const textToEmbed = incident.summary || incident.title || 'incident';
      const embedding = await embeddingService.generateEmbedding(textToEmbed);
      similarIncidents = await qdrantMemory.searchSimilarIncidents({
        embedding,
        limit: 5,
      });
    } catch (err) {
      console.warn('[ContextAggregator] Failed to query Qdrant memory. Falling back to empty similar incidents.', err);
    }

    // 3. Fetch Kubernetes state (with safe fallback)
    let deployments: any[] = [];
    let k8sEvents: any[] = [];
    try {
      deployments = await kubernetesService.listDeployments('default');
      k8sEvents = await kubernetesService.getEvents('default');
    } catch (err) {
      console.warn('[ContextAggregator] Failed to query Kubernetes APIs. Falling back to empty lists.', err);
    }

    // 4. Fetch previous runbook executions
    let runbooksExecuted: any[] = [];
    try {
      runbooksExecuted = await runbookRepository.getExecutionsByIncident(incidentId);
    } catch (err) {
      console.warn('[ContextAggregator] Failed to query runbook history. Falling back.', err);
    }

    // 5. Query active engineer workloads from DB
    let currentEngineers: any[] = [];
    try {
      const rows = await dbClient.query(`
        SELECT assigned_engineer, COUNT(*) as workload 
        FROM incidents 
        WHERE status = 'OPEN' AND assigned_engineer IS NOT NULL
        GROUP BY assigned_engineer;
      `);
      currentEngineers = rows.map((r: any) => ({
        name: r.assigned_engineer,
        workloadCount: parseInt(r.workload, 10),
      }));
    } catch (err) {
      console.warn('[ContextAggregator] Failed to query SRE workloads. Falling back.', err);
    }

    return {
      incident,
      aiAnalysis,
      similarIncidents,
      telemetryMetrics: {
        cpuUsage: 85.4, // Mocked metrics as fallback
        memoryUsage: 74.2,
        networkIn: '45MB/s',
        networkOut: '38MB/s',
        httpErrorRate: 2.1,
      },
      deploymentHistory: deployments.map((d: any) => ({
        name: d.metadata?.name || 'unknown',
        namespace: d.metadata?.namespace || 'default',
        restartedAt: d.metadata?.annotations?.['kubectl.kubernetes.io/restartedAt'] || null,
        replicas: d.spec?.replicas || 1,
      })),
      alerts: k8sEvents.map((e: any) => ({
        reason: e.reason || 'unknown',
        message: e.message || '',
        count: e.count || 1,
        type: e.type || 'Normal',
        lastTimestamp: e.lastTimestamp || new Date().toISOString(),
      })),
      kubernetesState: {
        deploymentCount: deployments.length,
        eventsCount: k8sEvents.length,
      },
      previousRunbooks: runbooksExecuted,
      currentEngineers,
      timestamp: new Date().toISOString(),
    };
  }
}

export const contextAggregator = new ContextAggregator();
export default contextAggregator;
