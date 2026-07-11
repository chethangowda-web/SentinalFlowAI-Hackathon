import { Runbook, RunbookExecutionContext } from '../types';
import { LoggerService } from '../../mastra/services/loggerService';

export class RunbookPolicyEngine {
  private log = new LoggerService('RunbookPolicyEngine');

  public async evaluate(runbook: Runbook, context: RunbookExecutionContext): Promise<boolean> {
    this.log.info(`[Policy] Evaluating policy for runbook ${runbook.id} (Incident: ${context.incidentId})`);

    // 1. Check if runbook is enabled
    if (!runbook.enabled) {
      this.log.info(`[Policy] Runbook ${runbook.id} is disabled. Skipping.`);
      return false;
    }

    // 2. Check environment mapping
    const env = context.environment.toLowerCase();
    if (env === 'production' && runbook.severity.toUpperCase() === 'LOW') {
      this.log.info(`[Policy] Low severity runbook disabled in production. Skipping.`);
      return false;
    }

    // 3. Maintenance windows (Simulated check: do not run commands during typical deploy hours e.g. 1 AM - 3 AM unless Critical)
    const currentHour = new Date().getHours();
    if (currentHour >= 1 && currentHour <= 3 && context.severity.toUpperCase() !== 'CRITICAL') {
      this.log.warn(`[Policy] Execution blocked: Maintenance window active (1 AM - 3 AM) for non-critical incidents.`);
      return false;
    }

    this.log.info(`[Policy] Policy check passed for runbook ${runbook.id}`);
    return true;
  }
}

export const runbookPolicyEngine = new RunbookPolicyEngine();
