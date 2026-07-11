import { WorkflowDefinition } from './WorkflowDefinition';
import { WorkflowExecutor } from './WorkflowExecutor';
import { randomUUID } from 'crypto';
import { dbClient } from '../database/client/DatabaseClient';

export class WorkflowScheduler {
  private executor: WorkflowExecutor;

  constructor(executor: WorkflowExecutor) {
    this.executor = executor;
  }

  /**
   * Schedules a workflow for asynchronous execution.
   * Returns the Execution ID immediately while the workflow runs in the background.
   */
  public async scheduleRun(definition: WorkflowDefinition, initialVariables: Record<string, any> = {}): Promise<string> {
    const executionId = randomUUID();
    const context = {
      workflowId: definition.id,
      executionId: executionId,
      traceId: randomUUID(),
      variables: initialVariables,
      nodeResults: {},
      currentNodeId: definition.graph.startNodeId,
      status: 'RUNNING' as const
    };

    await dbClient.query(`
      INSERT INTO workflow_executions (id, workflow_id, workflow_version, status, variables, started_at, trace_id)
      VALUES ($1, $2, $3, 'RUNNING', $4, NOW(), $5)
    `, [executionId, definition.id, definition.version, JSON.stringify(initialVariables), context.traceId]);

    // Trigger async execution
    setImmediate(() => {
      this.executor.execute(definition, context)
        .then(finalContext => {
          dbClient.query(`
            UPDATE workflow_executions 
            SET status = $1, output = $2, completed_at = NOW(), duration_ms = EXTRACT(EPOCH FROM (NOW() - started_at)) * 1000
            WHERE id = $3
          `, [finalContext.status === 'COMPLETED' ? 'COMPLETED' : 'FAILED', JSON.stringify(finalContext.variables), executionId])
            .catch(err => console.error(`Failed to update execution ${executionId}:`, err));
        })
        .catch(err => {
          console.error(`Workflow execution async wrapper failed: ${err.message}`);
          dbClient.query(`
            UPDATE workflow_executions 
            SET status = 'FAILED', error = $1, completed_at = NOW()
            WHERE id = $2
          `, [err.message, executionId]).catch(e => console.error(`Failed to update failed execution ${executionId}:`, e));
        });
    });

    return executionId;
  }
}
