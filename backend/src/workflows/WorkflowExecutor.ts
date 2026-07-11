import { WorkflowDefinition, WorkflowNode } from './WorkflowDefinition';
import { WorkflowCompiler } from './WorkflowCompiler';
import { WorkflowRuntimeContext } from './WorkflowRuntime';
import { LoggerService } from '../mastra/services/loggerService';
import { dbClient } from '../database/client/DatabaseClient';

export class WorkflowExecutor {
  private log: LoggerService;

  constructor() {
    this.log = new LoggerService('WorkflowExecutor');
  }

  public async execute(definition: WorkflowDefinition, initialContext: WorkflowRuntimeContext): Promise<WorkflowRuntimeContext> {
    const { nodesMap, adjacencyList, startNodeId } = WorkflowCompiler.compile(definition);
    
    let currentNodeId = initialContext.currentNodeId || startNodeId;
    initialContext.status = 'RUNNING';
    
    this.log.info(`Starting execution of workflow ${definition.id} from node ${currentNodeId}`);

    while (currentNodeId && initialContext.status === 'RUNNING') {
      const node = nodesMap.get(currentNodeId);
      if (!node) {
        initialContext.status = 'FAILED';
        initialContext.error = `Node ${currentNodeId} not found in graph.`;
        break;
      }

      try {
        this.log.debug(`Executing node ${node.id} (${node.type})`);
        // Execute node based on type
        const result = await this.executeNode(node, initialContext);
        initialContext.nodeResults[currentNodeId] = { status: 'success', result, timestamp: new Date().toISOString() };
        
        // Determine next node based on edges
        const edges = adjacencyList.get(currentNodeId) || [];
        if (edges.length === 0) {
          initialContext.status = 'COMPLETED';
          break;
        } else if (edges.length === 1) {
          // Unconditional transition
          currentNodeId = edges[0].target;
        } else {
          // Evaluate edge conditions
          currentNodeId = this.evaluateConditions(edges, initialContext);
        }

        initialContext.currentNodeId = currentNodeId;
        
        // Persist checkpoint
        await this.checkpoint(definition.id, initialContext);

      } catch (err: any) {
        this.log.error(`Execution failed at node ${currentNodeId}: ${err.message}`);
        initialContext.status = 'FAILED';
        initialContext.error = err.message;
        break;
      }
    }

    this.log.info(`Workflow ${definition.id} execution finished with status ${initialContext.status}`);
    return initialContext;
  }

  private async executeNode(node: WorkflowNode, context: WorkflowRuntimeContext): Promise<any> {
    // Built-in node executors
    switch (node.type) {
      case 'START':
        return { message: 'Workflow started' };
      case 'END':
        return { message: 'Workflow completed' };
      case 'LLM':
        return { message: 'LLM node executed (placeholder)', model: node.config?.model };
      case 'TOOL':
        return { message: 'Tool node executed (placeholder)', tool: node.config?.toolName };
      case 'CONDITION':
        return { message: 'Condition evaluated', condition: node.config?.expression };
      case 'DELAY':
        const ms = node.config?.delayMs || 1000;
        await new Promise(r => setTimeout(r, ms));
        return { message: `Delayed ${ms}ms` };
      default:
        this.log.warn(`Unknown node type: ${node.type}, treating as passthrough`);
        return { message: `Executed ${node.type} node` };
    }
  }

  private evaluateConditions(edges: Array<{ target: string; condition?: string }>, context: WorkflowRuntimeContext): string {
    for (const edge of edges) {
      if (!edge.condition) continue;
      try {
        // Simple condition evaluation (in production, use a proper expression engine)
        const result = new Function('ctx', `return (${edge.condition});`)(context.variables);
        if (result) return edge.target;
      } catch {
        // Ignore evaluation errors, continue to next edge
      }
    }
    // Fallback to first edge
    return edges[0]?.target || '';
  }

  private async checkpoint(workflowId: string, context: WorkflowRuntimeContext): Promise<void> {
    try {
      await dbClient.query(`
        UPDATE workflow_executions 
        SET variables = $1, node_results = $2, current_node_id = $3, updated_at = NOW()
        WHERE id = $4
      `, [JSON.stringify(context.variables), JSON.stringify(context.nodeResults), context.currentNodeId, context.executionId]);
    } catch (err) {
      this.log.error(`Checkpoint failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }
}
