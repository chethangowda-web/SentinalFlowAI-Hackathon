import React, { useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion } from 'framer-motion';
import { User, Shield, Server, Brain, Bot, Database, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  User, Shield, Server, Brain, Bot, Database, Bell,
};

const statusColors: Record<string, string> = {
  OK: 'bg-emerald-500',
  DEGRADED: 'bg-yellow-500',
  ERROR: 'bg-red-500',
};

const topologyNodes: any[] = [
  { id: 'user', type: 'custom', position: { x: 250, y: 0 }, data: { label: 'User', icon: 'User', statusKey: 'user' } },
  { id: 'api', type: 'custom', position: { x: 250, y: 120 }, data: { label: 'API Gateway', icon: 'Shield', statusKey: 'api' } },
  { id: 'backend', type: 'custom', position: { x: 250, y: 240 }, data: { label: 'Backend', icon: 'Server', statusKey: 'backend' } },
  { id: 'mastra', type: 'custom', position: { x: 250, y: 360 }, data: { label: 'Mastra AI', icon: 'Brain', statusKey: 'mastra' } },
  { id: 'agents', type: 'custom', position: { x: 100, y: 480 }, data: { label: 'AI Agents', icon: 'Bot', statusKey: 'agents' } },
  { id: 'qdrant', type: 'custom', position: { x: 400, y: 480 }, data: { label: 'Qdrant', icon: 'Database', statusKey: 'qdrant' } },
  { id: 'postgres', type: 'custom', position: { x: 100, y: 600 }, data: { label: 'PostgreSQL', icon: 'Database', statusKey: 'postgres' } },
  { id: 'notifications', type: 'custom', position: { x: 400, y: 600 }, data: { label: 'Notifications', icon: 'Bell', statusKey: 'notifications' } },
];

const initialEdges: any[] = [
  { id: 'e-user-api', source: 'user', target: 'api', animated: true },
  { id: 'e-api-backend', source: 'api', target: 'backend', animated: true },
  { id: 'e-backend-mastra', source: 'backend', target: 'mastra', animated: true },
  { id: 'e-mastra-agents', source: 'mastra', target: 'agents', animated: true },
  { id: 'e-mastra-qdrant', source: 'mastra', target: 'qdrant', animated: true },
  { id: 'e-agents-postgres', source: 'agents', target: 'postgres', animated: true },
  { id: 'e-agents-notifications', source: 'agents', target: 'notifications', animated: true },
];

function CustomNode({ data }: any) {
  const Icon = iconMap[data.icon] || User;
  const statusDot = statusColors[data.status] || 'bg-gray-500';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="glass rounded-xl px-5 py-3 shadow-lg border border-white/10 min-w-[140px]"
    >
      <Handle type="target" position={Position.Top} className="!bg-white/30 !w-3 !h-3 !border-2 !border-white/50" />
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-white/5">
          <Icon className="w-5 h-5 text-white/80" />
        </div>
        <span className="text-sm font-medium text-white/90">{data.label}</span>
        <div className={cn('w-2.5 h-2.5 rounded-full ml-auto', statusDot)} />
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-white/30 !w-3 !h-3 !border-2 !border-white/50" />
    </motion.div>
  );
}

const nodeTypes = { custom: CustomNode as any };

interface SystemTopologyProps {
  className?: string;
}

export function SystemTopology({ className }: SystemTopologyProps) {
  const healthQuery = useQuery({
    queryKey: ['health', 'topology'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: Record<string, string> }>('/health/topology');
      return res.data.data || {};
    },
    refetchInterval: 30000,
  });

  const healthMap = healthQuery.data || {};
  const nodesWithStatus = React.useMemo(() =>
    topologyNodes.map(n => ({
      ...n,
      data: { ...n.data, status: healthMap[n.data.statusKey] || 'OK' },
    })),
    [healthMap],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(nodesWithStatus);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onInit = useCallback((instance: any) => {
    instance.fitView({ padding: 0.2 });
  }, []);

  return (
    <Card className={cn('overflow-hidden border-border/50', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          System Topology
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[400px] bg-[#0a0a0f]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onInit={onInit}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Controls className="!bg-white/5 !border-white/10 !text-white/70" />
            <Background gap={24} size={1} color="rgba(255,255,255,0.05)" />
          </ReactFlow>
        </div>
      </CardContent>
    </Card>
  );
}

export default SystemTopology;
