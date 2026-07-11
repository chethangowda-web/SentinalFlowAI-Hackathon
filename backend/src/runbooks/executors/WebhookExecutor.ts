import { IRunbookExecutor, ExecutionResult } from './RunbookExecutor';
import { RunbookStep, RunbookExecutionContext } from '../types';

export class WebhookExecutor implements IRunbookExecutor {
  async execute(step: RunbookStep, context: RunbookExecutionContext): Promise<ExecutionResult> {
    const url = step.arguments.url;
    const method = (step.arguments.method || 'POST').toUpperCase();
    const headers = step.arguments.headers || {};
    const body = step.arguments.body || {};
    const timeout = parseInt(step.arguments.timeoutMs || '5000');

    if (!url) {
      return { success: false, error: 'No URL specified for Webhook step' };
    }

    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: method !== 'GET' && method !== 'HEAD' ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(id);

      const responseText = await response.text();
      const output = `Status: ${response.status} | Body: ${responseText.substr(0, 1000)}`;

      if (!response.ok) {
        return { success: false, error: `Server returned status ${response.status}`, output };
      }

      return { success: true, output };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown network error';
      return { success: false, error: msg };
    }
  }
}
