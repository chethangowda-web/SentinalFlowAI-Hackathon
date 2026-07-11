import { sreAssistant } from '../../mastra/agents/sreAssistant';
import { incidentRepository } from '../../database/repositories/IncidentRepository';
import { decisionRepository } from '../repositories/DecisionRepository';
import { qdrantMemory } from '../../mastra/services/qdrantMemory';
import { LoggerService } from '../../mastra/services/loggerService';
import { randomUUID } from 'crypto';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  incidentId?: string;
  history?: ChatMessage[];
}

export interface ChatResponse {
  message: string;
  contextUsed: string[];
}

export class AssistantService {
  private log = new LoggerService('AssistantService');

  public async chat(request: ChatRequest): Promise<ChatResponse> {
    this.log.info(`[AssistantService] Processing chat request`);
    let contextStr = '';
    const contextUsed: string[] = [];

    // 1. Gather incident context if requested
    if (request.incidentId) {
      const incident = await incidentRepository.getIncidentById(request.incidentId);
      if (incident) {
        contextUsed.push('Incident Repository');
        contextStr += `\n--- ACTIVE INCIDENT ---\n`;
        contextStr += `ID: ${incident.incidentId}\n`;
        contextStr += `Title: ${incident.title}\n`;
        contextStr += `Status: ${incident.status}\n`;
        contextStr += `Severity: ${incident.severity}\n`;
        contextStr += `Summary: ${incident.summary}\n`;
        
        // 2. Gather AI Decision context
        const decisions = await decisionRepository.getDecisionsForIncident(request.incidentId);
        if (decisions && decisions.length > 0) {
          contextUsed.push('Decision Engine');
          const latest = decisions[0];
          contextStr += `\n--- AI DECISION --- \n`;
          contextStr += `Status: ${latest.status}\n`;
          contextStr += `Recommended Action: ${latest.recommendedAction}\n`;
          contextStr += `Risk Level: ${latest.riskLevel}\n`;
          contextStr += `Confidence: ${latest.confidence}\n`;
          if (latest.recommendedRunbooks?.length) {
            contextStr += `Recommended Runbooks: ${latest.recommendedRunbooks.map(r => r.name).join(', ')}\n`;
          }
        }
      }
    } else {
      // 3. Fallback to global knowledge search if no incident specified
      try {
        await qdrantMemory.ensureInitialized();
        // Since we don't have an embedding for the query directly, we would need to generate one
        // For simplicity in the orchestration, we can inject general platform stats or require the agent to ask for clarity.
        contextUsed.push('Global Knowledge');
        contextStr += `\n--- GLOBAL KNOWLEDGE ---\n`;
        contextStr += `You are operating at the platform level without a specific incident context.\n`;
      } catch (err) {
        this.log.error(`[AssistantService] Qdrant error: ${err}`);
      }
    }

    // 4. Construct prompt
    const prompt = `Context Information:\n${contextStr}\n\nUser Question:\n${request.message}`;

    // 5. Query Agent
    const response = await sreAssistant.generate(prompt);

    return {
      message: response.text || 'I am sorry, I could not generate a response at this time.',
      contextUsed,
    };
  }
}

export const assistantService = new AssistantService();
