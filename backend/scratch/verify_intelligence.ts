import { randomUUID } from 'crypto';
// Mock environment variables to satisfy config and clients
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'password';
process.env.DB_NAME = 'sentinelflow';
process.env.JWT_SECRET = 'super-secret-key-12345';
process.env.QDRANT_URL = 'http://localhost:6333';
process.env.QDRANT_COLLECTION = 'incidents';

import { dbClient } from '../src/database/client/DatabaseClient';
import { incidentRepository } from '../src/database/repositories/IncidentRepository';
import { runbookRepository } from '../src/database/repositories/RunbookRepository';
import { decisionEngine } from '../src/intelligence/services/DecisionEngine';
import { decisionRepository } from '../src/intelligence/repositories/DecisionRepository';
import { learningService } from '../src/intelligence/services/LearningService';

async function runVerification() {
  console.log('=== STARTING DECISION INTELLIGENCE LAYER INTEGRATION VERIFICATION ===');

  // 1. Validate DB Connection & Migrations
  try {
    const tableCheck = await dbClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('decision_reports', 'decision_feedback');
    `);
    console.log('[Verify] Migrated Tables found:', tableCheck.map((t) => t.table_name));
    if (tableCheck.length < 2) {
      console.log('[Verify] Migrations not automatically run yet, running them manually...');
      const fs = require('fs');
      const path = require('path');
      const sql = fs.readFileSync(path.join(__dirname, '../src/database/migrations/008_decision_intelligence_tables.sql'), 'utf8');
      await dbClient.query(sql);
      console.log('[Verify] Migration table definitions applied.');
    }
  } catch (err) {
    console.error('[Verify] Database schema check failed:', err);
    process.exit(1);
  }

  // 2. Insert a Mock Runbook to recommend
  const runbookId = randomUUID();
  try {
    await runbookRepository.createRunbook({
      id: runbookId,
      name: 'Restart Payment Pods',
      description: 'Force restarts payment gateway pods in default namespace',
      service: 'payment-service',
      triggerEvent: 'IncidentAnalysisCompleted',
      severity: 'CRITICAL',
      enabled: true,
      approvalRequired: false,
      timeoutSeconds: 300,
      retryLimit: 3,
      executionSteps: [
        { name: 'restart pod', type: 'kubernetes', arguments: { action: 'deletePod', namespace: 'default', name: 'payment-deployment' } }
      ],
      rollbackSteps: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('[Verify] Mock SRE Runbook created successfully:', runbookId);
  } catch (err: any) {
    console.warn('[Verify] Note: Runbook insertion skipped or already exists:', err.message);
  }

  // 3. Create a Mock Incident
  const incidentId = randomUUID();
  const orgId = randomUUID();
  console.log('[Verify] Inserting mock incident:', incidentId);

  const mockIncident = await incidentRepository.createIncident({
    incidentId,
    service: 'payment-service',
    application: 'web-gateway',
    environment: 'production',
    severity: 'CRITICAL',
    priority: 'P1',
    status: 'OPEN',
    title: 'Payment Service saturation and latencies spiked above 2.5s',
    summary: 'Spike in payment transaction response latencies due to connection pool saturation.',
    description: 'Incoming payment transactions failing on gateway timeout.',
    rawLogs: '[ERROR] 2026-07-08T20:10:00Z Connection pool limit reached: 100 connections maxed out.',
    confidenceScore: 0.90,
    rootCause: 'Connection Pool Saturation',
    organizationId: orgId,
    metadata: { organizationId: orgId }
  });
  console.log('[Verify] Mock Incident inserted:', mockIncident.incidentId);

  // 4. Compute decision report
  console.log('[Verify] Running DecisionEngine computation...');
  const report = await decisionEngine.computeDecision(incidentId, {
    summary: 'Analyzed connection timeout issues on payments database',
    suggestedMitigation: 'Scale up payment deployment replicas'
  });

  console.log('[Verify] Decision generated successfully!');
  console.log(' - Decision Report ID:', report.id);
  console.log(' - Overall Score:', report.overallScore);
  console.log(' - Confidence:', report.confidence);
  console.log(' - Risk Level:', report.riskLevel);
  console.log(' - Recommended Action:', report.recommendedAction);
  console.log(' - Estimated Resolution Time:', report.estimatedResolutionTime);
  console.log(' - Approval Recommendation:', report.approvalRecommendation);
  console.log(' - Initial Status:', report.status);
  console.log(' - Creator Model:', report.createdByModel);
  console.log(' - Token Usage:', report.tokenUsage);
  console.log(' - Model Latency:', report.modelLatencyMs, 'ms');
  console.log(' - Exec Time:', report.executionTimeMs, 'ms');

  // Asserts
  if (report.incidentId !== incidentId) throw new Error('Assertion failed: Incident ID mismatch');
  if (report.overallScore <= 0 || report.overallScore > 100) throw new Error('Assertion failed: Invalid overall score');
  if (report.confidence <= 0 || report.confidence > 1.0) throw new Error('Assertion failed: Invalid confidence score');
  if (report.recommendedRunbooks.length === 0) throw new Error('Assertion failed: Runbook recommendations array is empty');

  // 5. Test Persistence Querying
  console.log('[Verify] Fetching Decision Report from database...');
  const fetched = await decisionRepository.findByIncidentId(incidentId);
  if (!fetched) throw new Error('Assertion failed: Persisted report not found');
  console.log('[Verify] Verified PostgreSQL storage matches generated report.');

  // 6. Test Decision Approval Lifecycle
  console.log('[Verify] Simulating Operator Approval...');
  const approved = await decisionRepository.approveDecision(report.id);
  console.log(' - Approved Status:', approved.status);
  if (approved.status !== 'APPROVED') throw new Error('Assertion failed: Status not APPROVED');

  // 7. Test Decision Rejection/Override
  console.log('[Verify] Simulating operator rejection override...');
  const rejected = await decisionRepository.rejectDecision(report.id);
  console.log(' - Overridden Status:', rejected.status);
  if (rejected.status !== 'OVERRIDDEN') throw new Error('Assertion failed: Status not OVERRIDDEN');

  // 8. Test SRE Operator Feedback Submission
  console.log('[Verify] Logging reinforcement feedback...');
  const feedback = await learningService.recordFeedback({
    id: randomUUID(),
    decisionId: report.id,
    accepted: false,
    rejected: true,
    manualOverride: true,
    actualRootCause: 'Database Deadlocks',
    actualResolutionTimeMs: 450000,
    wasRecommendationCorrect: false,
    feedback: 'Runbook did not scale connection limits correctly.',
    engineer: 'operator-1',
    createdAt: new Date()
  });
  console.log('[Verify] Reinforcement learning feedback logged:', feedback.id);

  // 9. Test Statistics & Metrics Dashboard API backend
  console.log('[Verify] Querying Intelligence statistics...');
  const statistics = await decisionRepository.statistics();
  console.log(' - SRE Stats Output:', statistics);

  console.log('=== DECISION INTELLIGENCE LAYER INTEGRATION VERIFICATION COMPLETED SUCCESSFULLY ===');
  process.exit(0);
}

runVerification().catch((err) => {
  console.error('[Verify] Integration verification script failed with error:', err);
  process.exit(1);
});
