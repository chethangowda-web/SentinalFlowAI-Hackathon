import { registerApiRoute } from '@mastra/core/server';
import { z } from 'zod';
import { runbookRepository } from '../database/repositories/RunbookRepository';
import { runbookEngine } from '../runbooks/engine/RunbookEngine';
import { randomUUID } from 'crypto';

const runbookStepSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  arguments: z.record(z.string(), z.any()),
});

const createRunbookSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  service: z.string().min(1),
  triggerEvent: z.string().min(1),
  severity: z.string().min(1),
  enabled: z.boolean().default(true),
  approvalRequired: z.boolean().default(false),
  timeoutSeconds: z.number().int().default(600),
  retryLimit: z.number().int().default(3),
  executionSteps: z.array(runbookStepSchema),
  rollbackSteps: z.array(runbookStepSchema),
});

export const listRunbooksRoute = registerApiRoute('/runbooks', {
  method: 'GET',
  handler: async (c) => {
    const list = await runbookRepository.listRunbooks();
    return c.json(list, 200);
  }
});

export const createRunbookRoute = registerApiRoute('/runbooks', {
  method: 'POST',
  handler: async (c) => {
    try {
      const body = await c.req.json();
      const parsed = createRunbookSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
      }

      const runbook = await runbookRepository.createRunbook({
        id: randomUUID(),
        ...parsed.data,
      });

      return c.json(runbook, 201);
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500);
    }
  }
});

export const updateRunbookRoute = registerApiRoute('/runbooks/:id', {
  method: 'PATCH',
  handler: async (c) => {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const updates = createRunbookSchema.partial().parse(body);

      await runbookRepository.updateRunbook(id, updates);
      return c.json({ success: true, message: 'Runbook updated successfully' }, 200);
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500);
    }
  }
});

export const deleteRunbookRoute = registerApiRoute('/runbooks/:id', {
  method: 'DELETE',
  handler: async (c) => {
    const id = c.req.param('id');
    await runbookRepository.deleteRunbook(id);
    return c.json({ success: true, message: 'Runbook deleted' }, 200);
  }
});

export const executeRunbookRoute = registerApiRoute('/runbooks/:id/execute', {
  method: 'POST',
  handler: async (c) => {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const schema = z.object({
        incidentId: z.string().min(1),
        environment: z.string().default('production'),
        triggeredBy: z.string().default('user'),
      });
      const parsed = schema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
      }

      const runbook = await runbookRepository.getRunbookById(id);
      if (!runbook) return c.json({ error: 'Runbook not found' }, 404);

      const executionId = randomUUID();
      const context = {
        incidentId: parsed.data.incidentId,
        runbookId: id,
        executionId,
        service: runbook.service,
        environment: parsed.data.environment,
        severity: runbook.severity,
      };

      await runbookRepository.createExecution({
        id: executionId,
        incidentId: parsed.data.incidentId,
        runbookId: id,
        status: 'RUNNING' as any,
        startTime: new Date().toISOString(),
        triggeredBy: parsed.data.triggeredBy,
      });

      // Fire execution asynchronously
      runbookEngine.executeRunbook(runbook, context).catch(() => {});

      return c.json({ success: true, executionId }, 202);
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500);
    }
  }
});

export const listExecutionsRoute = registerApiRoute('/runbooks/executions', {
  method: 'GET',
  handler: async (c) => {
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    const executions = await runbookRepository.listExecutions(limit, offset);
    return c.json({ executions }, 200);
  }
});

export const getExecutionByIdRoute = registerApiRoute('/runbooks/executions/:id', {
  method: 'GET',
  handler: async (c) => {
    const id = c.req.param('id');
    const execution = await runbookRepository.getExecutionById(id);
    if (!execution) return c.json({ error: 'Execution history not found' }, 404);
    
    const steps = await runbookRepository.getExecutionSteps(id);
    return c.json({ execution, steps }, 200);
  }
});

export const getRunbookHistoryRoute = registerApiRoute('/runbooks/:id/history', {
  method: 'GET',
  handler: async (c) => {
    const id = c.req.param('id');
    // For simple history list executions of a specific runbook
    const all = await runbookRepository.listExecutions(100, 0);
    const filtered = all.filter(e => e.runbookId === id);
    return c.json({ history: filtered }, 200);
  }
});
