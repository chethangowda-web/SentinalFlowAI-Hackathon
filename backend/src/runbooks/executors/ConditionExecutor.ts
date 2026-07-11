import { IRunbookExecutor, ExecutionResult } from './RunbookExecutor';
import { RunbookStep, RunbookExecutionContext } from '../types';

export class ConditionExecutor implements IRunbookExecutor {
  async execute(step: RunbookStep, context: RunbookExecutionContext): Promise<ExecutionResult> {
    const field = step.arguments.field; // e.g. 'environment', 'severity'
    const value = step.arguments.value;
    const operator = step.arguments.operator || 'equals';

    if (!field || value === undefined) {
      return { success: false, error: 'Missing field or value argument for Condition step' };
    }

    const contextVal = (context as any)[field];
    let matched = false;

    if (operator === 'equals') {
      matched = String(contextVal) === String(value);
    } else if (operator === 'contains') {
      matched = String(contextVal).includes(String(value));
    } else if (operator === 'exists') {
      matched = contextVal !== undefined && contextVal !== null;
    }

    return {
      success: true,
      output: matched ? `Condition met: ${field} ${operator} ${value}` : `Condition NOT met: ${field} ${operator} ${value}`,
      error: matched ? undefined : 'CONDITION_FAILED', // Flag to notify engine to skip/branch
    };
  }
}
