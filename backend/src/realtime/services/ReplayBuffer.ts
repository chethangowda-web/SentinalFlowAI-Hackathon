import { ReplayEvent, MessageEnvelope } from '../types';

export class ReplayBuffer {
  private buffer: ReplayEvent[] = [];
  private maxSize = 1000;

  public push(orgId: string, envelope: MessageEnvelope, room?: string): void {
    const event: ReplayEvent = {
      sequenceNumber: envelope.sequenceNumber,
      orgId,
      room,
      envelope,
    };

    this.buffer.push(event);

    // Keep it bounded
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
  }

  public getEventsSince(
    sequenceNumber: number,
    orgId: string,
    subscribedRooms: Set<string>
  ): MessageEnvelope[] {
    const matched: MessageEnvelope[] = [];

    for (const event of this.buffer) {
      if (event.sequenceNumber <= sequenceNumber) continue;

      // Enforce organization scope / tenant isolation
      if (event.orgId !== orgId) continue;

      // Check if client is subscribed to the specific room of this event
      if (event.room) {
        if (subscribedRooms.has(event.room)) {
          matched.push(event.envelope);
        }
      } else {
        // If event is org-wide, client receives it
        matched.push(event.envelope);
      }
    }

    return matched;
  }
}

export const replayBuffer = new ReplayBuffer();
export default replayBuffer;
