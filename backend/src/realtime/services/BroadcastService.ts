import { IWebSocketTransport, MessageEnvelope } from '../types';
import { connectionRepository } from './ConnectionRepository';
import { messageFormatter } from './MessageFormatter';
import { replayBuffer } from './ReplayBuffer';
import { metricsCollector } from './MetricsCollector';

export class BroadcastService {
  private transport?: IWebSocketTransport;

  public registerTransport(transport: IWebSocketTransport): void {
    this.transport = transport;
  }

  public async broadcastToRoom(
    room: string,
    orgId: string,
    type: string,
    payload: any,
    traceId?: string,
    correlationId?: string
  ): Promise<void> {
    const startTime = Date.now();
    const envelope = messageFormatter.format(type, payload, traceId, correlationId);

    // Save to Replay Buffer (missed event recovery)
    replayBuffer.push(orgId, envelope, room);

    const members = connectionRepository.getRoomMembers(room);
    if (members.length === 0) return;

    await this.sendToConnections(members, envelope);
    metricsCollector.recordBroadcast(Date.now() - startTime);
  }

  public async broadcastToOrganization(
    orgId: string,
    type: string,
    payload: any,
    traceId?: string,
    correlationId?: string
  ): Promise<void> {
    const startTime = Date.now();
    const envelope = messageFormatter.format(type, payload, traceId, correlationId);

    // Save to Replay Buffer (missed event recovery)
    replayBuffer.push(orgId, envelope);

    const conns = connectionRepository.getByOrganizationId(orgId);
    if (conns.length === 0) return;

    const ids = conns.map((c) => c.connectionId);
    await this.sendToConnections(ids, envelope);
    metricsCollector.recordBroadcast(Date.now() - startTime);
  }

  public async broadcastToUser(
    userId: string,
    orgId: string,
    type: string,
    payload: any,
    traceId?: string,
    correlationId?: string
  ): Promise<void> {
    const startTime = Date.now();
    const envelope = messageFormatter.format(type, payload, traceId, correlationId);

    // Save to Replay Buffer (missed event recovery)
    replayBuffer.push(orgId, envelope, `user:${userId}`);

    const conns = connectionRepository.getByUserId(userId);
    if (conns.length === 0) return;

    const ids = conns.map((c) => c.connectionId);
    await this.sendToConnections(ids, envelope);
    metricsCollector.recordBroadcast(Date.now() - startTime);
  }

  private async sendToConnections(connectionIds: string[], envelope: MessageEnvelope): Promise<void> {
    if (!this.transport) {
      console.warn('[BroadcastService] No transport registered. Dropping broadcast.');
      metricsCollector.incrementDropped();
      return;
    }

    const payload = JSON.stringify(envelope);
    const promises = connectionIds.map(async (connId) => {
      try {
        const success = await this.transport!.send(connId, payload);
        if (success) {
          metricsCollector.incrementSent();
        } else {
          metricsCollector.incrementFailedSends();
        }
      } catch (err) {
        console.error(`[BroadcastService] Failed sending to connection ${connId}:`, err);
        metricsCollector.incrementFailedSends();
      }
    });

    await Promise.all(promises);
  }
}

export const broadcastService = new BroadcastService();
export default broadcastService;
