import { dbClient } from '../../database/client/DatabaseClient';
import { randomUUID } from 'crypto';

export interface AgentStatus {
  id: string;
  name: string;
  state: string;
  healthStatus: string;
  lastHeartbeat: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentHistoryEntry {
  id: string;
  agentName: string;
  executionTimeMs: number | null;
  tokensUsed: number | null;
  costUsd: number | null;
  success: boolean | null;
  errorMessage: string | null;
  createdAt: Date;
}

export interface AgentMetrics {
  totalAgents: number;
  activeAgents: number;
  totalRuns: number;
  averageSuccessRate: number;
  averageLatencyMs: number;
}

export class AgentRepository {
  async initializeAgents(agents: Array<{ id: string; name: string; model: string }>): Promise<void> {
    for (const agent of agents) {
      await dbClient.query(
        `INSERT INTO agent_status (id, name, state, health_status, last_heartbeat, created_at, updated_at)
         VALUES ($1, $2, 'IDLE', 'HEALTHY', NOW(), NOW(), NOW())
         ON CONFLICT (name) DO UPDATE SET updated_at = NOW()`,
        [agent.id, agent.name]
      );
    }
  }

  async getAllAgents(): Promise<AgentStatus[]> {
    const result = await dbClient.query(
      `SELECT id, name, state, health_status, last_heartbeat, created_at, updated_at
       FROM agent_status
       ORDER BY name`
    );
    return result;
  }

  async getAgentById(id: string): Promise<AgentStatus | null> {
    const result = await dbClient.query(
      `SELECT id, name, state, health_status, last_heartbeat, created_at, updated_at
       FROM agent_status
       WHERE id = $1`,
      [id]
    );
    return result[0] || null;
  }

  async getAgentByName(name: string): Promise<AgentStatus | null> {
    const result = await dbClient.query(
      `SELECT id, name, state, health_status, last_heartbeat, created_at, updated_at
       FROM agent_status
       WHERE name = $1`,
      [name]
    );
    return result[0] || null;
  }

  async updateAgentStatus(id: string, state: string): Promise<AgentStatus | null> {
    const result = await dbClient.query(
      `UPDATE agent_status
       SET state = $1, health_status = 'HEALTHY', last_heartbeat = NOW(), updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, state, health_status, last_heartbeat, created_at, updated_at`,
      [state, id]
    );
    return result[0] || null;
  }

  async updateAgentHealth(id: string, healthStatus: string): Promise<void> {
    await dbClient.query(
      `UPDATE agent_status
       SET health_status = $1, last_heartbeat = NOW(), updated_at = NOW()
       WHERE id = $2`,
      [healthStatus, id]
    );
  }

  async recordExecution(
    agentName: string,
    executionTimeMs: number,
    tokensUsed: number,
    costUsd: number,
    success: boolean,
    errorMessage: string | null
  ): Promise<void> {
    await dbClient.query(
      `INSERT INTO agent_history (id, agent_name, execution_time_ms, tokens_used, cost_usd, success, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [randomUUID(), agentName, executionTimeMs, tokensUsed, costUsd, success, errorMessage]
    );

    // Update agent status last heartbeat
    await dbClient.query(
      `UPDATE agent_status
       SET last_heartbeat = NOW(), updated_at = NOW()
       WHERE name = $1`,
      [agentName]
    );
  }

  async getAgentHistory(agentName: string, limit = 100): Promise<AgentHistoryEntry[]> {
    const result = await dbClient.query(
      `SELECT id, agent_name, execution_time_ms, tokens_used, cost_usd, success, error_message, created_at
       FROM agent_history
       WHERE agent_name = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [agentName, limit]
    );
    return result;
  }

  async getMetrics(): Promise<AgentMetrics> {
    const agentsResult = await dbClient.query(
      `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE state = 'BUSY') as active
       FROM agent_status`
    );

    const historyResult = await dbClient.query(
      `SELECT 
         COUNT(*) as total_runs,
         AVG(CASE WHEN success THEN 100 ELSE 0 END) as avg_success_rate,
         AVG(execution_time_ms) as avg_latency
       FROM agent_history
       WHERE created_at >= NOW() - INTERVAL '24 hours'`
    );

    const agents = agentsResult[0] || {};
    const history = historyResult[0] || {};

    return {
      totalAgents: parseInt(agents.total || '0', 10),
      activeAgents: parseInt(agents.active || '0', 10),
      totalRuns: parseInt(history.total_runs || '0', 10),
      averageSuccessRate: Math.round(parseFloat(history.avg_success_rate || '0')),
      averageLatencyMs: Math.round(parseFloat(history.avg_latency || '0')),
    };
  }

  async cleanup(): Promise<void> {
    // Clean up old history entries (older than 30 days)
    await dbClient.query(
      `DELETE FROM agent_history WHERE created_at < NOW() - INTERVAL '30 days'`
    );
  }
}

export const agentRepository = new AgentRepository();