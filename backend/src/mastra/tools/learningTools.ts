import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { qdrantMemory } from '../services/qdrantMemory';
import { embeddingService } from '../services/embeddingService';

export const saveIncidentTool = createTool({
  id: 'saveIncident',
  description: 'Save resolved incident, runbook, or root cause and its details to Qdrant memory for future search',
  inputSchema: z.object({
    incidentId: z.string().describe('ID of the incident'),
    service: z.string().describe('The name of the service affected'),
    severity: z.string().describe('Severity of the incident'),
    summary: z.string().describe('A high-level summary of the incident'),
    rootCause: z.string().describe('The determined root cause'),
    resolution: z.string().optional().describe('The resolution notes'),
    metadata: z.record(z.string(), z.any()).optional().describe('Additional metadata to persist'),
  }),
  outputSchema: z.any(),
  execute: async ({ incidentId, service, severity, summary, rootCause, resolution, metadata }) => {
    try {
      const combinedText = `Incident: ${summary}. Service: ${service}. Severity: ${severity}. Root Cause: ${rootCause}. Resolution: ${resolution || 'None'}`;
      let embedding: number[] = [];
      if (!qdrantMemory.isDegraded()) {
        embedding = await embeddingService.generateEmbedding(combinedText);
      }
      await qdrantMemory.storeIncident({
        incidentId,
        service,
        severity,
        summary,
        rootCause,
        embedding,
        metadata: {
          resolution,
          storedAt: new Date().toISOString(),
          ...(metadata || {}),
        },
      });
      return { success: true, message: `Successfully stored incident ${incidentId}` };
    } catch (err: any) {
      return { error: `Failed to save incident: ${err?.message || String(err)}` };
    }
  },
});

export const searchKnowledgeTool = createTool({
  id: 'searchKnowledge',
  description: 'Semantic search of historical incidents, past runbooks, and previous fixes in Qdrant vector memory',
  inputSchema: z.object({
    query: z.string().describe('The semantic search query'),
    limit: z.number().default(5).describe('The maximum number of matches to return'),
  }),
  outputSchema: z.any(),
  execute: async ({ query, limit }) => {
    try {
      if (qdrantMemory.isDegraded()) {
        return { error: 'Qdrant memory service is degraded, search not available.' };
      }
      const embedding = await embeddingService.generateEmbedding(query);
      const results = await qdrantMemory.searchSimilarIncidents({ embedding, limit });
      return { results };
    } catch (err: any) {
      return { error: `Failed to search knowledge: ${err?.message || String(err)}` };
    }
  },
});
