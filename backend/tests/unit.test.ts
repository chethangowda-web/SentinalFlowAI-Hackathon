import { tracer } from '../src/platform/monitoring/Tracer';
import { LogRedactor } from '../src/platform/logging/StructuredLogger';

describe('Unit Tests - Platform telemetry and log redaction', () => {
  it('should successfully trace functions using tracer spans', async () => {
    let callCount = 0;
    const result = await tracer.trace('test_operation', async (span) => {
      callCount++;
      return 'success';
    });
    expect(result).toBe('success');
    expect(callCount).toBe(1);
  });

  it('should redact sensitive passwords and tokens from logs', () => {
    const raw = {
      user: 'postgres',
      password: 'password123',
      apiKey: 'sec-98124',
      token: 'jwt-token-9988',
      safeKey: 'value-ok'
    };

    const redacted = LogRedactor.redact(raw);
    expect(redacted.password).toBe('[REDACTED]');
    expect(redacted.apiKey).toBe('[REDACTED]');
    expect(redacted.token).toBe('[REDACTED]');
    expect(redacted.safeKey).toBe('value-ok');
  });

  it('should redact secrets in URL formats', () => {
    const dbUrl = 'postgres://postgres:securepass12@localhost:5432/sentinelflow';
    const redacted = LogRedactor.redact(dbUrl);
    expect(redacted).toBe('postgres://postgres:[REDACTED]@localhost:5432/sentinelflow');
  });
});
