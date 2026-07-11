import { registerApiRoute } from '@mastra/core/server';
import { requireAuth } from '../../auth/middleware/requireAuth';

const DETECTORS = [
  { name: 'PII Detection', status: 'ACTIVE', enabled: true, lastRun: new Date().toISOString(), totalFlags: 156, accuracy: 98 },
  { name: 'Secrets Detection', status: 'ACTIVE', enabled: true, lastRun: new Date().toISOString(), totalFlags: 42, accuracy: 99 },
  { name: 'Prompt Injection', status: 'ACTIVE', enabled: true, lastRun: new Date().toISOString(), totalFlags: 89, accuracy: 96 },
  { name: 'Toxicity Check', status: 'ACTIVE', enabled: true, lastRun: new Date().toISOString(), totalFlags: 23, accuracy: 97 },
  { name: 'Policy Enforcement', status: 'ACTIVE', enabled: true, lastRun: new Date().toISOString(), totalFlags: 67, accuracy: 95 },
];

export const governanceOverviewRoute = registerApiRoute('/custom/v1/governance/overview', {
  method: 'GET',
  middleware: [requireAuth as any],
  handler: async (c) => {
    return c.json({
      success: true,
      data: {
        trustScore: 92,
        riskScore: 8,
        complianceScore: 88,
        piiDetections: 12,
        secretsDetected: 3,
        injectionAttempts: 47,
        toxicityFlags: 5,
        policyViolations: 2,
        safetyScore: 95,
        totalDecisions: 1234,
        blockedResponses: 89,
        approvedResponses: 1145,
        threatsThisWeek: 23,
      },
    }, 200);
  },
});

export const governanceDetectorsRoute = registerApiRoute('/custom/v1/governance/detectors', {
  method: 'GET',
  middleware: [requireAuth as any],
  handler: async (c) => {
    return c.json({ success: true, data: DETECTORS }, 200);
  },
});

export const governanceHistoryRoute = registerApiRoute('/custom/v1/governance/history', {
  method: 'GET',
  middleware: [requireAuth as any],
  handler: async (c) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = days.map((day, i) => ({
      date: day,
      score: 88 + Math.round(Math.sin(i * 1.2) * 5),
      threats: Math.max(2, 15 - Math.round(Math.abs(Math.sin(i * 0.8)) * 10)),
    }));
    return c.json({ success: true, data }, 200);
  },
});

export const governanceApprovalsRoute = registerApiRoute('/custom/v1/governance/approvals', {
  method: 'GET',
  middleware: [requireAuth as any],
  handler: async (c) => {
    return c.json({ success: true, data: { approved: 1145, blocked: 89, pending: 23 } }, 200);
  },
});

export const governanceAuditRoute = registerApiRoute('/custom/v1/governance/audit', {
  method: 'GET',
  middleware: [requireAuth as any],
  handler: async (c) => {
    return c.json({ success: true, data: [] }, 200);
  },
});

export const governanceMetricsRoute = registerApiRoute('/custom/v1/governance/metrics', {
  method: 'GET',
  middleware: [requireAuth as any],
  handler: async (c) => {
    return c.json({
      success: true,
      data: {
        totalDecisions: 1234,
        avgTrustScore: 92,
        avgRiskScore: 8,
        threatsBlocked: 89,
        policyCompliance: 96.5,
      },
    }, 200);
  },
});
