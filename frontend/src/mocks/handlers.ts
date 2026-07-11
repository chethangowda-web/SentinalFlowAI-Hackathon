import { http, HttpResponse } from 'msw';

const mockUser = {
  id: 'usr_1',
  email: 'operator@sentinelflow.io',
  name: 'Jane Operator',
  role: 'operator',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
  timezone: 'UTC',
  organizations: [
    { id: 'org_1', name: 'Acme Security Corp', slug: 'acme-sec', role: 'operator' },
    { id: 'org_2', name: 'Global Cyber Defence', slug: 'gcd', role: 'member' }
  ],
  activeOrgId: 'org_1',
};

let mockIncidents = [
  { id: 'INC-101', title: 'Pod connection timeout on cluster auth-db-primary', description: 'High memory usage causing cluster disconnection.', status: 'OPEN', severity: 'CRITICAL', createdAt: new Date(Date.now() - 600000).toISOString(), service: 'auth-db-primary', environment: 'production', assignedTeam: 'SRE-Team' },
  { id: 'INC-102', title: 'Webhook callback queue payload size limit warning', description: 'Queued payload size exceeded maximum threshold.', status: 'ACKNOWLEDGED', severity: 'HIGH', createdAt: new Date(Date.now() - 1500000).toISOString(), service: 'webhooks', environment: 'production', assignedTeam: 'SecOps' },
  { id: 'INC-103', title: 'Mastra task memory leak threshold reached', description: 'Memory pool leak observed on mastra runtime engine.', status: 'INVESTIGATING', severity: 'MEDIUM', createdAt: new Date(Date.now() - 3600000).toISOString(), service: 'mastra-engine', environment: 'staging', assignedTeam: 'AI-Team' },
];

let mockNotes: Record<string, any[]> = {
  'INC-101': [
    { id: 'n1', author: 'SYSTEM', content: 'Incident created via API telemetry parser.', createdAt: new Date(Date.now() - 600000).toISOString() },
  ]
};

let mockSessions = [
  { id: 'sess_1', device: 'Chrome / Windows', ipAddress: '127.0.0.1', lastActiveAt: 'Just now', isCurrent: true },
];

export const handlers = [
  http.post('*/custom/v1/auth/login', async ({ request }) => {
    const { email } = (await request.json()) as any;
    return HttpResponse.json({
      success: true,
      accessToken: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token',
      user: { ...mockUser, email: email || mockUser.email },
      session: mockSessions[0],
    });
  }),

  http.post('*/custom/v1/auth/register', async () => {
    return HttpResponse.json({ success: true, user: mockUser });
  }),

  http.post('*/custom/v1/auth/forgot-password', async () => {
    return HttpResponse.json({ success: true, message: 'Recovery email sent' });
  }),

  http.post('*/custom/v1/auth/reset-password', async () => {
    return HttpResponse.json({ success: true, message: 'Password reset successful' });
  }),

  http.post('*/custom/v1/auth/refresh', async () => {
    return HttpResponse.json({
      success: true,
      accessToken: 'mock-jwt-token-refreshed',
      refreshToken: 'mock-refresh-token-rotated',
      user: mockUser,
    });
  }),

  http.post('*/custom/v1/auth/logout', async () => {
    return HttpResponse.json({ success: true, message: 'Logged out successfully' });
  }),

  http.get('*/custom/v1/auth/me', () => {
    return HttpResponse.json(mockUser);
  }),

  http.get('*/custom/v1/auth/sessions', () => {
    return HttpResponse.json({ sessions: mockSessions });
  }),

  http.delete('*/custom/v1/auth/sessions/:id', ({ params }) => {
    mockSessions = mockSessions.filter(s => s.id !== params.id);
    return HttpResponse.json({ success: true });
  }),

  http.get('*/custom/v1/dashboard/overview', () => {
    return HttpResponse.json({
      success: true,
      data: {
        totalIncidents: mockIncidents.length,
        openIncidents: mockIncidents.filter(i => i.status === 'OPEN').length,
        resolvedIncidents: mockIncidents.filter(i => i.status === 'RESOLVED').length,
        criticalIncidents: mockIncidents.filter(i => i.severity === 'CRITICAL').length,
        averageResolutionTimeMs: 870000,
        averageAiConfidence: 94.2,
        incidentsToday: mockIncidents.length,
        incidentsThisWeek: mockIncidents.length,
        incidentsThisMonth: mockIncidents.length,
      }
    });
  }),

  http.get('*/custom/v1/dashboard/trends', () => {
    return HttpResponse.json({
      success: true,
      data: [
        { day: new Date(Date.now() - 86400000 * 2).toISOString(), count: 1 },
        { day: new Date(Date.now() - 86400000).toISOString(), count: 4 },
        { day: new Date().toISOString(), count: mockIncidents.length },
      ]
    });
  }),

  http.get('*/custom/v1/dashboard/severity', () => {
    return HttpResponse.json({
      success: true,
      data: [
        { severity: 'critical', priority: 'P1', count: mockIncidents.filter(i => i.severity === 'CRITICAL').length },
        { severity: 'high', priority: 'P2', count: mockIncidents.filter(i => i.severity === 'HIGH').length },
        { severity: 'medium', priority: 'P3', count: mockIncidents.filter(i => i.severity === 'MEDIUM').length },
      ]
    });
  }),

  http.get('*/custom/v1/dashboard/services', () => {
    return HttpResponse.json({
      success: true,
      data: [
        { service: 'auth-db-primary', count: 1 },
        { service: 'webhooks', count: 1 },
      ]
    });
  }),

  http.get('*/custom/v1/intelligence/dashboard', () => {
    return HttpResponse.json({
      success: true,
      data: {
        stats: {
          hallucinationScore: 0.02,
          learningAccuracy: 98.4,
          decisionConfidence: 94.2,
          recommendationSuccessPct: 96.5,
        },
        recentDecisions: []
      }
    });
  }),

  http.get('*/custom/v1/intelligence/decision/:id', ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        id: `dec_${params.id}`,
        incidentId: params.id,
        recommendedAction: "Database pool connections capped. Perform an immediate horizontal connection pool limit scale-out of the auth-db-primary cluster to prevent socket exhaustion.",
        recommendedRunbooks: ["rbk_scale_db", "rbk_flush_idle"],
        recommendedEngineer: "eng_1",
        confidence: 92.4,
        confidenceBreakdown: {
          "Incident Histology Correlation": 95,
          "Log Token Semantic Density": 88,
          "Telemetry Pattern Signature": 94
        },
        possibleRootCauses: [
          "Database connection pooling capacity limits reached under heavy load",
          "Stray connection leak inside backend worker processes",
          "Unoptimized sql query locking table index on active transactions"
        ],
        status: "PENDING",
        modelName: "SentinelFlow-Reasoner-v4 (GPT-4o fine-tuned)",
        latencyMs: 1420,
        tokensUsed: 1024,
        reasoningSteps: [
          { step: "1. Telemetry Ingestion", thought: "Read metric peaks for connection limits in Prometheus database metrics. Database capacity peaked at 98% utilization.", confidence: 99 },
          { step: "2. Log Parsing", "thought": "Extract logs matching 'auth-db-primary' from vector storage. Located 'ConnectionPoolTimeoutException' patterns.", confidence: 94 },
          { step: "3. Historical Search", "thought": "Search similar incidents history. Located similar outage INC-82 resolved by pool scaling on June 12.", confidence: 91 },
          { step: "4. Action Synthesis", "thought": "Formulate DB pool scaling recommendation and match optimal engineer with database skills (Jane Operator).", confidence: 92 }
        ]
      }
    });
  }),

  http.get('*/custom/v1/intelligence/history', () => {
    return HttpResponse.json({
      success: true,
      data: [
        { id: "dec_INC-101", incidentId: "INC-101", recommendedAction: "Database scaling", confidence: 92.4, status: "APPROVED" }
      ]
    });
  }),

  http.get('*/custom/v1/recommendations/runbooks', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          runbookId: "rbk_scale_db",
          name: "Horizontal DB connection pool scaling",
          description: "Increases database connection limit by 50% via configuration update and soft restart.",
          confidence: 95,
          previousSuccessRate: 98.4,
          averageExecutionTime: "45s",
          safetyLevel: "SAFE",
          rollbackAvailable: true
        },
        {
          runbookId: "rbk_flush_idle",
          name: "Flush idle database connections",
          description: "Forcibly terminates connections that have been idle for more than 15 minutes.",
          confidence: 82,
          previousSuccessRate: 91.2,
          averageExecutionTime: "12s",
          safetyLevel: "MODERATE",
          rollbackAvailable: false
        }
      ]
    });
  }),

  http.get('*/custom/v1/recommendations/engineers', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          engineerId: "eng_1",
          name: "Jane Operator",
          avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
          role: "Lead Database Reliability Engineer",
          currentWorkload: 1,
          expertise: ["Postgres", "Kubernetes", "High-Availability"],
          solvedIncidentsCount: 42,
          confidence: 96
        },
        {
          engineerId: "eng_2",
          name: "Bob Architect",
          avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
          role: "SRE Svc Infrastructure Architect",
          currentWorkload: 3,
          expertise: ["AWS", "Networking", "Terraform"],
          solvedIncidentsCount: 18,
          confidence: 78
        }
      ]
    });
  }),

  http.get('*/health/ready', () => {
    return HttpResponse.json({
      isReady: true,
      details: {
        postgres: 'ok',
        prometheus: 'ok',
        qdrant: 'ok',
        redis: 'ok',
      }
    });
  }),

  http.get('*/custom/v1/incidents', () => {
    return HttpResponse.json({
      success: true,
      data: mockIncidents
    });
  }),

  http.post('*/custom/v1/incidents', async ({ request }) => {
    const payload = (await request.json()) as any;
    const newInc = {
      id: `INC-${Math.floor(Math.random() * 900) + 200}`,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      ...payload,
    };
    mockIncidents = [newInc, ...mockIncidents];
    return HttpResponse.json({ success: true, incident: newInc });
  }),

  http.get('*/custom/v1/incidents/:id', ({ params }) => {
    const inc = mockIncidents.find(i => i.id === params.id);
    if (!inc) return HttpResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return HttpResponse.json({ success: true, data: inc });
  }),

  http.patch('*/custom/v1/incidents/:id/status', async ({ params, request }) => {
    const { status } = (await request.json()) as any;
    mockIncidents = mockIncidents.map(i => i.id === params.id ? { ...i, status } : i);
    const updated = mockIncidents.find(i => i.id === params.id);
    return HttpResponse.json({ success: true, data: updated });
  }),

  http.patch('*/custom/v1/incidents/:id/assign', async ({ params, request }) => {
    const { assigneeId } = (await request.json()) as any;
    mockIncidents = mockIncidents.map(i => i.id === params.id ? { ...i, assigneeId } : i);
    const updated = mockIncidents.find(i => i.id === params.id);
    return HttpResponse.json({ success: true, data: updated });
  }),

  http.patch('*/custom/v1/incidents/:id/resolve', async ({ params }) => {
    mockIncidents = mockIncidents.map(i => i.id === params.id ? { ...i, status: 'RESOLVED' } : i);
    const updated = mockIncidents.find(i => i.id === params.id);
    return HttpResponse.json({ success: true, data: updated });
  }),

  http.patch('*/custom/v1/incidents/:id/close', async ({ params }) => {
    mockIncidents = mockIncidents.map(i => i.id === params.id ? { ...i, status: 'CLOSED' } : i);
    const updated = mockIncidents.find(i => i.id === params.id);
    return HttpResponse.json({ success: true, data: updated });
  }),

  http.delete('*/custom/v1/incidents/:id', ({ params }) => {
    mockIncidents = mockIncidents.filter(i => i.id !== params.id);
    return HttpResponse.json({ success: true });
  }),

  http.get('*/custom/v1/incidents/:id/notes', ({ params }) => {
    const list = mockNotes[params.id as string] || [];
    return HttpResponse.json({ success: true, data: list });
  }),

  http.post('*/custom/v1/incidents/:id/notes', async ({ params, request }) => {
    const { content } = (await request.json()) as any;
    const newNote = {
      id: `note-${Math.random().toString(36).substr(2, 9)}`,
      author: 'Jane Operator',
      content,
      createdAt: new Date().toISOString(),
    };
    if (!mockNotes[params.id as string]) mockNotes[params.id as string] = [];
    mockNotes[params.id as string].push(newNote);
    return HttpResponse.json({ success: true, data: newNote });
  }),

  http.get('*/custom/v1/incidents/:id/timeline', () => {
    return HttpResponse.json({
      success: true,
      data: [
        { id: 't1', action: 'INCIDENT_CREATED', actor: 'SYSTEM', timestamp: new Date(Date.now() - 600000).toISOString() }
      ]
    });
  }),

  http.get('*/custom/v1/incidents/:id/audit', () => {
    return HttpResponse.json({
      success: true,
      data: [
        { id: 'a1', action: 'LOG_INSPECTED', actor: 'operator', timestamp: new Date().toISOString() }
      ]
    });
  }),

  http.get('*/runbooks/executions', () => {
    return HttpResponse.json({
      executions: [
        { id: '1', runbookId: 'Database Scaling', status: 'RUNNING', startTime: '1 min ago', triggeredBy: 'AI Agent' }
      ]
    });
  }),

  http.get('*/custom/v1/notifications', () => {
    return HttpResponse.json({
      queueDepth: 0,
      metrics: {
        totalQueued: 1,
        totalSent: 1,
        totalFailed: 0,
        totalRetried: 0,
        totalDelivered: 1,
        averageLatencyMs: 82,
      }
    });
  }),

  http.get('*/custom/v1/notifications/history', () => {
    return HttpResponse.json({
      history: [
        { id: '1', message: 'CPU spike on auth-db-primary', urgency: 'CRITICAL', createdAt: '2 mins ago' }
      ]
    });
  }),
];
