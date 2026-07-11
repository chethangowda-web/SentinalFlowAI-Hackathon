import { MiddlewareHandler } from 'hono';
import { randomUUID } from 'crypto';
import { cacheManager } from '../cache/CacheManager';

export class APIInfrastructure {
  public static correlationMiddleware(): MiddlewareHandler {
    return async (c, next) => {
      const requestId = randomUUID();
      const correlationId = c.req.header('X-Correlation-Id') || randomUUID();
      c.res.headers.set('X-Request-Id', requestId);
      c.res.headers.set('X-Correlation-Id', correlationId);
      c.set('requestId', requestId);
      c.set('correlationId', correlationId);
      await next();
    };
  }

  public static rateLimiterMiddleware(maxRequests = 100, windowMs = 60000): MiddlewareHandler {
    return async (c, next) => {
      const ip = c.req.header('x-forwarded-for') || 'ip-default';
      const cacheKey = `rate:${ip}`;

      const count = (await cacheManager.get<number>(cacheKey)) || 0;
      if (count >= maxRequests) {
        return c.json({ error: 'Too many requests. Rate limit exceeded.' }, 429);
      }

      await cacheManager.set(cacheKey, count + 1, windowMs);
      await next();
    };
  }

  public static getOpenAPISpec(): Record<string, any> {
    return {
      openapi: '3.0.0',
      info: {
        title: 'SentinelFlow Enterprise API',
        version: '1.0.0',
        description: 'Operational and intelligence endpoints for SentinelFlow SRE Platform',
      },
      paths: {
        '/custom/v1/health': {
          get: {
            summary: 'Liveness status',
            responses: { 200: { description: 'Platform is active' } },
          },
        },
        '/custom/v1/health/dependencies': {
          get: {
            summary: 'Readiness status checking PG and Qdrant',
            responses: { 200: { description: 'All dependencies healthy' } },
          },
        },
      },
    };
  }
}
export default APIInfrastructure;
