import { IRunbookExecutor, ExecutionResult } from './RunbookExecutor';
import { RunbookStep, RunbookExecutionContext } from '../types';
import { exec } from 'child_process';

export class CommandExecutor implements IRunbookExecutor {
  async execute(step: RunbookStep, context: RunbookExecutionContext): Promise<ExecutionResult> {
    const command = step.arguments.command;
    const timeout = parseInt(step.arguments.timeoutMs || '10000');

    if (!command) {
      return { success: false, error: 'No command specified for Command step' };
    }

    // Safety checks (sanitize basic injection points)
    const dangerousPatterns = [';', '&&', '||', '|', '`', '$(', '>', '<'];
    for (const pattern of dangerousPatterns) {
      if (command.includes(pattern)) {
        return { success: false, error: `Security validation failed: command contains forbidden character '${pattern}'` };
      }
    }

    return new Promise((resolve) => {
      const child = exec(command, { timeout, env: { ...process.env, INCIDENT_ID: context.incidentId } }, (error, stdout, stderr) => {
        const output = stdout.toString() + stderr.toString();
        if (error) {
          resolve({
            success: false,
            error: error.message,
            output,
          });
        } else {
          resolve({
            success: true,
            output,
          });
        }
      });
    });
  }
}
