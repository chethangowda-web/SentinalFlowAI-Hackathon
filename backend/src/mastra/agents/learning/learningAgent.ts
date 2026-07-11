import { Agent } from '@mastra/core/agent';
import { saveIncidentTool, searchKnowledgeTool } from '../../tools/learningTools';
import { agentResponseSchema } from '../../types/agent';
import { z } from 'zod';
import { qdrantMemory } from '../../services/qdrantMemory';
import { embeddingService } from '../../services/embeddingService';

export const learningAgent = new Agent({
  id: 'learning-agent',
  name: 'Learning Agent',
  instructions: `You are the AI Learning Agent of SentinelFlow.
Your job is to store resolved SRE incidents, runbooks, and root causes, and perform semantic queries in Qdrant vector database.`,
  model: 'groq/llama-3.1-8b-instant',
  tools: { saveIncidentTool, searchKnowledgeTool },
});

export const learningAgentSchema = agentResponseSchema.extend({
  knowledgeEntries: z.array(z.object({
    incidentId: z.string(),
    score: z.number(),
    payload: z.any(),
  })),
});

/**
 * Programmatic execution logic (Fast, Cheap SRE Platform Path)
 */
export async function executeLearningAgentProgrammatically(
  query: string,
  limit: number = 3
): Promise<z.infer<typeof learningAgentSchema>> {
  try {
    if (qdrantMemory.isDegraded()) {
      return {
        agent: 'Learning Agent',
        status: 'warning',
        confidence: 0.5,
        summary: 'Qdrant database is degraded. Semantic lookup skipped.',
        reasoning: 'Qdrant client could not be loaded or collection does not exist.',
        evidence: ['Qdrant degradation detected'],
        recommendations: ['Ensure Qdrant container/service is running and accessible.'],
        nextActions: [],
        knowledgeEntries: [],
      };
    }

    const embedding = await embeddingService.generateEmbedding(query);
    const results = await qdrantMemory.searchSimilarIncidents({ embedding, limit });

    const knowledgeEntries = results.map(r => ({
      incidentId: r.incidentId,
      score: r.score,
      payload: r.payload,
    }));

    const evidence = knowledgeEntries.map(e => `Historical Match [Score ${e.score.toFixed(2)}]: ID ${e.incidentId} - ${e.payload.summary || e.payload.title}`);

    return {
      agent: 'Learning Agent',
      status: 'success',
      confidence: 0.95,
      summary: `Found ${knowledgeEntries.length} similar historical incidents in Qdrant memory.`,
      reasoning: `Converted query into dense vector embedding and conducted cosine similarity search across historical incidents.`,
      evidence,
      recommendations: knowledgeEntries.length > 0 ? [`Review resolution history for matched incident ${knowledgeEntries[0].incidentId}`] : [],
      nextActions: [],
      knowledgeEntries,
    };
  } catch (err: any) {
    return {
      agent: 'Learning Agent',
      status: 'failure',
      confidence: 0.8,
      summary: `Failed to search Qdrant knowledge base programmatically: ${err?.message || String(err)}`,
      reasoning: 'Error encountered during embedding generation or Qdrant index search.',
      evidence: [err?.message || String(err)],
      recommendations: ['Verify connectivity to embedding endpoint and Qdrant database.'],
      nextActions: [],
      knowledgeEntries: [],
    };
  }
}
export default learningAgent;
