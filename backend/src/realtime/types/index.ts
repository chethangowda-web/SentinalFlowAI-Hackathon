import { UserRole } from '../../auth/types/types';
import { PermissionScope } from '../../auth/authorization/PermissionService';

export type HeartbeatStatus = 'alive' | 'pinged' | 'dead';

export interface ConnectionMetadata {
  connectionId: string;
  sessionId: string;
  userId: string;
  organizationId: string;
  role: UserRole;
  permissions: PermissionScope[];
  subscriptions: Set<string>;
  connectedAt: Date;
  lastSeen: Date;
  heartbeatStatus: HeartbeatStatus;
  lastActivity: Date;
}

// Outgoing Message Envelope
export interface MessageEnvelope<T = any> {
  type: string;
  version: string; // e.g. "1.0"
  timestamp: string; // ISO String
  traceId?: string;
  correlationId?: string;
  sequenceNumber: number;
  payload: T;
}

// Missed Event representation in Replay Buffer
export interface ReplayEvent {
  sequenceNumber: number;
  orgId: string;
  room?: string; // Optional room scope
  envelope: MessageEnvelope;
}

// Transport Interface for WebSocket and other transports
export interface IWebSocketTransport {
  send(connectionId: string, payload: string): Promise<boolean>;
  close(connectionId: string, code: number, reason: string): void;
  terminate(connectionId: string): void;
}

// Client to Server Messages
export type ClientMessageType =
  | 'subscribe'
  | 'unsubscribe'
  | 'presence:typing'
  | 'presence:viewing'
  | 'ping';

export interface BaseClientMessage {
  type: ClientMessageType;
  timestamp?: number;
  msgId?: string; // replay protection
  sessionId?: string; // resume session
  lastSequenceNumber?: number; // resume session missed events query
}

export interface SubscribeMessage extends BaseClientMessage {
  type: 'subscribe';
  room: string;
}

export interface UnsubscribeMessage extends BaseClientMessage {
  type: 'unsubscribe';
  room: string;
}

export interface TypingMessage extends BaseClientMessage {
  type: 'presence:typing';
  room: string;
  isTyping: boolean;
}

export interface ViewingMessage extends BaseClientMessage {
  type: 'presence:viewing';
  room: string;
}

export interface PingMessage extends BaseClientMessage {
  type: 'ping';
}

export type ClientMessage =
  | SubscribeMessage
  | UnsubscribeMessage
  | TypingMessage
  | ViewingMessage
  | PingMessage;

// Client Presence representation
export interface UserPresence {
  userId: string;
  fullName: string;
  role: UserRole;
  typing: boolean;
  viewing: boolean;
  lastSeen: string;
}
