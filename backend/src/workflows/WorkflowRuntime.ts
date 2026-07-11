export interface WorkflowRuntimeContext {
  workflowId: string;
  executionId: string;
  traceId: string;
  variables: Record<string, any>;
  nodeResults: Record<string, any>;
  currentNodeId: string;
  status: 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'ROLLED_BACK';
  error?: string;
}

export abstract class WorkflowRuntimeBase {
  protected context: WorkflowRuntimeContext;

  constructor(initialContext: WorkflowRuntimeContext) {
    this.context = initialContext;
  }

  public getContext(): WorkflowRuntimeContext {
    return this.context;
  }

  public updateVariable(key: string, value: any): void {
    this.context.variables[key] = value;
  }

  public getVariable(key: string): any {
    return this.context.variables[key];
  }

  public setNodeResult(nodeId: string, result: any): void {
    this.context.nodeResults[nodeId] = result;
  }

  public getNodeResult(nodeId: string): any {
    return this.context.nodeResults[nodeId];
  }

  public abstract checkpoint(): Promise<void>;
}
