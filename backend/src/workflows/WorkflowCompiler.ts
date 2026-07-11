import { WorkflowDefinition, WorkflowNode, WorkflowEdge } from './WorkflowDefinition';

export class WorkflowCompiler {
  /**
   * Compiles and validates a JSON WorkflowDefinition into an executable format.
   * Throws an error if the graph is invalid (e.g. missing nodes, dangling edges).
   */
  public static compile(definition: WorkflowDefinition): {
    nodesMap: Map<string, WorkflowNode>;
    adjacencyList: Map<string, WorkflowEdge[]>;
    startNodeId: string;
  } {
    const nodesMap = new Map<string, WorkflowNode>();
    const adjacencyList = new Map<string, WorkflowEdge[]>();

    for (const node of definition.graph.nodes) {
      nodesMap.set(node.id, node);
      adjacencyList.set(node.id, []);
    }

    for (const edge of definition.graph.edges) {
      if (!nodesMap.has(edge.source)) {
        throw new Error(`Invalid edge: source node ${edge.source} does not exist.`);
      }
      if (!nodesMap.has(edge.target)) {
        throw new Error(`Invalid edge: target node ${edge.target} does not exist.`);
      }
      adjacencyList.get(edge.source)!.push(edge);
    }

    if (!nodesMap.has(definition.graph.startNodeId)) {
      throw new Error(`Invalid graph: startNodeId ${definition.graph.startNodeId} does not exist.`);
    }

    return {
      nodesMap,
      adjacencyList,
      startNodeId: definition.graph.startNodeId
    };
  }
}
