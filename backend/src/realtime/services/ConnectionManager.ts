import { ConnectionMetadata, MessageEnvelope } from '../types';
import { connectionRepository } from './ConnectionRepository';
import { replayBuffer } from './ReplayBuffer';
import { metricsCollector } from './MetricsCollector';
import { incidentRepository } from '../../database/repositories/IncidentRepository';
import { PermissionScope } from '../../auth/authorization/PermissionService';

export interface ResumableSession {
  userId: string;
  organizationId: string;
  role: any;
  permissions: PermissionScope[];
  subscriptions: Set<string>;
  disconnectedAt: number;
}

export class ConnectionManager {
  // sessionId -> session state
  private sessions = new Map<string, ResumableSession>();
  private sessionTimeoutMs = 300000; // 5 minutes

  public connect(connectionId: string, metadata: ConnectionMetadata): void {
    connectionRepository.save(connectionId, metadata);
    metricsCollector.incrementConnections();
    metricsCollector.addUser(metadata.userId);
  }

  public disconnect(connectionId: string): void {
    const conn = connectionRepository.get(connectionId);
    if (conn) {
      // Save session for resumption
      this.sessions.set(conn.sessionId, {
        userId: conn.userId,
        organizationId: conn.organizationId,
        role: conn.role,
        permissions: conn.permissions,
        subscriptions: new Set(conn.subscriptions),
        disconnectedAt: Date.now(),
      });

      connectionRepository.delete(connectionId);
      metricsCollector.decrementConnections();

      // Clean up active rooms metrics count
      metricsCollector.setActiveRooms(connectionRepository.getActiveRooms().length);
    }
  }

  public async resumeSession(
    connectionId: string,
    sessionId: string,
    lastSequenceNumber: number,
    sendMissedCallback: (envelope: MessageEnvelope) => Promise<boolean>
  ): Promise<ConnectionMetadata | null> {
    const saved = this.sessions.get(sessionId);
    if (!saved) return null;

    // Check if session has expired
    if (Date.now() - saved.disconnectedAt > this.sessionTimeoutMs) {
      this.sessions.delete(sessionId);
      return null;
    }

    // Clean up from sessions map (it is now active again)
    this.sessions.delete(sessionId);
    metricsCollector.incrementReconnects();

    // Create restored metadata
    const metadata: ConnectionMetadata = {
      connectionId,
      sessionId,
      userId: saved.userId,
      organizationId: saved.organizationId,
      role: saved.role,
      permissions: saved.permissions,
      subscriptions: new Set(), // Will re-add below
      connectedAt: new Date(),
      lastSeen: new Date(),
      heartbeatStatus: 'alive',
      lastActivity: new Date(),
    };

    connectionRepository.save(connectionId, metadata);
    metricsCollector.incrementConnections();
    metricsCollector.addUser(metadata.userId);

    // Re-join all rooms
    for (const room of saved.subscriptions) {
      connectionRepository.addToRoom(connectionId, room);
    }
    metricsCollector.setActiveRooms(connectionRepository.getActiveRooms().length);

    // Retrieve and replay missed events
    const missed = replayBuffer.getEventsSince(lastSequenceNumber, metadata.organizationId, saved.subscriptions);
    for (const envelope of missed) {
      await sendMissedCallback(envelope);
    }

    return metadata;
  }

  public async subscribeToRoom(connectionId: string, room: string): Promise<boolean> {
    const conn = connectionRepository.get(connectionId);
    if (!conn) return false;

    // Scope room if necessary
    let actualRoom = room;
    if (room === 'dashboard') {
      actualRoom = `org:${conn.organizationId}:dashboard`;
    }

    // Run authorization checks
    const allowed = await this.authorizeRoomAccess(conn, actualRoom);
    if (!allowed) return false;

    connectionRepository.addToRoom(connectionId, actualRoom);
    metricsCollector.setActiveRooms(connectionRepository.getActiveRooms().length);
    return true;
  }

  public unsubscribeFromRoom(connectionId: string, room: string): void {
    const conn = connectionRepository.get(connectionId);
    if (!conn) return;

    let actualRoom = room;
    if (room === 'dashboard') {
      actualRoom = `org:${conn.organizationId}:dashboard`;
    }

    connectionRepository.removeFromRoom(connectionId, actualRoom);
    metricsCollector.setActiveRooms(connectionRepository.getActiveRooms().length);
  }

  public async authorizeRoomAccess(metadata: ConnectionMetadata, room: string): Promise<boolean> {
    if (room === 'dashboard') {
      return metadata.permissions.includes(PermissionScope.INCIDENT_READ);
    }

    if (room.startsWith('org:')) {
      if (room.endsWith(':dashboard')) {
        const orgId = room.split(':')[1];
        return metadata.organizationId === orgId && metadata.permissions.includes(PermissionScope.INCIDENT_READ);
      }
    }

    if (room.startsWith('incident:')) {
      const incidentId = room.split(':')[1];
      if (!incidentId) return false;

      // Must have INCIDENT_READ scope
      if (!metadata.permissions.includes(PermissionScope.INCIDENT_READ)) {
        return false;
      }

      // Enforce organization / tenant isolation and incident visibility
      try {
        const incident = await incidentRepository.getIncidentById(incidentId);
        if (!incident) return false;
        return (
          incident.metadata?.organizationId === metadata.organizationId ||
          (incident as any).organizationId === metadata.organizationId
        );
      } catch {
        return false;
      }
    }

    if (room.startsWith('organization:')) {
      const orgId = room.split(':')[1];
      return metadata.organizationId === orgId;
    }

    if (room.startsWith('user:')) {
      const userId = room.split(':')[1];
      return metadata.userId === userId;
    }

    if (room.startsWith('audit:')) {
      const incidentId = room.split(':')[1];
      if (!incidentId) return false;

      // Must have AUDIT_READ scope
      if (!metadata.permissions.includes(PermissionScope.AUDIT_READ)) {
        return false;
      }

      // Enforce organization / tenant isolation
      try {
        const incident = await incidentRepository.getIncidentById(incidentId);
        if (!incident) return false;
        return (
          incident.metadata?.organizationId === metadata.organizationId ||
          (incident as any).organizationId === metadata.organizationId
        );
      } catch {
        return false;
      }
    }

    return false;
  }
}

export const connectionManager = new ConnectionManager();
export default connectionManager;
