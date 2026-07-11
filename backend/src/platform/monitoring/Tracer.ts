import { randomUUID } from 'crypto';

export interface Span {
  spanId: string;
  traceId: string;
  parentId?: string;
  name: string;
  startTime: number;
  endTime?: number;
  attributes: Record<string, any>;
}

export class Tracer {
  private spans: Map<string, Span> = new Map();

  public startSpan(name: string, parentContext?: { traceId: string; spanId?: string }): Span {
    const spanId = randomUUID().replace(/-/g, '').substring(0, 16);
    const traceId = parentContext?.traceId || randomUUID().replace(/-/g, '');
    const parentId = parentContext?.spanId;

    const span: Span = {
      spanId,
      traceId,
      parentId,
      name,
      startTime: Date.now(),
      attributes: {},
    };

    this.spans.set(spanId, span);
    return span;
  }

  public endSpan(spanId: string, attributes?: Record<string, any>): Span | null {
    const span = this.spans.get(spanId);
    if (!span) return null;

    span.endTime = Date.now();
    if (attributes) {
      span.attributes = { ...span.attributes, ...attributes };
    }

    const duration = span.endTime - span.startTime;
    console.log(
      JSON.stringify({
        type: 'trace_span',
        spanId: span.spanId,
        traceId: span.traceId,
        parentId: span.parentId,
        name: span.name,
        durationMs: duration,
        attributes: span.attributes,
      })
    );

    return span;
  }

  public async trace<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    parentContext?: { traceId: string; spanId?: string }
  ): Promise<T> {
    const span = this.startSpan(name, parentContext);
    try {
      const result = await fn(span);
      this.endSpan(span.spanId, { status: 'success' });
      return result;
    } catch (err: any) {
      this.endSpan(span.spanId, { status: 'error', error: err.message });
      throw err;
    }
  }
}

export const tracer = new Tracer();
export default tracer;
