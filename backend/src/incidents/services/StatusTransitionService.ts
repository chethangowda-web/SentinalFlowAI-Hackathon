import { IncidentStatus } from '../types/status';
import { StateTransitionError } from '../../core/errors/LifecycleErrors';

export class StatusTransitionService {
  private static readonly allowedTransitions: Record<IncidentStatus, IncidentStatus[]> = {
    [IncidentStatus.OPEN]: [IncidentStatus.INVESTIGATING, IncidentStatus.CLOSED],
    [IncidentStatus.INVESTIGATING]: [IncidentStatus.MITIGATED, IncidentStatus.RESOLVED, IncidentStatus.CLOSED],
    [IncidentStatus.MITIGATED]: [IncidentStatus.RESOLVED, IncidentStatus.INVESTIGATING, IncidentStatus.CLOSED],
    [IncidentStatus.RESOLVED]: [IncidentStatus.CLOSED, IncidentStatus.INVESTIGATING], // Can reopen if resolution fails
    [IncidentStatus.CLOSED]: [], // Terminal state
  };

  /**
   * Validate if a transition from currentStatus to newStatus is allowed.
   * Throws StateTransitionError if invalid.
   */
  public validateTransition(currentStatus: string, newStatus: string): void {
    if (currentStatus === newStatus) {
      return; // No-op transition is allowed
    }

    const current = currentStatus as IncidentStatus;
    const next = newStatus as IncidentStatus;

    if (!Object.values(IncidentStatus).includes(current)) {
      throw new StateTransitionError(`Invalid current status: ${currentStatus}`);
    }
    if (!Object.values(IncidentStatus).includes(next)) {
      throw new StateTransitionError(`Invalid new status: ${newStatus}`);
    }

    const allowed = StatusTransitionService.allowedTransitions[current] || [];
    
    if (!allowed.includes(next)) {
      throw new StateTransitionError(`Invalid transition from ${current} to ${next}`);
    }
  }
}

export const statusTransitionService = new StatusTransitionService();
