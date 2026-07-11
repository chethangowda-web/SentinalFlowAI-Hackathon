import { RunbookStep, RunbookExecutionContext } from '../types';

export interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
}

export interface IRunbookExecutor {
  execute(step: RunbookStep, context: RunbookExecutionContext): Promise<ExecutionResult>;
}
