import * as React from 'react';
import { AgentCard } from '@/components/ai/AgentCard';
import { AgentGraph } from '@/components/ai/AgentGraph';

const MOCK_NODES = [
  { id: '1', data: { label: 'CorrelationEngine Agent' }, position: { x: 100, y: 100 } },
  { id: '2', data: { label: 'Qdrant Memory RAG' }, position: { x: 350, y: 50 } },
  { id: '3', data: { label: 'Incident Responder' }, position: { x: 350, y: 150 } },
];

const MOCK_EDGES = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e1-3', source: '1', target: '3', animated: true },
];

export function AgentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Mastra Agent Topology</h1>
        <p className="text-sm text-muted-foreground">Monitor status, success metrics, and routing paths of AI agents</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AgentCard
          name="Correlation Engine Agent"
          status="IDLE"
          model="gpt-4o-mini"
          runsCount={145}
          successRate={98}
          lastActive="1 min ago"
        />
        <AgentCard
          name="Qdrant Context Retriever"
          status="BUSY"
          model="gpt-4o"
          runsCount={380}
          successRate={95}
          lastActive="Just now"
        />
        <AgentCard
          name="Incident Diagnostic Solver"
          status="IDLE"
          model="gpt-4o-mini"
          runsCount={85}
          successRate={92}
          lastActive="4 mins ago"
        />
      </div>

      <AgentGraph nodes={MOCK_NODES} edges={MOCK_EDGES} />
    </div>
  );
}

export default AgentsPage;
