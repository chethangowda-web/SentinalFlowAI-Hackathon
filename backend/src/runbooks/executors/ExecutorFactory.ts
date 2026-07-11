import { IRunbookExecutor } from './RunbookExecutor';
import { KubernetesExecutor } from './KubernetesExecutor';
import { WebhookExecutor } from './WebhookExecutor';
import { CommandExecutor } from './CommandExecutor';
import { DelayExecutor } from './DelayExecutor';
import { ConditionExecutor } from './ConditionExecutor';
import { SlackExecutor } from './SlackExecutor';
import { TeamsExecutor } from './TeamsExecutor';

export class ExecutorFactory {
  private static executors: Record<string, IRunbookExecutor> = {
    kubernetes: new KubernetesExecutor(),
    webhook: new WebhookExecutor(),
    command: new CommandExecutor(),
    delay: new DelayExecutor(),
    condition: new ConditionExecutor(),
    slack: new SlackExecutor(),
    teams: new TeamsExecutor(),
  };

  /**
   * Register a custom executor at runtime.
   */
  public static registerExecutor(type: string, executor: IRunbookExecutor): void {
    this.executors[type.toLowerCase()] = executor;
  }

  public static getExecutor(type: string): IRunbookExecutor {
    // Standardize K8s steps
    let execType = type.toLowerCase();
    if (['restartdeployment', 'scaledeployment', 'deletepod', 'cordonnode'].includes(execType)) {
      execType = 'kubernetes';
    }

    const executor = this.executors[execType];
    if (!executor) {
      throw new Error(`No executor registered for step type: ${type}`);
    }
    return executor;
  }
}
