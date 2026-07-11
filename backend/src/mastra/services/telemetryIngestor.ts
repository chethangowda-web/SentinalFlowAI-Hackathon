import { telemetrySchema, TelemetryInput } from '../types/telemetry';
import { randomUUID } from 'crypto';

export class TelemetryIngestor {
  async ingest(data: Partial<TelemetryInput>): Promise<TelemetryInput> {
    console.log(`[Telemetry] Ingestion started at ${new Date().toISOString()}`);

    const raw: Record<string, any> = { ...data };

    if (!raw.incidentId) {
      raw.incidentId = randomUUID();
    }

    if (!raw.timestamp) {
      raw.timestamp = new Date().toISOString();
    }

    if (typeof raw.environment === 'string') {
      raw.environment = raw.environment.toLowerCase();
    }

    const fieldsToTrim = ['logs', 'service', 'application', 'source', 'host', 'region'];
    for (const field of fieldsToTrim) {
      if (typeof raw[field] === 'string') {
        raw[field] = raw[field].trim();
      }
    }

    const parsed = telemetrySchema.safeParse(raw);
    if (!parsed.success) {
      const issueDetails = parsed.error.issues
        .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
        .join('; ');
      throw new Error(`[TelemetryIngestor] ${issueDetails}`);
    }

    const validatedData = parsed.data;
    console.log(`[Telemetry] Incident ${validatedData.incidentId} accepted`);

    return validatedData;
  }
}

export const telemetryIngestor = new TelemetryIngestor();
