import { MessageEnvelope } from '../types';

export class MessageFormatter {
  private sequenceNumber = 0;

  public format<T>(
    type: string,
    payload: T,
    traceId?: string,
    correlationId?: string
  ): MessageEnvelope<T> {
    this.sequenceNumber++;
    return {
      type,
      version: '1.0',
      timestamp: new Date().toISOString(),
      traceId,
      correlationId,
      sequenceNumber: this.sequenceNumber,
      payload,
    };
  }
}

export const messageFormatter = new MessageFormatter();
export default messageFormatter;
