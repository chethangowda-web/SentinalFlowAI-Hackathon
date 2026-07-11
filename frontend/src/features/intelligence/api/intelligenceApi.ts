import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';

export interface IntelligenceDashboard {
  id: string;
  incidentId: string;
  recommendedAction: string;
  confidence: number;
  confidenceBreakdown: Record<string, number>;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  possibleRootCauses: string[];
  recommendedRunbooks: string[];
  modelName?: string;
  latencyMs?: number;
  tokensUsed?: number;
  approvalRecommendation?: 'AUTO_REMEDIATE' | 'MANUAL_REVIEW' | 'ROLLBACK';
}

export interface Recommendation {
  id: string;
  runbookId?: string;
  title: string;
  description: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  actions?: { label: string; runbookId?: string }[];
}

export interface HistoryEvent {
  id: string;
  incidentId: string;
  timestamp: string;
  type: 'DECISION' | 'FEEDBACK' | 'SYSTEM_ACTION';
  message: string;
  detail?: string;
  feedbackValue?: 'APPROVE' | 'REJECT';
  operatorName?: string;
}

export const intelligenceFeatureApi = {
  getDashboard: async (): Promise<IntelligenceDashboard> => {
    const res = await apiClient.get<{ success: boolean; data: IntelligenceDashboard }>(endpoints.intelligence.dashboard);
    return res.data.data;
  },

  getRecommendations: async (): Promise<Recommendation[]> => {
    const res = await apiClient.get<{ success: boolean; data: Recommendation[] }>(endpoints.intelligence.recommendations);
    return res.data.data;
  },

  getHistory: async (): Promise<HistoryEvent[]> => {
    const res = await apiClient.get<{ success: boolean; data: HistoryEvent[] }>(endpoints.intelligence.history);
    return res.data.data;
  },
};

export default intelligenceFeatureApi;
