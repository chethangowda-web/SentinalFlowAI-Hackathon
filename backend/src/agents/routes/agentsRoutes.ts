import { registerApiRoute } from '@mastra/core/server';
import { requireAuth } from '../../auth/middleware/requireAuth';
import { agentRepository } from '../../database/repositories/AgentRepository';

const agentList = [
  { id: 'incident-analyzer', name: 'Incident Analyzer', model: 'groq/llama-3.1-8b' },
  { id: 'anomaly-detector', name: 'Anomaly Detector', model: 'groq/llama-3.1-8b' },
  { id: 'sre-assistant', name: 'SRE Assistant', model: 'groq/llama-3.1-8b' },
  { id: 'root-cause-analyzer', name: 'Root Cause Analyzer', model: 'groq/llama-3.1-8b' },
  { id: 'postmortem-generator', name: 'Postmortem Generator', model: 'groq/llama-3.1-8b' },
  { id: 'decision-intelligence', name: 'Decision Intelligence', model: 'groq/llama-3.1-8b' },
  { id: 'runbook-recommender', name: 'Runbook Recommender', model: 'groq/llama-3.1-8b' },
  { id: 'kubernetes-ops', name: 'Kubernetes Operations', model: 'k8s-api' },
  { id: 'infra-monitoring', name: 'Infrastructure Monitoring', model: 'prometheus/grafana' },
  { id: 'alert-correlation', name: 'Alert Correlation', model: 'groq/llama-3.1-8b' },
  { id: 'security-compliance', name: 'Security Compliance', model: 'static-analysis' },
  { id: 'learning-agent', name: 'Learning Agent', model: 'groq/llama-3.1-8b' },
  { id: 'enkrypt-ai-governance', name: 'Enkrypt AI Governance', model: 'governance-firewall' },
  { id: 'notification-agent', name: 'Notification Agent', model: 'slack/teams/email' },
];

// Initialize agents in database on startup
agentRepository.initializeAgents(agentList).catch(err => {
  console.error('[AgentsRoutes] Failed to initialize agents:', err);
});

export const listAgentsRoute = registerApiRoute('/custom/v1/agents', {
  method: 'GET',
  middleware: [requireAuth as any],
  handler: async (c) => {
    try {
      const agents = await agentRepository.getAllAgents();
      return c.json({ success: true, data: agents }, 200);
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  },
});

export const getAgentMetricsRoute = registerApiRoute('/custom/v1/agents/metrics', {
  method: 'GET',
  middleware: [requireAuth as any],
  handler: async (c) => {
    try {
      const metrics = await agentRepository.getMetrics();
      return c.json({ success: true, data: metrics }, 200);
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  },
});

export const getAgentByIdRoute = registerApiRoute('/custom/v1/agents/:id', {
  method: 'GET',
  middleware: [requireAuth as any],
  handler: async (c) => {
    try {
      const id = c.req.param('id');
      const agent = await agentRepository.getAgentById(id);
      if (!agent) return c.json({ success: false, error: `Agent not found: ${id}` }, 404);
      return c.json({ success: true, data: agent }, 200);
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  },
});

export const pauseAgentRoute = registerApiRoute('/custom/v1/agents/:id/pause', {
  method: 'POST',
  middleware: [requireAuth as any],
  handler: async (c) => {
    try {
      const id = c.req.param('id');
      const agent = await agentRepository.updateAgentStatus(id, 'PAUSED');
      if (!agent) return c.json({ success: false, error: `Agent not found: ${id}` }, 404);
      return c.json({ success: true, data: agent }, 200);
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  },
});

export const resumeAgentRoute = registerApiRoute('/custom/v1/agents/:id/resume', {
  method: 'POST',
  middleware: [requireAuth as any],
  handler: async (c) => {
    try {
      const id = c.req.param('id');
      const agent = await agentRepository.updateAgentStatus(id, 'IDLE');
      if (!agent) return c.json({ success: false, error: `Agent not found: ${id}` }, 404);
      return c.json({ success: true, data: agent }, 200);
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  },
});

export const restartAgentRoute = registerApiRoute('/custom/v1/agents/:id/restart', {
  method: 'POST',
  middleware: [requireAuth as any],
  handler: async (c) => {
    try {
      const id = c.req.param('id');
      const agent = await agentRepository.updateAgentStatus(id, 'IDLE');
      if (!agent) return c.json({ success: false, error: `Agent not found: ${id}` }, 404);
      return c.json({ success: true, data: agent }, 200);
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  },
});

export function recordAgentExecution(
  agentName: string,
  executionTimeMs: number,
  tokensUsed: number,
  success: boolean,
  errorMessage: string | null = null
): void {
  const costUsd = (tokensUsed / 1000) * 0.0001; // Approximate cost
  agentRepository.recordExecution(agentName, executionTimeMs, tokensUsed, costUsd, success, errorMessage)
    .catch(err => console.error('[AgentsRoutes] Failed to record execution:', err));
}

export function updateAgentHealth(agentName: string, healthStatus: string): void {
  agentRepository.getAgentByName(agentName).then(agent => {
    if (agent) {
      agentRepository.updateAgentHealth(agent.id, healthStatus)
        .catch(err => console.error('[AgentsRoutes] Failed to update health:', err));
    }
  });
}