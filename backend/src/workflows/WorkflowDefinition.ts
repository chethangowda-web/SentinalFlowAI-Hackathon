export interface WorkflowNode {
  id: string;
  type: string;
  name: string;
  config: Record<string, any>;
}

export interface WorkflowEdge {
  source: string;
  target: string;
  condition?: string;
}

export interface WorkflowGraph {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  startNodeId: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  version: number;
  graph: WorkflowGraph;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
}
