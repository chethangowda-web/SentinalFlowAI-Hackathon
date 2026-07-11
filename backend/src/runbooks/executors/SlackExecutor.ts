import { IRunbookExecutor, ExecutionResult } from './RunbookExecutor';
import { RunbookStep, RunbookExecutionContext } from '../types';
import { ProviderFactory } from '../../notifications/channels/ProviderFactory';

export class SlackExecutor implements IRunbookExecutor {
  async execute(step: RunbookStep, context: RunbookExecutionContext): Promise<ExecutionResult> {
    const channel = step.arguments.channel || 'slack';
    const message = step.arguments.message || `SentinelFlow Runbook Alert for Incident ${context.incidentId}`;
    const subject = step.arguments.subject || 'Runbook Execution Update';

    try {
      const provider = ProviderFactory.getProvider('slack');
      const response = await provider.send([channel], message, subject);
      if (response.success) {
        return { success: true, output: 'Slack message sent successfully' };
      } else {
        return { success: false, error: response.error || 'Failed to send Slack message' };
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown Slack error' };
    }
  }
}
