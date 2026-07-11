import { Context, Next } from 'hono';
import { randomUUID } from 'crypto';

export async function requestContextMiddleware(c: Context, next: Next) {
  const traceId = c.req.header('X-Trace-ID') || `tr-${randomUUID()}`;
  const requestId = c.req.header('X-Request-ID') || `req-${randomUUID()}`;

  c.set('traceId', traceId);
  c.set('requestId', requestId);

  // Set response headers for audit tracing
  c.header('X-Trace-ID', traceId);
  c.header('X-Request-ID', requestId);

  await next();
}
