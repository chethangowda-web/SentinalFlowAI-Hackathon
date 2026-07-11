import * as React from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AgentGraphProps {
  nodes: Node[];
  edges: Edge[];
  className?: string;
}

export function AgentGraph({ nodes = [], edges = [], className }: AgentGraphProps) {
  return (
    <Card className={cn('bg-card border-border overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground">
          Mastra Agent Topology & Workflows
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[400px] p-0 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          colorMode="dark"
        >
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          <Controls />
        </ReactFlow>
      </CardContent>
    </Card>
  );
}

export default AgentGraph;
