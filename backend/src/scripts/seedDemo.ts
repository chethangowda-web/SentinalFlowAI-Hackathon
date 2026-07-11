import { randomUUID } from 'crypto';
import { dbClient } from '../database/client/DatabaseClient';
import { PasswordService } from '../auth/authentication/PasswordService';

export async function seedDemoData(): Promise<void> {
  console.log('[SeedDemo] Seeding demo data...');

  try {
    // 1. Create demo organization
    let orgId = randomUUID();
    const orgInsertResult = await dbClient.query(`
      INSERT INTO organizations (organization_id, name, slug, plan, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING organization_id
    `, [orgId, 'SentinelFlow Demo', 'sentinelflow-demo', 'ENTERPRISE']);
    if (orgInsertResult.rowCount === 0) {
      const existing = await dbClient.query(`SELECT organization_id FROM organizations WHERE slug = $1`, ['sentinelflow-demo']);
      orgId = existing.rows[0].organization_id;
    } else {
      orgId = orgInsertResult.rows[0].organization_id;
    }

    const orgSettings = await dbClient.query(`
      INSERT INTO organization_settings (organization_id, timezone, business_hours, notification_defaults, retention_policy_days, default_severity, branding)
      VALUES ($1, 'UTC', '{"start": "09:00", "end": "17:00"}', '{}', 30, 'MEDIUM', '{}')
      ON CONFLICT (organization_id) DO NOTHING
    `, [orgId]);

    // 2. Create demo user
    const userId = randomUUID();
    const passwordHash = await PasswordService.hash('Demo@12345');
    await dbClient.query(`
      INSERT INTO users (user_id, organization_id, email, full_name, password_hash, role, status, mfa_enabled, backup_codes, login_attempts, password_history, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
    `, [userId, orgId, 'demo@sentinelflow.io', 'Demo User', passwordHash, 'OWNER', 'ACTIVE', false, '[]', 0, '[]']);

    // 3. Create demo incidents
    const incidents = [
      {
        incidentId: randomUUID(),
        title: 'High latency on payment API',
        description: 'Payment service experiencing 500ms+ p99 latency affecting checkout flow',
        service: 'payment-api',
        severity: 'HIGH',
        status: 'INVESTIGATING',
        environment: 'production',
        rawLogs: 'ERROR: Payment timeout after 5000ms\nWARN: Circuit breaker opened for payment-gateway\nINFO: Retrying with fallback provider',
        aiReport: JSON.stringify({ rootCause: 'Downstream gateway latency spike', confidence: 0.92 }),
        recommendations: JSON.stringify([{ action: 'Scale payment workers', priority: 'HIGH' }]),
        confidenceScore: 0.92,
        rootCause: 'Payment gateway latency spike',
        assignedEngineer: 'sre-team-lead',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
      {
        incidentId: randomUUID(),
        title: 'Database connection pool exhausted',
        description: 'PostgreSQL connection pool at 100% utilization causing query timeouts',
        service: 'user-service',
        severity: 'CRITICAL',
        status: 'OPEN',
        environment: 'production',
        rawLogs: 'FATAL: remaining connection slots reserved\nERROR: connection timeout after 30s\nWARN: Pool size 20, all busy',
        aiReport: JSON.stringify({ rootCause: 'Connection leak in user-service', confidence: 0.88 }),
        recommendations: JSON.stringify([{ action: 'Restart user-service pods', priority: 'CRITICAL' }]),
        confidenceScore: 0.88,
        rootCause: 'Connection leak in user-service',
        assignedEngineer: 'db-admin',
        createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      },
      {
        incidentId: randomUUID(),
        title: 'Kubernetes pod OOMKilled',
        description: 'ml-inference pods repeatedly OOMKilled causing model serving degradation',
        service: 'ml-inference',
        severity: 'HIGH',
        status: 'RESOLVED',
        environment: 'staging',
        rawLogs: 'OOMKilled: Container ml-inference exceeded memory limit\nWARN: Memory usage 95% before kill\nINFO: Pod restarted 3 times in 10 minutes',
        aiReport: JSON.stringify({ rootCause: 'Memory leak in batch prediction loop', confidence: 0.95 }),
        recommendations: JSON.stringify([{ action: 'Increase memory limit to 4Gi', priority: 'HIGH' }]),
        confidenceScore: 0.95,
        rootCause: 'Memory leak in batch prediction loop',
        assignedEngineer: 'ml-engineer',
        resolution: 'Increased memory limit and fixed batch processing loop',
        resolvedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      },
      {
        incidentId: randomUUID(),
        title: 'SSL certificate expiry on api-gateway',
        description: 'Wildcard certificate for *.sentinelflow.io expiring in 24 hours',
        service: 'api-gateway',
        severity: 'MEDIUM',
        status: 'OPEN',
        environment: 'production',
        rawLogs: 'WARN: Certificate expires 2026-07-11\nINFO: Auto-renewal failed - DNS challenge timeout',
        aiReport: JSON.stringify({ rootCause: 'Cert-manager DNS01 challenge failing', confidence: 0.99 }),
        recommendations: JSON.stringify([{ action: 'Manual certificate renewal via Let\'s Encrypt', priority: 'MEDIUM' }]),
        confidenceScore: 0.99,
        rootCause: 'Cert-manager DNS01 challenge failing',
        assignedEngineer: 'platform-team',
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
      {
        incidentId: randomUUID(),
        title: 'Redis cache eviction causing cache stampede',
        description: 'Redis LRU eviction triggered thundering herd on product catalog service',
        service: 'product-catalog',
        severity: 'MEDIUM',
        status: 'CLOSED',
        environment: 'production',
        rawLogs: 'WARN: Redis evicted 15000 keys in last minute\nERROR: Database CPU spike to 95%\nINFO: Cache hit ratio dropped from 98% to 12%',
        aiReport: JSON.stringify({ rootCause: 'Redis maxmemory too low for workload', confidence: 0.91 }),
        recommendations: JSON.stringify([{ action: 'Increase Redis maxmemory to 8GB', priority: 'MEDIUM' }]),
        confidenceScore: 0.91,
        rootCause: 'Redis maxmemory too low for workload',
        resolution: 'Increased Redis memory and added cache warming',
        assignedEngineer: 'backend-lead',
        resolvedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        closedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      },
    ];

    for (const inc of incidents) {
      await dbClient.query(`
        INSERT INTO incidents (incident_id, organization_id, title, description, service, severity, status, environment, raw_logs, ai_report, recommendations, confidence_score, root_cause, assigned_engineer, created_at, updated_at, resolved_at, closed_at, resolution)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        ON CONFLICT (incident_id) DO NOTHING
      `, [
        inc.incidentId, orgId, inc.title, inc.description, inc.service, inc.severity, inc.status, inc.environment,
        inc.rawLogs, inc.aiReport, inc.recommendations, inc.confidenceScore, inc.rootCause, inc.assignedEngineer,
        inc.createdAt, inc.updatedAt, inc.resolvedAt || null, inc.closedAt || null, inc.resolution || null
      ]);

      // Add timeline events
      await dbClient.query(`
        INSERT INTO incident_timeline (event_id, incident_id, actor, action, old_value, new_value, notes, metadata, created_at)
        VALUES (gen_random_uuid(), $1, 'SYSTEM', 'INCIDENT_CREATED', NULL, 'OPEN', 'Incident created via Demo Mode', '{}', $2)
        ON CONFLICT DO NOTHING
      `, [inc.incidentId, inc.createdAt]);

      if (inc.status !== 'OPEN') {
        await dbClient.query(`
          INSERT INTO incident_timeline (event_id, incident_id, actor, action, old_value, new_value, notes, metadata, created_at)
          VALUES (gen_random_uuid(), $1, 'SYSTEM', 'STATUS_CHANGED', 'OPEN', $2, 'Status updated', '{}', $3)
          ON CONFLICT DO NOTHING
        `, [inc.incidentId, inc.status, inc.updatedAt]);
      }
    }

    // 4. Create demo notifications
    const notifications = [
      { id: randomUUID(), organizationId: orgId, type: 'INCIDENT_CREATED', channel: 'SLACK', target: '#incidents', subject: 'New Incident: High latency on payment API', body: 'Payment service experiencing 500ms+ p99 latency', status: 'DELIVERED', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
      { id: randomUUID(), organizationId: orgId, type: 'INCIDENT_CREATED', channel: 'EMAIL', target: 'oncall@sentinelflow.io', subject: 'CRITICAL: Database connection pool exhausted', body: 'PostgreSQL connection pool at 100% utilization', status: 'DELIVERED', createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
      { id: randomUUID(), organizationId: orgId, type: 'INCIDENT_RESOLVED', channel: 'SLACK', target: '#incidents', subject: 'Resolved: Kubernetes pod OOMKilled', body: 'ml-inference pods stabilized after memory limit increase', status: 'DELIVERED', createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
    ];

    for (const notif of notifications) {
      await dbClient.query(`
        INSERT INTO notifications (id, organization_id, type, channel, target, subject, body, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING
      `, [notif.id, notif.organizationId, notif.type, notif.channel, notif.target, notif.subject, notif.body, notif.status, notif.createdAt]);
    }

    // 5. Create demo runbooks
    const runbooks = [
      { id: randomUUID(), organizationId: orgId, name: 'Database Connection Pool Exhaustion', description: 'Restart affected services and increase pool size', service: 'postgresql', triggerEvent: 'ConnectionPoolExhausted', severity: 'CRITICAL', enabled: true, approvalRequired: false, timeoutSeconds: 300, retryLimit: 3, executionSteps: JSON.stringify([{ name: 'Check pool status', type: 'SHELL', arguments: { command: 'pg_stat_activity' } }, { name: 'Restart service', type: 'KUBECTL', arguments: { action: 'rollout restart', resource: 'deployment/user-service' } }]), rollbackSteps: JSON.stringify([]) },
      { id: randomUUID(), organizationId: orgId, name: 'Pod OOMKilled Remediation', description: 'Increase memory limits and analyze heap dump', service: 'kubernetes', triggerEvent: 'PodOOMKilled', severity: 'HIGH', enabled: true, approvalRequired: true, timeoutSeconds: 600, retryLimit: 2, executionSteps: JSON.stringify([{ name: 'Get pod logs', type: 'KUBECTL', arguments: { action: 'logs', resource: 'pod/ml-inference-xxx' } }, { name: 'Increase memory limit', type: 'KUBECTL', arguments: { action: 'patch', resource: 'deployment/ml-inference', patch: '{"spec":{"template":{"spec":{"containers":[{"name":"ml-inference","resources":{"limits":{"memory":"4Gi"}}}]}}}}' } }]), rollbackSteps: JSON.stringify([{ name: 'Rollback memory limit', type: 'KUBECTL', arguments: { action: 'patch', resource: 'deployment/ml-inference', patch: '{"spec":{"template":{"spec":{"containers":[{"name":"ml-inference","resources":{"limits":{"memory":"2Gi"}}}]}}}}' } }]) },
    ];

    for (const rb of runbooks) {
      await dbClient.query(`
        INSERT INTO runbooks (id, organization_id, name, description, service, trigger_event, severity, enabled, approval_required, timeout_seconds, retry_limit, execution_steps, rollback_steps, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `, [rb.id, rb.organizationId, rb.name, rb.description, rb.service, rb.triggerEvent, rb.severity, rb.enabled, rb.approvalRequired, rb.timeoutSeconds, rb.retryLimit, rb.executionSteps, rb.rollbackSteps]);
    }

    // 6. Create demo agents
    const agents = [
      { agentId: randomUUID(), organizationId: orgId, name: 'Incident Analyzer', type: 'ANALYZER', status: 'RUNNING', config: JSON.stringify({ model: 'llama-3.1-70b-versatile', temperature: 0.1 }), lastHeartbeat: new Date().toISOString() },
      { agentId: randomUUID(), organizationId: orgId, name: 'Anomaly Detector', type: 'DETECTOR', status: 'RUNNING', config: JSON.stringify({ model: 'llama-3.1-8b-instant', threshold: 0.8 }), lastHeartbeat: new Date().toISOString() },
      { agentId: randomUUID(), organizationId: orgId, name: 'SRE Assistant', type: 'ASSISTANT', status: 'RUNNING', config: JSON.stringify({ model: 'llama-3.1-70b-versatile', tools: ['runbook_executor', 'k8s_client'] }), lastHeartbeat: new Date().toISOString() },
    ];

    for (const agent of agents) {
      await dbClient.query(`
        INSERT INTO agents (agent_id, organization_id, name, type, status, config, last_heartbeat, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        ON CONFLICT (agent_id) DO NOTHING
      `, [agent.agentId, agent.organizationId, agent.name, agent.type, agent.status, agent.config, agent.lastHeartbeat]);
    }

    // 7. Create demo decision intelligence data
    const decisions = [
      { id: randomUUID(), organizationId: orgId, incidentId: incidents[0].incidentId, recommendedAction: 'Scale payment-api deployment to 10 replicas', recommendedRunbooks: JSON.stringify([runbooks[0].id]), recommendedEngineer: JSON.stringify({ id: 'eng-1', name: 'Sarah Chen', role: 'Senior SRE', avatarUrl: '/avatars/sarah.png' }), confidence: 0.92, confidenceBreakdown: JSON.stringify({ logs: 0.95, metrics: 0.89, traces: 0.91 }), possibleRootCauses: ['Downstream gateway latency', 'Thread pool exhaustion'], status: 'PENDING', modelName: 'llama-3.1-70b-versatile', latencyMs: 1250, tokensUsed: 2450, reasoningSteps: JSON.stringify([{ step: 'Log analysis', thought: 'Payment gateway timeouts correlate with latency spike', confidence: 0.95 }, { step: 'Metric correlation', thought: 'CPU and memory normal, network latency elevated', confidence: 0.89 }]), createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
      { id: randomUUID(), organizationId: orgId, incidentId: incidents[1].incidentId, recommendedAction: 'Restart user-service pods and increase connection pool', recommendedRunbooks: JSON.stringify([runbooks[0].id]), recommendedEngineer: JSON.stringify({ id: 'eng-2', name: 'Mike Rodriguez', role: 'Database Admin', avatarUrl: '/avatars/mike.png' }), confidence: 0.88, confidenceBreakdown: JSON.stringify({ logs: 0.92, metrics: 0.85, traces: 0.87 }), possibleRootCauses: ['Connection leak in user-service', 'Pool size too small'], status: 'APPROVED', modelName: 'llama-3.1-70b-versatile', latencyMs: 980, tokensUsed: 1890, reasoningSteps: JSON.stringify([{ step: 'Log analysis', thought: 'All connections in idle in transaction state', confidence: 0.92 }, { step: 'Metric correlation', thought: 'Active connections at 20/20, wait queue growing', confidence: 0.85 }]), createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
    ];

    for (const dec of decisions) {
      await dbClient.query(`
        INSERT INTO decision_reports (id, organization_id, incident_id, recommended_action, recommended_runbooks, recommended_engineer, confidence, confidence_breakdown, possible_root_causes, status, model_name, latency_ms, tokens_used, reasoning_steps, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (id) DO NOTHING
      `, [dec.id, dec.organizationId, dec.incidentId, dec.recommendedAction, dec.recommendedRunbooks, dec.recommendedEngineer, dec.confidence, dec.confidenceBreakdown, dec.possibleRootCauses, dec.status, dec.modelName, dec.latencyMs, dec.tokensUsed, dec.reasoningSteps, dec.createdAt]);
    }

    // 8. Create demo learning data
    await dbClient.query(`
      INSERT INTO recommendation_accuracy (id, decision_id, incident_id, recommended_action, recommended_runbooks, confidence_score, accuracy_score, precision_score, recall_score, f1_score, confidence_drift, recommendation_success, created_at)
      VALUES (gen_random_uuid(), $1, $2, 'Scale payment-api deployment', '["runbook-1"]', 0.92, 0.89, 0.85, 0.91, 0.88, -0.03, true, NOW())
      ON CONFLICT DO NOTHING
    `, [decisions[0].id, incidents[0].incidentId]);

    console.log('[SeedDemo] Demo data seeded successfully!');
  } catch (error) {
    console.error('[SeedDemo] Failed to seed demo data:', error);
    throw error;
  }
}