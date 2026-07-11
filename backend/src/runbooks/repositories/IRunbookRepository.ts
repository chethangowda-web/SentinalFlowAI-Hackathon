import { Runbook, RunbookExecution, RunbookExecutionStep } from '../types';

export interface IRunbookRepository {
  createRunbook(runbook: Runbook & { organizationId?: string }): Promise<Runbook>;
  getRunbookById(id: string, orgId?: string): Promise<Runbook | null>;
  getRunbooksByTrigger(event: string, orgId?: string): Promise<Runbook[]>;
  listRunbooks(orgId?: string): Promise<Runbook[]>;
  updateRunbook(id: string, updates: Partial<Runbook>): Promise<void>;
  deleteRunbook(id: string): Promise<void>;

  createExecution(exec: RunbookExecution): Promise<RunbookExecution>;
  updateExecution(id: string, updates: Partial<RunbookExecution>): Promise<void>;
  getExecutionById(id: string): Promise<RunbookExecution | null>;
  listExecutions(limit?: number, offset?: number): Promise<RunbookExecution[]>;
  getExecutionsByIncident(incidentId: string): Promise<RunbookExecution[]>;

  createExecutionStep(step: RunbookExecutionStep): Promise<RunbookExecutionStep>;
  updateExecutionStep(id: string, updates: Partial<RunbookExecutionStep>): Promise<void>;
  getExecutionSteps(executionId: string): Promise<RunbookExecutionStep[]>;
}
