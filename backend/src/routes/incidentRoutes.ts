import { registerApiRoute } from '@mastra/core/server';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { incidentOrchestrator } from '../mastra/services/incidentOrchestrator';
import { LoggerService } from '../mastra/services/loggerService';

// ---------------------------------------------------------------------------
// Request validation schema
// ---------------------------------------------------------------------------

const analyzeRequestSchema = z.object({
  logs: z.string().min(1, 'logs must not be empty'),
  service: z.string().min(1, 'service must not be empty'),
  environment: z.enum(['dev', 'staging', 'production']),
});

// ---------------------------------------------------------------------------
// POST /incidents/analyze
// Note: Mastra mounts routes under its configured apiPrefix (/api by default),
// so this path becomes /api/incidents/analyze.
// ---------------------------------------------------------------------------

export const analyzeIncidentRoute = registerApiRoute('/incidents/analyze', {
  method: 'POST',
  handler: async (c) => {
    const incidentId = randomUUID();
    const requestId = randomUUID();
    const receivedAt = new Date().toISOString();

    const mastraInstance = c.get('mastra');
    const log = new LoggerService('IncidentAPI', mastraInstance?.getLogger());

    log.info(`Received analyze request — incidentId: ${incidentId}, requestId: ${requestId}`);

    // -----------------------------------------------------------------------
    // 1. Parse and validate the request body
    // -----------------------------------------------------------------------

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      log.warn(`[${incidentId}] Failed to parse request body as JSON`);
      return c.json({ error: 'Invalid JSON body' }, 400);
    }

    const parsed = analyzeRequestSchema.safeParse(body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        path: issue.path.join('.') || 'root',
        message: issue.message,
      }));
      log.warn(`[${incidentId}] Validation failed: ${JSON.stringify(details)}`);
      return c.json({ error: 'Invalid request body', details }, 400);
    }

    const { logs, service, environment } = parsed.data;

    log.info(`[${incidentId}] Validated — service: ${service}, environment: ${environment}`);

    // -----------------------------------------------------------------------
    // 2. Delegate to the IncidentOrchestrator
    // -----------------------------------------------------------------------

    const result = await incidentOrchestrator.analyze(
      {
        incidentId,
        rawLogs: logs,
        service,
        environment,
        context: {
          requestId,
          receivedAt,
          source: 'api',
        },
      },
      mastraInstance,
    );

    if (!result.success) {
      log.error(`[${incidentId}] Analysis failed: ${result.error.message}`);
      return c.json({ error: result.error }, 500);
    }

    log.info(`[${incidentId}] Analysis complete — status: ${result.report.status} — ${(result.durationMs / 1000).toFixed(2)}s`);

    return c.json(
      {
        success: true,
        incidentId: result.incidentId,
        report: result.report,
        durationMs: result.durationMs,
      },
      200,
    );
  },
});
