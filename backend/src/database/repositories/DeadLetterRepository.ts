import { randomUUID } from 'crypto';
import { dbClient } from '../client/DatabaseClient';
import { BaseDomainEvent } from '../../events/types/BaseDomainEvent';
import { LoggerService } from '../../mastra/services/loggerService';

export class DeadLetterRepository {
  private log = new LoggerService('DeadLetterRepository');

  public async persistFailedEvent(
    event: BaseDomainEvent,
    error: Error,
    retryCount: number
  ): Promise<void> {
    const text = `
      INSERT INTO dead_letter_events 
      (id, event_id, event_type, payload, error, retry_count, occurred_at, failed_at, stack_trace, resolved)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;
    const values = [
      randomUUID(),
      event.eventId,
      event.eventType,
      JSON.stringify(event),
      error.message,
      retryCount,
      event.occurredAt,
      new Date().toISOString(),
      error.stack || null,
      false
    ];

    try {
      await dbClient.query(text, values);
    } catch (dbError) {
      this.log.error(`[DLQ] Failed to persist dead letter for event ${event.eventId}: ${dbError}`);
    }
  }

  public async markResolved(eventId: string): Promise<void> {
    const text = `
      UPDATE dead_letter_events 
      SET resolved = TRUE, replayed_at = NOW() 
      WHERE event_id = $1
    `;
    await dbClient.query(text, [eventId]);
  }

  public async getUnresolvedEvents(): Promise<BaseDomainEvent[]> {
    const text = `SELECT payload FROM dead_letter_events WHERE resolved = FALSE ORDER BY failed_at ASC`;
    const res = await dbClient.query(text);
    return res.map(row => row.payload as BaseDomainEvent);
  }

  public async getEventById(eventId: string): Promise<BaseDomainEvent | null> {
    const text = `SELECT payload FROM dead_letter_events WHERE event_id = $1`;
    const res = await dbClient.query(text, [eventId]);
    if (res.length === 0) return null;
    return res[0].payload as BaseDomainEvent;
  }
}

export const deadLetterRepository = new DeadLetterRepository();
