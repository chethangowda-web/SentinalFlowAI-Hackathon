// 1. Set required environment variables BEFORE importing config or other modules
process.env.GROQ_API_KEY = 'mock-key';
process.env.HUGGINGFACE_API_KEY = 'mock-key';
process.env.QDRANT_URL = 'http://localhost:6333';
process.env.QDRANT_COLLECTION = 'sentinelflow-incidents';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/postgres';
process.env.JWT_SECRET = 'supersecret-change-me-in-production-1234567890';
process.env.WS_PORT = '3005';
process.env.WS_HEARTBEAT_INTERVAL = '5000'; // Increase heartbeat to avoid noise in test logs
process.env.WS_RATE_LIMIT = '5'; // Low rate limit to trigger it easily in test

import { WebSocket } from 'ws';
import assert from 'assert';
import { randomUUID } from 'crypto';

async function runTest() {
  console.log('--- Starting Production-Grade Real-Time Collaboration Layer Verification ---');

  // 2. Dynamically import modules to allow environment variables to load first
  const { dbClient } = await import('../src/database/client/DatabaseClient');
  const { TokenService } = await import('../src/auth/authentication/TokenService');
  const { sessionRepository, authRepository } = await import('../src/database/repositories/AuthRepository');
  const { incidentRepository } = await import('../src/database/repositories/IncidentRepository');
  const { webSocketGateway } = await import('../src/realtime/gateway/WebSocketGateway');
  const { broadcastService } = await import('../src/realtime/services/BroadcastService');
  const { metricsCollector } = await import('../src/realtime/services/MetricsCollector');
  const { connectionRepository } = await import('../src/realtime/services/ConnectionRepository');
  const { replayBuffer } = await import('../src/realtime/services/ReplayBuffer');
  const { UserRole } = await import('../src/auth/types/types');

  // Add debug logging hook
  const originalGetEventsSince = replayBuffer.getEventsSince.bind(replayBuffer);
  replayBuffer.getEventsSince = (seq, org, rooms) => {
    console.log('[Debug getEventsSince] seq:', seq, 'org:', org, 'rooms:', Array.from(rooms));
    console.log('[Debug getEventsSince] Buffer contains:', (replayBuffer as any).buffer.map((e: any) => ({
      seq: e.sequenceNumber,
      org: e.orgId,
      room: e.room,
      type: e.envelope.type
    })));
    const res = originalGetEventsSince(seq, org, rooms);
    console.log('[Debug getEventsSince] Returned:', res);
    return res;
  };

  // 3. Mock DB queries
  dbClient.query = async (text: string, params?: any[]) => {
    if (text.includes('COUNT(*) as total_incidents')) {
      return [{
        total_incidents: '10',
        open_incidents: '4',
        resolved_incidents: '6',
        critical_incidents: '2',
        avg_confidence: '0.85',
        incidents_today: '2',
        incidents_this_week: '5',
        incidents_this_month: '10'
      }];
    }
    if (text.includes('avg_resolution_time')) {
      return [{ avg_resolution_time: '1800000' }]; // 30 mins
    }
    return [];
  };

  // Mock Session lookups
  sessionRepository.getSessionById = async (id: string) => {
    return {
      id,
      userId: 'test-user-123',
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
  };

  // Mock User lookups
  authRepository.getUserById = async (id: string) => {
    return {
      userId: id,
      organizationId: 'test-org-456',
      email: 'test@sentinelflow.com',
      fullName: 'Test User',
      passwordHash: 'hash',
      role: UserRole.ADMIN,
      status: 'ACTIVE',
      mfaEnabled: false,
      backupCodes: [],
      loginAttempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  // Mock Incident lookups
  incidentRepository.getIncidentById = async (id: string) => {
    return {
      incidentId: id,
      service: 'payment-service',
      application: 'SentinelFlow',
      environment: 'production',
      severity: 'high',
      priority: 'P1',
      status: 'OPEN',
      title: 'Database connection failure',
      summary: 'Connection lost to the database pool',
      description: 'Detailed description',
      rawLogs: '',
      confidenceScore: 0.95,
      rootCause: '',
      aiReport: null,
      recommendations: null,
      similarIncidents: null,
      metadata: { organizationId: 'test-org-456' },
      assignedEngineer: null,
      resolution: null,
      timeline: null,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      deletedBy: null,
    };
  };

  const orgId = 'test-org-456';
  const userId = 'test-user-123';
  const sessionId = 'test-session-789';
  let token: string;

  try {
    // 4. Generate auth token
    token = await TokenService.generateAccessToken({
      userId,
      organizationId: orgId,
      role: 'ADMIN',
      sessionId
    });
    console.log('[Setup] Generated JWT Token successfully');

    // 5. Start WebSocket gateway
    console.log('[Setup] Starting WebSocket server on port 3005...');
    await webSocketGateway.start();

    // 6. Test sequence tracking
    console.log('[Test A] Connecting first client...');
    const ws1 = new WebSocket(`ws://localhost:3005?token=${token}`);
    let receivedSeq = 0;

    await new Promise<void>((resolve, reject) => {
      ws1.on('open', () => {
        console.log('[Client 1] Connection opened');
      });

      ws1.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        console.log('[Client 1] Received:', msg);
        if (msg.type === 'welcome') {
          // Subscribe to valid organization dashboard
          ws1.send(JSON.stringify({
            type: 'subscribe',
            room: 'dashboard'
          }));
        }

        if (msg.type === 'presence:update' && msg.payload && msg.payload.room === 'org:test-org-456:dashboard') {
          // Client is subscribed. Let's trigger a broadcast and check the formatted envelope!
          console.log('[Broadcast] Publishing test broadcast event to dashboard...');
          broadcastService.broadcastToRoom('org:test-org-456:dashboard', orgId, 'TestEvent', { data: 'hello' });
        }

        if (msg.type === 'TestEvent') {
          console.log('[Assert] Validating received event envelope details...');
          assert.strictEqual(msg.version, '1.0', 'Envelope version should be 1.0');
          assert.ok(msg.timestamp, 'Envelope should contain ISO timestamp');
          assert.ok(msg.sequenceNumber > 0, 'Envelope should contain positive sequenceNumber');
          receivedSeq = msg.sequenceNumber;
          console.log(`[Client 1] Received sequenceNumber: ${receivedSeq}`);

          // Next step: test subscription authorization denial
          console.log('[Test B] Attempting to subscribe to unauthorized room...');
          ws1.send(JSON.stringify({
            type: 'subscribe',
            room: 'org:unauthorized-org-777:dashboard'
          }));
        }

        if (msg.type === 'error') {
          assert.strictEqual(msg.payload.message, 'Access denied to room: org:unauthorized-org-777:dashboard');
          console.log('[Assert] Successfully blocked access to unauthorized room!');
          ws1.close();
        }
      });

      ws1.on('close', () => {
        console.log('[Client 1] Closed');
        resolve();
      });

      ws1.on('error', reject);
      setTimeout(() => reject(new Error('ws1 timed out')), 6000);
    });

    // 7. Verify session resumption & Replay Buffer
    console.log('[Test C] Broadcasting new event while Client 1 is offline...');
    await broadcastService.broadcastToRoom('org:test-org-456:dashboard', orgId, 'OfflineEvent', { secret: 'unread' });

    console.log('[Test D] Reconnecting with sessionId and lastSequenceNumber...');
    const ws2 = new WebSocket(`ws://localhost:3005?token=${token}`);
    let offlineEventReplayed = false;

    await new Promise<void>((resolve, reject) => {
      ws2.on('open', () => {
        console.log('[Client 2] Reconnect opened');
      });

      ws2.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        console.log('[Client 2] Received:', msg);
        if (msg.type === 'welcome') {
          // Attempt session resumption using client message fields
          ws2.send(JSON.stringify({
            type: 'subscribe',
            room: 'dashboard',
            sessionId: sessionId,
            lastSequenceNumber: receivedSeq
          }));
        }

        if (msg.type === 'OfflineEvent') {
          console.log('[Assert] Replayed event received! Payload:', msg.payload);
          assert.strictEqual(msg.payload.secret, 'unread');
          offlineEventReplayed = true;

          // Next: trigger rate limit test
          console.log('[Test E] Flooding messages for rate-limiting...');
          for (let i = 0; i < 10; i++) {
            ws2.send(JSON.stringify({
              type: 'ping',
              msgId: `msg-${i}-${randomUUID()}`,
              timestamp: Date.now()
            }));
          }
        }

        if (msg.type === 'error' && msg.payload.message === 'Rate limit exceeded') {
          console.log('[Assert] Rate limiter kicked in successfully!');
          ws2.close();
        }
      });

      ws2.on('close', () => {
        console.log('[Client 2] Closed');
        resolve();
      });

      ws2.on('error', reject);
      setTimeout(() => reject(new Error('ws2 timed out')), 6000);
    });

    assert.ok(offlineEventReplayed, 'Should have received OfflineEvent replayed');

    // 8. Verify metrics and health stats
    console.log('[Test F] Inspecting metrics and health payload formats...');
    const stats = metricsCollector.getStats();
    console.log('Metrics stats:', stats);
    assert.ok(stats.reconnectCount >= 1, 'Reconnect count should be tracked');
    assert.ok(stats.rateLimitedClientsCount >= 1, 'Rate limits should be tracked');

    const prom = metricsCollector.getPrometheusMetrics();
    console.log('Prometheus output sample:\n', prom.substring(0, 300));
    assert.ok(prom.includes('realtime_active_connections'), 'Metrics should include active connections gauge');
    assert.ok(prom.includes('realtime_reconnect_count_total'), 'Metrics should include reconnect count total');

    console.log('--- Verification Succeeded! Real-time layer works correctly ---');
  } catch (error) {
    console.error('--- Verification Failed! ---', error);
    process.exitCode = 1;
  } finally {
    console.log('[Teardown] Shutting down WebSocket gateway...');
    await webSocketGateway.shutdown();
  }
}

runTest();
