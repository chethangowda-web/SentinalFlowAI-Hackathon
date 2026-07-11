import { IRunbookRepository } from '../../runbooks/repositories/IRunbookRepository';
import { Runbook, RunbookExecution, RunbookExecutionStep, RunbookExecutionStatus, StepExecutionStatus } from '../../runbooks/types';
import { dbClient, DatabaseClient } from '../client/DatabaseClient';
import { DatabaseError } from '../../core/errors/DatabaseError';

export class RunbookRepository implements IRunbookRepository {
  private db: DatabaseClient;

  constructor() {
    this.db = dbClient;
  }

  public async createRunbook(runbook: Runbook & { organizationId?: string }): Promise<Runbook> {
    const text = `
      INSERT INTO runbooks (
        id, name, description, service, trigger_event, severity, enabled,
        approval_required, timeout_seconds, retry_limit, execution_steps, rollback_steps, organization_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *;
    `;
    const params = [
      runbook.id,
      runbook.name,
      runbook.description || null,
      runbook.service,
      runbook.triggerEvent,
      runbook.severity,
      runbook.enabled,
      runbook.approvalRequired,
      runbook.timeoutSeconds,
      runbook.retryLimit,
      JSON.stringify(runbook.executionSteps),
      JSON.stringify(runbook.rollbackSteps),
      runbook.organizationId || null,
    ];

    const rows = await this.db.query(text, params);
    if (!rows.length) throw new DatabaseError('Failed to create runbook');
    return this.mapToRunbook(rows[0]);
  }

  public async getRunbookById(id: string, orgId?: string): Promise<Runbook | null> {
    let text = `SELECT * FROM runbooks WHERE id = $1`;
    const params = [id];
    if (orgId) {
      text += ` AND organization_id = $2`;
      params.push(orgId);
    }
    const rows = await this.db.query(text, params);
    return rows.length ? this.mapToRunbook(rows[0]) : null;
  }

  public async getRunbooksByTrigger(event: string, orgId?: string): Promise<Runbook[]> {
    let text = `SELECT * FROM runbooks WHERE trigger_event = $1 AND enabled = TRUE`;
    const params = [event];
    if (orgId) {
      text += ` AND organization_id = $2`;
      params.push(orgId);
    }
    const rows = await this.db.query(text, params);
    return rows.map(r => this.mapToRunbook(r));
  }

  public async listRunbooks(orgId?: string): Promise<Runbook[]> {
    let text = `SELECT * FROM runbooks`;
    const params: any[] = [];
    if (orgId) {
      text += ` WHERE organization_id = $1`;
      params.push(orgId);
    }
    text += ` ORDER BY created_at DESC`;
    const rows = await this.db.query(text, params);
    return rows.map(r => this.mapToRunbook(r));
  }

  public async updateRunbook(id: string, updates: Partial<Runbook>): Promise<void> {
    const text = `
      UPDATE runbooks
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          service = COALESCE($3, service),
          trigger_event = COALESCE($4, trigger_event),
          severity = COALESCE($5, severity),
          enabled = COALESCE($6, enabled),
          approval_required = COALESCE($7, approval_required),
          timeout_seconds = COALESCE($8, timeout_seconds),
          retry_limit = COALESCE($9, retry_limit),
          execution_steps = COALESCE($10, execution_steps),
          rollback_steps = COALESCE($11, rollback_steps),
          updated_at = NOW()
      WHERE id = $12;
    `;
    await this.db.query(text, [
      updates.name || null,
      updates.description || null,
      updates.service || null,
      updates.triggerEvent || null,
      updates.severity || null,
      updates.enabled === undefined ? null : updates.enabled,
      updates.approvalRequired === undefined ? null : updates.approvalRequired,
      updates.timeoutSeconds || null,
      updates.retryLimit || null,
      updates.executionSteps ? JSON.stringify(updates.executionSteps) : null,
      updates.rollbackSteps ? JSON.stringify(updates.rollbackSteps) : null,
      id,
    ]);
  }

  public async deleteRunbook(id: string): Promise<void> {
    const text = `DELETE FROM runbooks WHERE id = $1`;
    await this.db.query(text, [id]);
  }

  public async createExecution(exec: RunbookExecution): Promise<RunbookExecution> {
    const text = `
      INSERT INTO runbook_executions (
        id, incident_id, runbook_id, status, start_time, trace_id, request_id, triggered_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const params = [
      exec.id,
      exec.incidentId,
      exec.runbookId,
      exec.status,
      exec.startTime,
      exec.traceId || null,
      exec.requestId || null,
      exec.triggeredBy || null,
    ];

    const rows = await this.db.query(text, params);
    if (!rows.length) throw new DatabaseError('Failed to create runbook execution');
    return this.mapToExecution(rows[0]);
  }

  public async updateExecution(id: string, updates: Partial<RunbookExecution>): Promise<void> {
    const text = `
      UPDATE runbook_executions
      SET status = COALESCE($1, status),
          end_time = COALESCE($2, end_time),
          duration_ms = COALESCE($3, duration_ms)
      WHERE id = $4;
    `;
    await this.db.query(text, [
      updates.status || null,
      updates.endTime || null,
      updates.durationMs || null,
      id,
    ]);
  }

  public async getExecutionById(id: string): Promise<RunbookExecution | null> {
    const text = `SELECT * FROM runbook_executions WHERE id = $1`;
    const rows = await this.db.query(text, [id]);
    return rows.length ? this.mapToExecution(rows[0]) : null;
  }

  public async listExecutions(limit: number = 100, offset: number = 0): Promise<RunbookExecution[]> {
    const text = `SELECT * FROM runbook_executions ORDER BY start_time DESC LIMIT $1 OFFSET $2`;
    const rows = await this.db.query(text, [limit, offset]);
    return rows.map(r => this.mapToExecution(r));
  }

  public async getExecutionsByIncident(incidentId: string): Promise<RunbookExecution[]> {
    const text = `SELECT * FROM runbook_executions WHERE incident_id = $1 ORDER BY start_time DESC`;
    const rows = await this.db.query(text, [incidentId]);
    return rows.map(r => this.mapToExecution(r));
  }

  public async createExecutionStep(step: RunbookExecutionStep): Promise<RunbookExecutionStep> {
    const text = `
      INSERT INTO runbook_execution_steps (
        id, execution_id, step_index, name, type, status, start_time, retry_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const params = [
      step.id,
      step.executionId,
      step.stepIndex,
      step.name,
      step.type,
      step.status,
      step.startTime,
      step.retryCount,
    ];

    const rows = await this.db.query(text, params);
    if (!rows.length) throw new DatabaseError('Failed to create execution step log');
    return this.mapToStep(rows[0]);
  }

  public async updateExecutionStep(id: string, updates: Partial<RunbookExecutionStep>): Promise<void> {
    const text = `
      UPDATE runbook_execution_steps
      SET status = COALESCE($1, status),
          end_time = COALESCE($2, end_time),
          duration_ms = COALESCE($3, duration_ms),
          output = COALESCE($4, output),
          error = COALESCE($5, error),
          retry_count = COALESCE($6, retry_count)
      WHERE id = $7;
    `;
    await this.db.query(text, [
      updates.status || null,
      updates.endTime || null,
      updates.durationMs || null,
      updates.output || null,
      updates.error || null,
      updates.retryCount === undefined ? null : updates.retryCount,
      id,
    ]);
  }

  public async getExecutionSteps(executionId: string): Promise<RunbookExecutionStep[]> {
    const text = `SELECT * FROM runbook_execution_steps WHERE execution_id = $1 ORDER BY step_index ASC`;
    const rows = await this.db.query(text, [executionId]);
    return rows.map(r => this.mapToStep(r));
  }

  private mapToRunbook(row: any): Runbook {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      service: row.service,
      triggerEvent: row.trigger_event,
      severity: row.severity,
      enabled: row.enabled,
      approvalRequired: row.approval_required,
      timeoutSeconds: row.timeout_seconds,
      retryLimit: row.retry_limit,
      executionSteps: row.execution_steps || [],
      rollbackSteps: row.rollback_steps || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapToExecution(row: any): RunbookExecution {
    return {
      id: row.id,
      incidentId: row.incident_id,
      runbookId: row.runbook_id,
      status: row.status as RunbookExecutionStatus,
      startTime: row.start_time,
      endTime: row.end_time,
      durationMs: row.duration_ms,
      traceId: row.trace_id,
      requestId: row.request_id,
      triggeredBy: row.triggered_by,
    };
  }

  private mapToStep(row: any): RunbookExecutionStep {
    return {
      id: row.id,
      executionId: row.execution_id,
      stepIndex: row.step_index,
      name: row.name,
      type: row.type,
      status: row.status as StepExecutionStatus,
      startTime: row.start_time,
      endTime: row.end_time,
      durationMs: row.duration_ms,
      output: row.output,
      error: row.error,
      retryCount: row.retry_count,
    };
  }
}

export const runbookRepository = new RunbookRepository();
