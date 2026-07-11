import { IRunbookExecutor, ExecutionResult } from './RunbookExecutor';
import { RunbookStep, RunbookExecutionContext } from '../types';
import { kubernetesService } from '../../observability/services/KubernetesService';

export class KubernetesExecutor implements IRunbookExecutor {
  async execute(step: RunbookStep, context: RunbookExecutionContext): Promise<ExecutionResult> {
    const action = step.arguments.action; // 'RestartDeployment', 'ScaleDeployment', 'DeletePod', 'CordonNode'
    const namespace = step.arguments.namespace || 'default';
    const name = step.arguments.name;

    if (!action) {
      return { success: false, error: 'No action argument specified for Kubernetes step' };
    }

    try {
      let success = false;
      let output = '';

      switch (action) {
        case 'RestartDeployment':
          success = await kubernetesService.restartDeployment(namespace, name);
          output = success ? `Restarted deployment ${name}` : `Failed to restart deployment ${name}`;
          break;
        case 'ScaleDeployment':
          const replicas = parseInt(step.arguments.replicas || '1');
          success = await kubernetesService.scaleDeployment(namespace, name, replicas);
          output = success ? `Scaled deployment ${name} to ${replicas}` : `Failed to scale deployment ${name}`;
          break;
        case 'DeletePod':
          success = await kubernetesService.deletePod(namespace, name);
          output = success ? `Deleted pod ${name}` : `Failed to delete pod ${name}`;
          break;
        case 'CordonNode':
          success = await kubernetesService.cordonNode(name);
          output = success ? `Cordoned node ${name}` : `Failed to cordon node ${name}`;
          break;
        default:
          return { success: false, error: `Unsupported Kubernetes action: ${action}` };
      }

      return { success, output };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown Kubernetes error',
      };
    }
  }
}
