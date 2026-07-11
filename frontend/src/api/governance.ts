import { apiClient } from './client';
import { endpoints } from './endpoints';

export interface GovernanceOverview {
  trustScore: number;
  riskScore: number;
  complianceScore: number;
  piiDetections: number;
  secretsDetected: number;
  injectionAttempts: number;
  toxicityFlags: number;
  policyViolations: number;
  safetyScore: number;
  totalDecisions: number;
  blockedResponses: number;
  approvedResponses: number;
  threatsThisWeek: number;
}

export interface DetectorStatus {
  name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  enabled: boolean;
  lastRun: string;
  totalFlags: number;
  accuracy: number;
}

export interface GovernanceHistoryItem {
  date: string;
  score: number;
  threats: number;
}

export const governanceApi = {
  getOverview: async (): Promise<GovernanceOverview> => {
    const res = await apiClient.get<{ success: boolean; data: GovernanceOverview }>(endpoints.governance.overview);
    return res.data.data;
  },
  getDetectors: async (): Promise<DetectorStatus[]> => {
    const res = await apiClient.get<{ success: boolean; data: DetectorStatus[] }>(endpoints.governance.detectors);
    return res.data.data;
  },
  getHistory: async (): Promise<GovernanceHistoryItem[]> => {
    const res = await apiClient.get<{ success: boolean; data: GovernanceHistoryItem[] }>(endpoints.governance.history);
    return res.data.data;
  },
};

export default governanceApi;
