import { RunbookExecutionContext } from '../types';

export interface IApprovalProvider {
  requiresApproval(context: RunbookExecutionContext): Promise<boolean>;
}

export class ManualApprovalProvider implements IApprovalProvider {
  async requiresApproval(context: RunbookExecutionContext): Promise<boolean> {
    return true; // Always require human approval
  }
}

export class AutomaticApprovalProvider implements IApprovalProvider {
  async requiresApproval(context: RunbookExecutionContext): Promise<boolean> {
    return false; // Auto execution without approval
  }
}

export class HybridApprovalProvider implements IApprovalProvider {
  async requiresApproval(context: RunbookExecutionContext): Promise<boolean> {
    // Requires approval for high/critical severities or production environments
    const isProd = context.environment.toLowerCase() === 'production';
    const isHigh = ['high', 'critical'].includes(context.severity.toLowerCase());
    return isProd || isHigh;
  }
}
