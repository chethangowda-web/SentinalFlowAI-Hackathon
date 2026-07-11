import { ConnectionMetadata } from '../types';

export class ConnectionRepository {
  private connections = new Map<string, ConnectionMetadata>();
  private rooms = new Map<string, Set<string>>(); // room -> Set of connectionId

  public save(connectionId: string, metadata: ConnectionMetadata): void {
    this.connections.set(connectionId, metadata);
    // Track room subscriptions
    for (const room of metadata.subscriptions) {
      this.addToRoom(connectionId, room);
    }
  }

  public get(connectionId: string): ConnectionMetadata | undefined {
    return this.connections.get(connectionId);
  }

  public delete(connectionId: string): void {
    const metadata = this.connections.get(connectionId);
    if (metadata) {
      for (const room of metadata.subscriptions) {
        this.removeFromRoom(connectionId, room);
      }
    }
    this.connections.delete(connectionId);
  }

  public getAll(): ConnectionMetadata[] {
    return Array.from(this.connections.values());
  }

  public getByUserId(userId: string): ConnectionMetadata[] {
    return this.getAll().filter((c) => c.userId === userId);
  }

  public getByOrganizationId(orgId: string): ConnectionMetadata[] {
    return this.getAll().filter((c) => c.organizationId === orgId);
  }

  public addToRoom(connectionId: string, room: string): void {
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    this.rooms.get(room)!.add(connectionId);

    const conn = this.connections.get(connectionId);
    if (conn) {
      conn.subscriptions.add(room);
    }
  }

  public removeFromRoom(connectionId: string, room: string): void {
    const members = this.rooms.get(room);
    if (members) {
      members.delete(connectionId);
      if (members.size === 0) {
        this.rooms.delete(room);
      }
    }
    const conn = this.connections.get(connectionId);
    if (conn) {
      conn.subscriptions.delete(room);
    }
  }

  public getRoomMembers(room: string): string[] {
    const members = this.rooms.get(room);
    return members ? Array.from(members) : [];
  }

  public getActiveRooms(): { room: string; count: number }[] {
    return Array.from(this.rooms.entries()).map(([room, members]) => ({
      room,
      count: members.size,
    }));
  }
}

export const connectionRepository = new ConnectionRepository();
export default connectionRepository;
