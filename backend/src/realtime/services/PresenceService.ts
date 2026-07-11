import { connectionRepository } from './ConnectionRepository';
import { broadcastService } from './BroadcastService';
import { authRepository } from '../../database/repositories/AuthRepository';
import { UserPresence } from '../types';
import { UserRole } from '../../auth/types/types';

export class PresenceService {
  private userCache = new Map<string, { fullName: string; role: UserRole }>();
  private roomPresence = new Map<string, Map<string, { typing: boolean; viewing: boolean; lastSeen: Date }>>();

  public async cacheUserDetails(userId: string): Promise<{ fullName: string; role: UserRole }> {
    const cached = this.userCache.get(userId);
    if (cached) return cached;

    try {
      const user = await authRepository.getUserById(userId);
      const details = {
        fullName: user?.fullName || 'Unknown User',
        role: user?.role || UserRole.VIEWER,
      };
      this.userCache.set(userId, details);
      return details;
    } catch (err) {
      console.error(`[PresenceService] Failed to load user ${userId}:`, err);
      return { fullName: 'Unknown User', role: UserRole.VIEWER };
    }
  }

  public async handleUserJoin(connectionId: string, room: string): Promise<void> {
    const conn = connectionRepository.get(connectionId);
    if (!conn) return;

    const { userId } = conn;
    await this.cacheUserDetails(userId);

    if (!this.roomPresence.has(room)) {
      this.roomPresence.set(room, new Map());
    }

    const roomMap = this.roomPresence.get(room)!;
    roomMap.set(userId, {
      typing: false,
      viewing: true,
      lastSeen: new Date(),
    });

    this.broadcastPresence(room, conn.organizationId);
  }

  public handleUserLeave(connectionId: string, room: string): void {
    const conn = connectionRepository.get(connectionId);
    if (!conn) return;

    const { userId } = conn;

    const roomMap = this.roomPresence.get(room);
    if (roomMap) {
      roomMap.delete(userId);
      if (roomMap.size === 0) {
        this.roomPresence.delete(room);
      }
    }

    this.broadcastPresence(room, conn.organizationId);
  }

  public async handleTypingState(connectionId: string, room: string, isTyping: boolean): Promise<void> {
    const conn = connectionRepository.get(connectionId);
    if (!conn) return;

    const { userId } = conn;
    await this.cacheUserDetails(userId);

    if (!this.roomPresence.has(room)) {
      this.roomPresence.set(room, new Map());
    }

    const roomMap = this.roomPresence.get(room)!;
    const current = roomMap.get(userId) || { typing: false, viewing: true, lastSeen: new Date() };
    roomMap.set(userId, {
      ...current,
      typing: isTyping,
      lastSeen: new Date(),
    });

    this.broadcastPresence(room, conn.organizationId);
  }

  public async handleViewingState(connectionId: string, room: string): Promise<void> {
    const conn = connectionRepository.get(connectionId);
    if (!conn) return;

    const { userId } = conn;
    await this.cacheUserDetails(userId);

    if (!this.roomPresence.has(room)) {
      this.roomPresence.set(room, new Map());
    }

    const roomMap = this.roomPresence.get(room)!;
    roomMap.set(userId, {
      typing: false,
      viewing: true,
      lastSeen: new Date(),
    });

    this.broadcastPresence(room, conn.organizationId);
  }

  public handleCleanup(connectionId: string): void {
    const conn = connectionRepository.get(connectionId);
    if (!conn) return;

    const { userId, subscriptions } = conn;

    for (const room of subscriptions) {
      const roomMap = this.roomPresence.get(room);
      if (roomMap) {
        roomMap.delete(userId);
        if (roomMap.size === 0) {
          this.roomPresence.delete(room);
        }
        this.broadcastPresence(room, conn.organizationId);
      }
    }
  }

  private broadcastPresence(room: string, orgId: string): void {
    const roomMap = this.roomPresence.get(room);
    if (!roomMap) return;

    const users: UserPresence[] = [];
    for (const [userId, state] of roomMap.entries()) {
      const details = this.userCache.get(userId) || { fullName: 'Unknown User', role: UserRole.VIEWER };
      users.push({
        userId,
        fullName: details.fullName,
        role: details.role,
        typing: state.typing,
        viewing: state.viewing,
        lastSeen: state.lastSeen.toISOString(),
      });
    }

    broadcastService.broadcastToRoom(room, orgId, 'presence:update', {
      room,
      users,
    });
  }
}

export const presenceService = new PresenceService();
export default presenceService;
