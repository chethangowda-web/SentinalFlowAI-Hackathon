import { registerApiRoute } from '@mastra/core/server';
import { z } from 'zod';
import { correlationEngine } from '../observability/pipeline/CorrelationEngine';
import { demoService } from '../mastra/services/DemoService';

const otlpPayloadSchema = z.object({
  service: z.string(),
  environment: z.enum(['dev', 'staging', 'production']).default('production'),
  logs: z.string(),
  metrics: z.record(z.string(), z.number()).optional(),
  traces: z.array(z.unknown()).optional(),
});

export const telemetryIngestionRoute = registerApiRoute('/custom/v1/telemetry/otlp', {
  method: 'POST',
  handler: async (c) => {
    try {
      const body = await c.req.json();
      const parsed = otlpPayloadSchema.safeParse(body);
      
      if (!parsed.success) {
        return c.json({ 
          success: false, 
          error: { code: 'VALIDATION_ERROR', message: 'Invalid payload', details: parsed.error.issues } 
        }, 400);
      }
      
      // We do not wait for the pipeline to finish to avoid blocking the client.
      // In a real high-throughput OTLP endpoint, this would be pushed to a queue (e.g. Kafka/Redis)
      correlationEngine.processTelemetry(parsed.data).catch(err => {
        console.error('[TelemetryIngestionRoute] Background processing failed:', err);
      });

      return c.json({ success: true, message: 'Telemetry accepted for processing' }, 202);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      return c.json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: msg }
      }, 500);
    }
  }
});

export const demoStartRoute = registerApiRoute('/custom/v1/demo/start', {
  method: 'POST',
  handler: async (c) => {
    demoService.startDemoMode();
    return c.json({ success: true, message: 'Demo mode started' }, 200);
  }
});

export const demoStopRoute = registerApiRoute('/custom/v1/demo/stop', {
  method: 'POST',
  handler: async (c) => {
    demoService.stopDemoMode();
    return c.json({ success: true, message: 'Demo mode stopped' }, 200);
  }
});
