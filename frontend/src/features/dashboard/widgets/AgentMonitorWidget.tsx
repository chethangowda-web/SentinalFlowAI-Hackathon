import * as React from 'react';
import { AgentCard } from '@/components/ai/AgentCard';
import { useDashboardStore } from '../store/dashboardStore';

export function AgentMonitorWidget() {
  const { agents } = useDashboardStore();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {agents.map((agent) => (
        <AgentCard
          key={agent.id}
          name={agent.name}
          status={agent.status}
          model={agent.model}
          runsCount={agent.tokenUsage > 1000 ? Math.floor(agent.tokenUsage / 100) : 10}
          successRate={agent.health === 'HEALTHY' ? 98 : agent.health === 'DEGRADED' ? 85 : 50}
          lastActive={agent.lastActive}
        />
      ))}
    </div>
  );
}

export default AgentMonitorWidget;
