import { registerApiRoute } from '@mastra/core/server';
import { requireAuth } from '../../auth/middleware/requireAuth';

// In-memory agent registry — populated from mastra agents on startup
const agentRegistry: Map<string, { id: string; name: string; status: string; model: string; metrics: any; lastActive: string }> = new Map();

export function registerAgent(id: string, name: string, model: string) {
  agentRegistry.set(id, {
    id,
    name,
    status: 'IDLE',
    model,
    metrics: { runs: 0, successRate: 100, avgLatency: 0 },
    lastActive: new Date().toISOString(),
  });
}

export function updateAgentStatus(id: string, status: string) {
  const agent = agentRegistry.get(id);
  if (agent) {
    agent.status = status;
    agent.lastActive = new Date().toISOString();
  }
}

export function recordAgentExecution(id: string, success: boolean, latencyMs: number) {
  const agent = agentRegistry.get(id);
  if (agent) {
    agent.metrics.runs++;
    agent.metrics.avgLatency = ((agent.metrics.avgLatency * (agent.metrics.runs - 1)) + latencyMs) / agent.metrics.runs;
    if (success) {
      agent.metrics.successRate = ((agent.metrics.successRate * (agent.metrics.runs - 1)) + 100) / agent.metrics.runs;
    } else {
      agent.metrics.successRate = ((agent.metrics.successRate * (agent.metrics.runs - 1)) + 0) / agent.metrics.runs;
    }
    agent.lastActive = new Date().toISOString();
  }
}

export const listAgentsRoute = registerApiRoute('/custom/v1/agents', {
  method: 'GET',
  middleware: [requireAuth as any],
  handler: async (c) => {
    const agents = Array.from(agentRegistry.values());
    return c.json({ success: true, data: agents }, 200);
  },
});

export const getAgentMetricsRoute = registerApiRoute('/custom/v1/agents/metrics', {
  method: 'GET',
  middleware: [requireAuth as any],
  handler: async (c) => {
    const agents = Array.from(agentRegistry.values());
    const totalRuns = agents.reduce((s, a) => s + a.metrics.runs, 0);
    const avgSuccess = agents.length > 0 ? agents.reduce((s, a) => s + a.metrics.successRate, 0) / agents.length : 0;
    const avgLatency = agents.length > 0 ? agents.reduce((s, a) => s + a.metrics.avgLatency, 0) / agents.length : 0;
    return c.json({
      success: true,
      data: {
        totalAgents: agents.length,
        activeAgents: agents.filter(a => a.status === 'BUSY').length,
        totalRuns,
        averageSuccessRate: Math.round(avgSuccess),
        averageLatencyMs: Math.round(avgLatency),
      },
    }, 200);
  },
});

export const getAgentByIdRoute = registerApiRoute('/custom/v1/agents/:id', {
  method: 'GET',
  middleware: [requireAuth as any],
  handler: async (c) => {
    const id = c.req.param('id');
    const agent = agentRegistry.get(id);
    if (!agent) return c.json({ success: false, error: `Agent not found: ${id}` }, 404);
    return c.json({ success: true, data: agent }, 200);
  },
});

export const pauseAgentRoute = registerApiRoute('/custom/v1/agents/:id/pause', {
  method: 'POST',
  middleware: [requireAuth as any],
  handler: async (c) => {
    const id = c.req.param('id');
    const agent = agentRegistry.get(id);
    if (!agent) return c.json({ success: false, error: `Agent not found: ${id}` }, 404);
    agent.status = 'PAUSED';
    return c.json({ success: true, data: agent }, 200);
  },
});

export const resumeAgentRoute = registerApiRoute('/custom/v1/agents/:id/resume', {
  method: 'POST',
  middleware: [requireAuth as any],
  handler: async (c) => {
    const id = c.req.param('id');
    const agent = agentRegistry.get(id);
    if (!agent) return c.json({ success: false, error: `Agent not found: ${id}` }, 404);
    agent.status = 'IDLE';
    return c.json({ success: true, data: agent }, 200);
  },
});

export const restartAgentRoute = registerApiRoute('/custom/v1/agents/:id/restart', {
  method: 'POST',
  middleware: [requireAuth as any],
  handler: async (c) => {
    const id = c.req.param('id');
    const agent = agentRegistry.get(id);
    if (!agent) return c.json({ success: false, error: `Agent not found: ${id}` }, 404);
    agent.status = 'IDLE';
    agent.metrics.runs = 0;
    return c.json({ success: true, data: agent }, 200);
  },
});
