import { runbookRepository } from '../../database/repositories/RunbookRepository';
import { runbookPolicyEngine } from './RunbookPolicyEngine';
import { approvalEngine } from './ApprovalEngine';
import { rollbackEngine } from './RollbackEngine';
import { ExecutorFactory } from '../executors/ExecutorFactory';
import {
  Runbook,
  RunbookExecutionContext,
  RunbookExecutionStatus,
  StepExecutionStatus,
  RunbookExecutionStep
} from '../types';
import { eventPublisher } from '../../events/EventPublisher';
import { LoggerService } from '../../mastra/services/loggerService';
import { randomUUID } from 'crypto';

export class RunbookEngine {
  private log = new LoggerService('RunbookEngine');

  // Metrics registry simulation
  public metrics = {
    executionsTotal: 0,
    executionsFailed: 0,
    rollbacksTotal: 0,
    timeoutsTotal: 0,
    retriesTotal: 0,
    executionDurations: [] as number[],
  };

  /**
   * Process a triggered runbook match.
   */
  public async handleTrigger(runbook: Runbook, context: RunbookExecutionContext): Promise<void> {
    this.metrics.executionsTotal++;

    // 1. Evaluate policy
    const policyPassed = await runbookPolicyEngine.evaluate(runbook, context);
    if (!policyPassed) {
      this.log.info(`[Engine] Policy failed for runbook ${runbook.id}. Aborting.`);
      return;
    }

    eventPublisher.publish(
      'RunbookMatched',
      runbook.id,
      'Runbook',
      { incidentId: context.incidentId, runbookId: runbook.id, policyDetails: 'Standard Policy Passed' }
    );

    // 2. Evaluate approval type
    const approvalType = runbook.approvalRequired ? 'MANUAL' : 'AUTO';
    const requiresApproval = await approvalEngine.evaluateApproval(approvalType, context);

    const execId = context.executionId;
    const startTime = new Date().toISOString();

    if (requiresApproval) {
      this.log.info(`[Engine] Runbook ${runbook.id} requires manual approval.`);
      
      await runbookRepository.createExecution({
        id: execId,
        incidentId: context.incidentId,
        runbookId: runbook.id,
        status: RunbookExecutionStatus.WAITING_APPROVAL,
        startTime,
        traceId: context.traceId,
        requestId: context.requestId,
      });

      eventPublisher.publish(
        'ApprovalRequested',
        execId,
        'RunbookExecution',
        { incidentId: context.incidentId, runbookId: runbook.id, executionId: execId, approvalType }
      );
    } else {
      // Auto execution
      await runbookRepository.createExecution({
        id: execId,
        incidentId: context.incidentId,
        runbookId: runbook.id,
        status: RunbookExecutionStatus.RUNNING,
        startTime,
        traceId: context.traceId,
        requestId: context.requestId,
      });

      // Run asynchronously
      this.executeRunbook(runbook, context).catch(err => {
        this.log.error(`[Engine] Async runbook execution failed: ${err}`);
      });
    }
  }

  /**
   * Execute steps of the runbook.
   */
  public async executeRunbook(runbook: Runbook, context: RunbookExecutionContext): Promise<void> {
    const execId = context.executionId;
    this.log.info(`[Engine] Starting execution ${execId} for runbook ${runbook.id}`);
    const start = performance.now();

    eventPublisher.publish(
      'RunbookExecutionStarted',
      execId,
      'RunbookExecution',
      { incidentId: context.incidentId, runbookId: runbook.id, executionId: execId }
    );

    let executionFailed = false;

    // Timeout loop handling
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('EXECUTION_TIMED_OUT')), runbook.timeoutSeconds * 1000);
    });

    const executionPromise = (async () => {
      for (let i = 0; i < runbook.executionSteps.length; i++) {
        const step = runbook.executionSteps[i];
        const stepId = randomUUID();
        const stepStartTime = new Date().toISOString();
        const stepStart = performance.now();

        await runbookRepository.createExecutionStep({
          id: stepId,
          executionId: execId,
          stepIndex: i,
          name: step.name,
          type: step.type,
          status: StepExecutionStatus.RUNNING,
          startTime: stepStartTime,
          retryCount: 0,
        });

        eventPublisher.publish(
          'RunbookStepStarted',
          execId,
          'RunbookExecution',
          { executionId: execId, stepIndex: i, stepName: step.name, stepType: step.type }
        );

        let success = false;
        let attempt = 0;
        let lastOutput = '';
        let lastError = '';

        while (attempt <= runbook.retryLimit) {
          try {
            const executor = ExecutorFactory.getExecutor(step.type);
            const result = await executor.execute(step, context);
            lastOutput = result.output || '';

            if (result.success) {
              success = true;
              break;
            } else {
              lastError = result.error || 'Execution failed';
              if (result.error === 'CONDITION_FAILED') {
                // Condition not met, skip next steps / complete early
                this.log.info(`[Engine] Condition step failed/skipped. Ending early.`);
                break;
              }
            }
          } catch (err) {
            lastError = err instanceof Error ? err.message : 'Unknown step execution error';
          }

          attempt++;
          if (attempt <= runbook.retryLimit) {
            this.metrics.retriesTotal++;
            eventPublisher.publish(
              'StepRetrying',
              execId,
              'RunbookExecution',
              { executionId: execId, stepIndex: i, attempt, error: lastError }
            );
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500)); // Exponential backoff
          }
        }

        const stepDurationMs = Math.round(performance.now() - stepStart);

        if (success) {
          await runbookRepository.updateExecutionStep(stepId, {
            status: StepExecutionStatus.SUCCESS,
            endTime: new Date().toISOString(),
            durationMs: stepDurationMs,
            output: lastOutput,
          });

          eventPublisher.publish(
            'RunbookStepCompleted',
            execId,
            'RunbookExecution',
            { executionId: execId, stepIndex: i, stepName: step.name, durationMs: stepDurationMs, output: lastOutput }
          );
        } else {
          executionFailed = true;
          await runbookRepository.updateExecutionStep(stepId, {
            status: StepExecutionStatus.FAILED,
            endTime: new Date().toISOString(),
            durationMs: stepDurationMs,
            error: lastError,
          });

          eventPublisher.publish(
            'StepFailed',
            execId,
            'RunbookExecution',
            { executionId: execId, stepIndex: i, error: lastError }
          );
          break; // Stop execution on first unrecovered failure
        }
      }
    })();

    try {
      await Promise.race([executionPromise, timeoutPromise]);

      const durationMs = Math.round(performance.now() - start);
      this.metrics.executionDurations.push(durationMs);

      if (executionFailed) {
        this.metrics.executionsFailed++;
        await runbookRepository.updateExecution(execId, {
          status: RunbookExecutionStatus.FAILED,
          endTime: new Date().toISOString(),
          durationMs,
        });

        eventPublisher.publish(
          'RunbookExecutionFailed',
          execId,
          'RunbookExecution',
          { incidentId: context.incidentId, runbookId: runbook.id, executionId: execId, error: 'Step execution failed', durationMs }
        );

        // Execute rollback steps if configured
        if (runbook.rollbackSteps.length > 0) {
          this.metrics.rollbacksTotal++;
          await runbookRepository.updateExecution(execId, { status: RunbookExecutionStatus.ROLLING_BACK });
          await rollbackEngine.executeRollback(execId, runbook.rollbackSteps, context);
        }
      } else {
        await runbookRepository.updateExecution(execId, {
          status: RunbookExecutionStatus.COMPLETED,
          endTime: new Date().toISOString(),
          durationMs,
        });

        eventPublisher.publish(
          'RunbookExecutionCompleted',
          execId,
          'RunbookExecution',
          { incidentId: context.incidentId, runbookId: runbook.id, executionId: execId, durationMs }
        );
      }
    } catch (err) {
      const durationMs = Math.round(performance.now() - start);
      this.metrics.executionDurations.push(durationMs);

      if (err instanceof Error && err.message === 'EXECUTION_TIMED_OUT') {
        this.metrics.timeoutsTotal++;
        await runbookRepository.updateExecution(execId, {
          status: RunbookExecutionStatus.FAILED,
          endTime: new Date().toISOString(),
          durationMs,
        });

        eventPublisher.publish(
          'ExecutionTimedOut',
          execId,
          'RunbookExecution',
          { executionId: execId, timeoutSeconds: runbook.timeoutSeconds }
        );
      } else {
        this.metrics.executionsFailed++;
        const msg = err instanceof Error ? err.message : 'Unknown execution crash';
        await runbookRepository.updateExecution(execId, {
          status: RunbookExecutionStatus.FAILED,
          endTime: new Date().toISOString(),
          durationMs,
        });

        eventPublisher.publish(
          'RunbookExecutionFailed',
          execId,
          'RunbookExecution',
          { incidentId: context.incidentId, runbookId: runbook.id, executionId: execId, error: msg, durationMs }
        );
      }
    }
  }

  /**
   * Action trigger for Manual Approval Granting.
   */
  public async grantApproval(executionId: string, approvedBy: string): Promise<void> {
    const exec = await runbookRepository.getExecutionById(executionId);
    if (!exec || exec.status !== RunbookExecutionStatus.WAITING_APPROVAL) {
      throw new Error(`Execution ${executionId} is not in WAITING_APPROVAL status`);
    }

    const runbook = await runbookRepository.getRunbookById(exec.runbookId);
    if (!runbook) throw new Error('Runbook definition not found');

    await runbookRepository.updateExecution(executionId, { status: RunbookExecutionStatus.RUNNING });

    eventPublisher.publish(
      'ApprovalGranted',
      executionId,
      'RunbookExecution',
      { incidentId: exec.incidentId, runbookId: exec.runbookId, executionId, approvedBy }
    );

    // Run asynchronously
    const context: RunbookExecutionContext = {
      incidentId: exec.incidentId,
      runbookId: exec.runbookId,
      executionId,
      traceId: exec.traceId,
      requestId: exec.requestId,
      service: runbook.service,
      environment: 'production',
      severity: runbook.severity,
    };

    this.executeRunbook(runbook, context).catch(err => {
      this.log.error(`[Engine] Async manual-triggered runbook failed: ${err}`);
    });
  }

  /**
   * Action trigger for Manual Approval Rejection.
   */
  public async rejectApproval(executionId: string, rejectedBy: string, reason?: string): Promise<void> {
    const exec = await runbookRepository.getExecutionById(executionId);
    if (!exec || exec.status !== RunbookExecutionStatus.WAITING_APPROVAL) {
      throw new Error(`Execution ${executionId} is not in WAITING_APPROVAL status`);
    }

    await runbookRepository.updateExecution(executionId, {
      status: RunbookExecutionStatus.FAILED,
      endTime: new Date().toISOString(),
      durationMs: 0,
    });

    eventPublisher.publish(
      'ApprovalRejected',
      executionId,
      'RunbookExecution',
      { incidentId: exec.incidentId, runbookId: exec.runbookId, executionId, rejectedBy, reason }
    );
  }
}

export const runbookEngine = new RunbookEngine();
