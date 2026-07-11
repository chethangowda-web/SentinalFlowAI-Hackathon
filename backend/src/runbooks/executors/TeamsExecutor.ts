import { IRunbookExecutor, ExecutionResult } from './RunbookExecutor';
import { RunbookStep, RunbookExecutionContext } from '../types';
import { ProviderFactory } from '../../notifications/channels/ProviderFactory';

export class TeamsExecutor implements IRunbookExecutor {
  async execute(step: RunbookStep, context: RunbookExecutionContext): Promise<ExecutionResult> {
    const channel = step.arguments.channel || 'teams';
    const message = step.arguments.message || `SentinelFlow Runbook Alert for Incident ${context.incidentId}`;
    const subject = step.arguments.subject || 'Runbook Execution Update';

    try {
      const provider = ProviderFactory.getProvider('teams');
      const response = await provider.send([channel], message, subject);
      if (response.success) {
        return { success: true, output: 'Teams message sent successfully' };
      } else {
        return { success: false, error: response.error || 'Failed to send Teams message' };
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown Teams error' };
    }
  }
}
