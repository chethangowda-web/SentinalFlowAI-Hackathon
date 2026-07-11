import { createServer, Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'crypto';
import { URL } from 'url';
import { config } from '../../config/config';
import { TokenService } from '../../auth/authentication/TokenService';
import { sessionRepository } from '../../database/repositories/AuthRepository';
import { PermissionService, PermissionScope } from '../../auth/authorization/PermissionService';
import { UserRole } from '../../auth/types/types';
import { connectionRepository } from '../services/ConnectionRepository';
import { connectionManager } from '../services/ConnectionManager';
import { presenceService } from '../services/PresenceService';
import { broadcastService } from '../services/BroadcastService';
import { metricsCollector } from '../services/MetricsCollector';
import { ConnectionMetadata, ClientMessage, IWebSocketTransport, MessageEnvelope } from '../types';
import { LoggerService } from '../../mastra/services/loggerService';

export class WebSocketGateway implements IWebSocketTransport {
  private server: HttpServer;
  private wss: WebSocketServer;
  private log = new LoggerService('WebSocketGateway');
  private heartbeatTimer!: NodeJS.Timeout;

  // Connection mapping for transport delivery
  private activeSockets = new Map<string, WebSocket>();

  // Rate limiting & Replay tracking maps per connection
  private connectionRateLimits = new Map<string, { count: number; resetAt: number }>();
  private processedMessageIds = new Map<string, Set<string>>(); // connId -> set of messageIds

  constructor() {
    this.server = createServer((req, res) => {
      res.writeHead(404);
      res.end();
    });

    this.wss = new WebSocketServer({
      noServer: true,
      maxPayload: config.websocket.maxPayload,
      perMessageDeflate: {
        zlibDeflateOptions: {
          chunkSize: 1024,
          memLevel: 7,
          level: 3,
        },
        zlibInflateOptions: {
          chunkSize: 10 * 1024,
        },
        clientNoContextTakeover: true,
        serverNoContextTakeover: true,
        serverMaxWindowBits: 10,
        concurrencyLimit: 10,
        threshold: 1024, // compress payloads > 1KB
      },
    });

    this.setupServerListeners();

    // Register gateway as the transport on BroadcastService
    broadcastService.registerTransport(this);
  }

  private started = false;

  public attachToExistingServer(externalServer: HttpServer): void {
    if (this.started) return;
    this.server = externalServer;
    this.setupUpgradeHandler();
    this.started = true;
    this.log.info('WebSocket Gateway attached to existing HTTP server');
    this.startHeartbeatMonitor();
  }

  public async start(externalServer?: HttpServer): Promise<void> {
    if (this.started) {
      this.log.warn('WebSocket Gateway already started — skipping duplicate listen');
      return;
    }
    if (externalServer) {
      this.attachToExistingServer(externalServer);
      return;
    }
    if (this.server.listening) {
      this.log.warn('WebSocket HTTP server already listening — skipping duplicate listen');
      this.started = true;
      return;
    }
    const port = config.websocket.port;
    this.setupUpgradeHandler();
    return new Promise<void>((resolve, reject) => {
      this.server.once('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          this.log.error(
            `Port ${port} is already in use. Is another instance running? Close the other process or kill it with:  npx kill-port ${port}`
          );
        }
        reject(err);
      });
      this.server.listen(port, () => {
        this.started = true;
        this.log.info(`WebSocket Server running on port ${port}`);
        this.startHeartbeatMonitor();
        resolve();
      });
    });
  }

  // --- IWebSocketTransport Implementation ---
  public async send(connectionId: string, payload: string): Promise<boolean> {
    const ws = this.activeSockets.get(connectionId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      return new Promise<boolean>((resolve) => {
        ws.send(payload, (err) => {
          if (err) {
            this.log.error(`Failed to send payload to connection ${connectionId}: ${err.message}`);
            resolve(false);
          } else {
            resolve(true);
          }
        });
      });
    }
    return false;
  }

  public close(connectionId: string, code: number, reason: string): void {
    const ws = this.activeSockets.get(connectionId);
    if (ws) {
      ws.close(code, reason);
    }
  }

  public terminate(connectionId: string): void {
    const ws = this.activeSockets.get(connectionId);
    if (ws) {
      ws.terminate();
    }
  }
  // ------------------------------------------

  private setupUpgradeHandler() {
    this.server.on('upgrade', async (request, socket, head) => {
      try {
        const activeConnections = connectionRepository.getAll().length;
        if (activeConnections >= config.websocket.maxConnections) {
          socket.write('HTTP/1.1 429 Too Many Connections\r\n\r\n');
          socket.destroy();
          return;
        }

        const requestUrl = new URL(request.url || '', `http://${request.headers.host}`);
        let token = requestUrl.searchParams.get('token');
        console.log("========== WS UPGRADE ==========");
        console.log("URL:", request.url);
        console.log("TOKEN:", token);
        console.log("HEADERS:", request.headers);

        if (!token && request.headers.authorization) {
          const auth = request.headers.authorization;
          if (auth.startsWith('Bearer ')) {
            token = auth.substring(7);
          }
        }

        if (!token && request.headers.cookie) {
          const match = request.headers.cookie.match(/access_token=([^;]+)/);
          if (match) token = match[1];
        }

        if (!token) {
          socket.write('HTTP/1.1 401 Unauthorized: No Token\r\n\r\n');
          socket.destroy();
          return;
        }

        console.log("Verifying token...");

        const result = await TokenService.verifyToken(token);

        console.log("Verify Result:", result);

        const payload = result.payload;
        if (!payload || !payload.sessionId) {
          socket.write('HTTP/1.1 401 Unauthorized: Invalid Token\r\n\r\n');
          socket.destroy();
          return;
        }
        console.log("Payload:", payload);
        console.log("Session ID:", payload.sessionId);

        const session = await sessionRepository.getSessionById(payload.sessionId);
        console.log("Session:", session);
        if (!session) {
          socket.write('HTTP/1.1 401 Unauthorized: Session Revoked\r\n\r\n');
          socket.destroy();
          return;
        }
        console.log("Upgrade successful");

        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss.emit('connection', ws, payload);
        });
      } catch (err) {
        this.log.error(`Upgrade failed: ${err}`);
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
      }
    });
  }

  private setupServerListeners() {
    this.wss.on('connection', async (ws: WebSocket, payload: any) => {
      const connectionId = randomUUID();
      this.activeSockets.set(connectionId, ws);

      const userRole = payload.role as UserRole;
      const permissionsList = Object.values(PermissionScope).filter((scope) =>
        PermissionService.hasPermission(userRole, scope)
      );

      const metadata: ConnectionMetadata = {
        connectionId,
        sessionId: payload.sessionId,
        userId: payload.userId,
        organizationId: payload.organizationId,
        role: userRole,
        permissions: permissionsList,
        subscriptions: new Set<string>(),
        connectedAt: new Date(),
        lastSeen: new Date(),
        heartbeatStatus: 'alive',
        lastActivity: new Date(),
      };

      // Set up rate limiting & replay checks
      this.connectionRateLimits.set(connectionId, { count: 0, resetAt: Date.now() + 60000 });
      this.processedMessageIds.set(connectionId, new Set());

      // Send initial welcome/envelope
      const welcomeEnvelope = {
        type: 'welcome',
        version: '1.0',
        timestamp: new Date().toISOString(),
        sequenceNumber: 0,
        payload: {
          connectionId,
          userId: metadata.userId,
          organizationId: metadata.organizationId,
          sessionId: metadata.sessionId,
        },
      };

      ws.send(JSON.stringify(welcomeEnvelope));
      metricsCollector.incrementSent();

      // Listen for messages
      ws.on('message', async (data: Buffer) => {
        try {
          metricsCollector.incrementReceived();

          if (data.length > config.websocket.maxPayload) {
            this.sendError(ws, 'Payload too large');
            return;
          }

          if (!this.checkRateLimit(connectionId)) {
            metricsCollector.incrementRateLimited();
            this.sendError(ws, 'Rate limit exceeded');
            return;
          }

          const parsed = JSON.parse(data.toString());
          if (!parsed.type) {
            this.sendError(ws, 'Missing message type');
            return;
          }

          const msg = parsed as ClientMessage;

          // Replay protection
          if (msg.timestamp || msg.msgId) {
            if (msg.timestamp && Math.abs(Date.now() - msg.timestamp) > 300000) {
              this.sendError(ws, 'Message expired');
              return;
            }
            if (msg.msgId) {
              const seenIds = this.processedMessageIds.get(connectionId);
              if (seenIds?.has(msg.msgId)) {
                this.sendError(ws, 'Duplicate message');
                return;
              }
              seenIds?.add(msg.msgId);
              if (seenIds && seenIds.size > 1000) {
                const first = seenIds.values().next().value;
                if (first !== undefined) seenIds.delete(first);
              }
            }
          }

          metadata.lastSeen = new Date();
          metadata.lastActivity = new Date();

          await this.handleClientMessage(connectionId, ws, metadata, msg);
        } catch (err) {
          this.sendError(ws, 'Invalid payload');
        }
      });

      ws.on('close', () => {
        this.log.info(`WebSocket closed: ${connectionId}`);
        presenceService.handleCleanup(connectionId);
        connectionManager.disconnect(connectionId);
        this.activeSockets.delete(connectionId);
        this.connectionRateLimits.delete(connectionId);
        this.processedMessageIds.delete(connectionId);
      });

      ws.on('error', (err) => {
        this.log.error(`Socket error: ${err.message}`);
        ws.close();
      });
    });
  }

  private checkRateLimit(connectionId: string): boolean {
    const lim = this.connectionRateLimits.get(connectionId);
    if (!lim) return true;

    const now = Date.now();
    if (now > lim.resetAt) {
      lim.count = 1;
      lim.resetAt = now + 60000;
      return true;
    }

    lim.count++;
    return lim.count <= config.websocket.rateLimit;
  }

  private async handleClientMessage(
    connectionId: string,
    ws: WebSocket,
    metadata: ConnectionMetadata,
    msg: ClientMessage
  ): Promise<void> {
    // Resolve room mappings consistently at the entry point of the gateway
    let resolvedRoom: string | undefined = (msg as any).room;
    if (resolvedRoom === 'dashboard') {
      resolvedRoom = `org:${metadata.organizationId}:dashboard`;
    }

    switch (msg.type) {
      case 'ping': {
        const startTime = msg.timestamp || Date.now();
        metricsCollector.recordHeartbeat(Date.now() - startTime);

        const pongEnvelope = {
          type: 'pong',
          version: '1.0',
          timestamp: new Date().toISOString(),
          sequenceNumber: 0,
          payload: {},
        };
        ws.send(JSON.stringify(pongEnvelope));
        metricsCollector.incrementSent();
        break;
      }

      case 'subscribe': {
        const { sessionId, lastSequenceNumber } = msg;
        if (!resolvedRoom) {
          this.sendError(ws, 'Room not specified');
          return;
        }

        // If client requested session resumption
        if (sessionId && lastSequenceNumber !== undefined) {
          this.log.info(`Attempting session resumption for connection ${connectionId}, session ${sessionId}`);

          // Remove initial temp connection first
          connectionManager.disconnect(connectionId);
          this.activeSockets.delete(connectionId);
          this.connectionRateLimits.delete(connectionId);
          this.processedMessageIds.delete(connectionId);

          // Map socket registry before resuming so replayed events can be sent
          this.activeSockets.set(connectionId, ws);

          const resumedMetadata = await connectionManager.resumeSession(
            connectionId,
            sessionId,
            lastSequenceNumber,
            async (envelope: MessageEnvelope) => {
              return this.send(connectionId, JSON.stringify(envelope));
            }
          );

          if (resumedMetadata) {
            this.log.info(`Session resumed successfully for connection ${connectionId}`);
            this.connectionRateLimits.set(connectionId, { count: 0, resetAt: Date.now() + 60000 });
            this.processedMessageIds.set(connectionId, new Set());

            // Overwrite metadata references
            metadata = resumedMetadata;
            return;
          } else {
            this.activeSockets.delete(connectionId);
            this.log.warn(`Session resumption failed for sessionId ${sessionId}. Proceeding with clean connection.`);
            this.sendError(ws, 'Session resumption failed or expired');
          }
        }

        // Standard connect and subscribe logic
        connectionManager.connect(connectionId, metadata);
        const success = await connectionManager.subscribeToRoom(connectionId, resolvedRoom);
        if (!success) {
          this.sendError(ws, `Access denied to room: ${resolvedRoom}`);
          return;
        }

        this.log.info(`Subscribed connection ${connectionId} to ${resolvedRoom}`);
        await presenceService.handleUserJoin(connectionId, resolvedRoom);
        break;
      }

      case 'unsubscribe': {
        if (!resolvedRoom) return;

        presenceService.handleUserLeave(connectionId, resolvedRoom);
        connectionManager.unsubscribeFromRoom(connectionId, resolvedRoom);
        break;
      }

      case 'presence:typing': {
        const { isTyping } = msg;
        if (!resolvedRoom) return;
        await presenceService.handleTypingState(connectionId, resolvedRoom, isTyping ?? false);
        break;
      }

      case 'presence:viewing': {
        if (!resolvedRoom) return;
        await presenceService.handleViewingState(connectionId, resolvedRoom);
        break;
      }

      default:
        this.sendError(ws, 'Unsupported message type');
    }
  }

  private sendError(ws: WebSocket, reason: string): void {
    if (ws.readyState === WebSocket.OPEN) {
      const envelope = {
        type: 'error',
        version: '1.0',
        timestamp: new Date().toISOString(),
        sequenceNumber: 0,
        payload: { message: reason },
      };
      ws.send(JSON.stringify(envelope));
      metricsCollector.incrementSent();
    }
  }

  private startHeartbeatMonitor() {
    this.heartbeatTimer = setInterval(() => {
      const connections = connectionRepository.getAll();
      for (const conn of connections) {
        if (conn.heartbeatStatus === 'dead') {
          this.log.info(`Heartbeat timeout: Terminating connection ${conn.connectionId}`);
          metricsCollector.incrementDropped();
          this.terminate(conn.connectionId);
          continue;
        }

        conn.heartbeatStatus = 'dead';
        const ws = this.activeSockets.get(conn.connectionId);
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.ping();

          const heartbeatEnvelope = {
            type: 'ping',
            version: '1.0',
            timestamp: new Date().toISOString(),
            sequenceNumber: 0,
            payload: {},
          };
          ws.send(JSON.stringify(heartbeatEnvelope));
          metricsCollector.incrementSent();
        }
      }
    }, config.websocket.heartbeatInterval);

    this.wss.on('connection', (ws: WebSocket) => {
      ws.on('pong', () => {
        const conn = connectionRepository.getAll().find((c) => this.activeSockets.get(c.connectionId) === ws);
        if (conn) {
          conn.heartbeatStatus = 'alive';
          conn.lastSeen = new Date();
        }
      });
    });
  }

  public isHealthy(): boolean {
    return this.started;
  }

  public async shutdown(): Promise<void> {
    this.log.info('Shutting down WebSocket Gateway...');
    clearInterval(this.heartbeatTimer);

    const activeConns = connectionRepository.getAll();
    for (const conn of activeConns) {
      try {
        this.close(conn.connectionId, 1001, 'Server shutting down');
      } catch (err) {
        this.terminate(conn.connectionId);
      }
    }

    return new Promise<void>((resolve) => {
      this.wss.close(() => {
        this.server.close(() => {
          this.log.info('WebSocket Gateway completely shut down');
          resolve();
        });
      });
    });
  }
}

export const webSocketGateway = new WebSocketGateway();
export default webSocketGateway;
