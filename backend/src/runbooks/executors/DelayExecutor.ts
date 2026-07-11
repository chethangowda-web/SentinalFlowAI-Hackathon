import { IRunbookExecutor, ExecutionResult } from './RunbookExecutor';
import { RunbookStep, RunbookExecutionContext } from '../types';

export class DelayExecutor implements IRunbookExecutor {
  async execute(step: RunbookStep, context: RunbookExecutionContext): Promise<ExecutionResult> {
    const seconds = parseInt(step.arguments.seconds || '5');
    await new Promise(resolve => setTimeout(resolve, seconds * 1000));
    return {
      success: true,
      output: `Waited for ${seconds} seconds`
    };
  }
}
