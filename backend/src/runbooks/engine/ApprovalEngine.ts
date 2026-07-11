import { RunbookExecutionContext } from '../types';
import { IApprovalProvider, AutomaticApprovalProvider, ManualApprovalProvider, HybridApprovalProvider } from './ApprovalProvider';

export class ApprovalEngine {
  private providers: Record<string, IApprovalProvider> = {
    automatic: new AutomaticApprovalProvider(),
    manual: new ManualApprovalProvider(),
    hybrid: new HybridApprovalProvider(),
  };

  public async evaluateApproval(approvalType: 'AUTO' | 'MANUAL' | 'HYBRID', context: RunbookExecutionContext): Promise<boolean> {
    let key = approvalType.toLowerCase();
    if (key === 'auto') {
      key = 'automatic';
    }
    const provider = this.providers[key] || this.providers.manual;
    return provider.requiresApproval(context);
  }
}

export const approvalEngine = new ApprovalEngine();
