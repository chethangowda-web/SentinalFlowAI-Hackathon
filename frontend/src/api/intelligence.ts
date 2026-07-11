import { apiClient } from './client';
import { endpoints } from './endpoints';

export interface DecisionReport {
  id: string;
  incidentId: string;
  recommendedAction: string;
  recommendedRunbooks: string[];
  recommendedEngineer?: string;
  confidence: number;
  confidenceBreakdown: Record<string, number>;
  possibleRootCauses: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  modelName?: string;
  latencyMs?: number;
  tokensUsed?: number;
  reasoningSteps?: { step: string; thought: string; confidence: number; }[];
  estimatedBusinessImpact?: string;
  estimatedResolutionTime?: string;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  approvalRecommendation?: 'AUTO_REMEDIATE' | 'MANUAL_REVIEW' | 'ROLLBACK';
}

export interface RunbookRecommendation {
  runbookId: string;
  name: string;
  description: string;
  confidence: number;
  previousSuccessRate: number;
  averageExecutionTime: string;
  safetyLevel: 'SAFE' | 'MODERATE' | 'CRITICAL';
  rollbackAvailable: boolean;
}

export interface EngineerRecommendation {
  engineerId: string;
  name: string;
  avatarUrl: string;
  role: string;
  currentWorkload: number;
  expertise: string[];
  solvedIncidentsCount: number;
  confidence: number;
}

export const intelligenceApi = {
  getDecision: async (id: string): Promise<DecisionReport> => {
    const res = await apiClient.get<{ success: boolean; data: DecisionReport }>(endpoints.intelligence.decision(id));
    return res.data.data;
  },

  approveDecision: async (id: string): Promise<DecisionReport> => {
    const res = await apiClient.post<{ success: boolean; data: DecisionReport }>(endpoints.intelligence.approve(id));
    return res.data.data;
  },

  recomputeDecision: async (id: string, customAnalysis?: Record<string, any>): Promise<DecisionReport> => {
    const res = await apiClient.post<{ success: boolean; data: DecisionReport }>(endpoints.intelligence.recompute, {
      incidentId: id,
      aiAnalysis: customAnalysis || {},
    });
    return res.data.data;
  },

  getRecommendations: async (): Promise<any[]> => {
    const res = await apiClient.get<{ success: boolean; data: any[] }>(endpoints.intelligence.recommendations);
    return res.data.data;
  },

  getRecommendationsRunbooks: async (): Promise<RunbookRecommendation[]> => {
    const res = await apiClient.get<{ success: boolean; data: RunbookRecommendation[] }>('/custom/v1/recommendations/runbooks');
    return res.data.data;
  },

  getRecommendationsEngineers: async (): Promise<EngineerRecommendation[]> => {
    const res = await apiClient.get<{ success: boolean; data: EngineerRecommendation[] }>('/custom/v1/recommendations/engineers');
    return res.data.data;
  },
};

export default intelligenceApi;
