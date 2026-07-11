import { z } from 'zod';

export const telemetrySchema = z.object({
  incidentId: z.string(),
  service: z.string(),
  source: z.string(),
  environment: z.enum(['dev', 'staging', 'production']),
  timestamp: z.string(),
  logs: z.string(),
  host: z.string(),
  application: z.string(),
  region: z.string(),
});

export type TelemetryInput = z.infer<typeof telemetrySchema>;
