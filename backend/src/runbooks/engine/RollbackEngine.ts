import { RunbookStep, RunbookExecutionContext, StepExecutionStatus } from '../types';
import { ExecutorFactory } from '../executors/ExecutorFactory';
import { runbookRepository } from '../../database/repositories/RunbookRepository';
import { eventPublisher } from '../../events/EventPublisher';
import { LoggerService } from '../../mastra/services/loggerService';
import { randomUUID } from 'crypto';

export class RollbackEngine {
  private log = new LoggerService('RollbackEngine');

  public async executeRollback(
    executionId: string,
    rollbackSteps: RunbookStep[],
    context: RunbookExecutionContext
  ): Promise<void> {
    this.log.warn(`[Rollback] Initializing rollback for execution ${executionId}`);
    
    eventPublisher.publish(
      'RollbackStarted',
      executionId,
      'RunbookExecution',
      { incidentId: context.incidentId, runbookId: context.runbookId, executionId }
    );

    let rollbackFailed = false;

    for (let i = 0; i < rollbackSteps.length; i++) {
      const step = rollbackSteps[i];
      const stepId = randomUUID();
      const startTime = new Date().toISOString();
      const start = performance.now();

      await runbookRepository.createExecutionStep({
        id: stepId,
        executionId,
        stepIndex: i + 100, // Rollback steps offset by 100
        name: `Rollback: ${step.name}`,
        type: step.type,
        status: StepExecutionStatus.PENDING,
        startTime,
        retryCount: 0,
      });

      try {
        const executor = ExecutorFactory.getExecutor(step.type);
        const result = await executor.execute(step, context);

        const durationMs = Math.round(performance.now() - start);

        if (result.success) {
          await runbookRepository.updateExecutionStep(stepId, {
            status: StepExecutionStatus.SUCCESS,
            endTime: new Date().toISOString(),
            durationMs,
            output: result.output,
          });
        } else {
          rollbackFailed = true;
          await runbookRepository.updateExecutionStep(stepId, {
            status: StepExecutionStatus.FAILED,
            endTime: new Date().toISOString(),
            durationMs,
            error: result.error,
          });
        }
      } catch (err) {
        rollbackFailed = true;
        const msg = err instanceof Error ? err.message : 'Unknown error';
        await runbookRepository.updateExecutionStep(stepId, {
          status: StepExecutionStatus.FAILED,
          endTime: new Date().toISOString(),
          durationMs: Math.round(performance.now() - start),
          error: msg,
        });
      }
    }

    if (rollbackFailed) {
      eventPublisher.publish(
        'RollbackFailed',
        executionId,
        'RunbookExecution',
        { incidentId: context.incidentId, runbookId: context.runbookId, executionId, error: 'One or more rollback steps failed' }
      );
    } else {
      eventPublisher.publish(
        'RollbackCompleted',
        executionId,
        'RunbookExecution',
        { incidentId: context.incidentId, runbookId: context.runbookId, executionId }
      );
    }
  }
}

export const rollbackEngine = new RollbackEngine();
