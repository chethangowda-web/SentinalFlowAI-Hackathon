import { apiClient } from './client';
import { endpoints } from './endpoints';

export interface LearningOverview {
  totalIncidentsLearned: number;
  embeddingsGenerated: number;
  knowledgeBaseSize: number;
  similarityAccuracy: number;
  learningGrowth: number;
  topRootCauses: { cause: string; count: number }[];
  frequentErrors: { error: string; count: number }[];
  successfulRunbooks: { name: string; count: number }[];
}

export interface SimilarIncident {
  id: string;
  title: string;
  severity: string;
  similarity: number;
  resolvedAt: string;
  runbookUsed: string;
}

export interface LearningGrowthItem {
  date: string;
  embeddings: number;
  incidents: number;
}

export const learningApi = {
  getOverview: async (): Promise<LearningOverview> => {
    const res = await apiClient.get<{ success: boolean; data: LearningOverview }>(endpoints.learning.overview);
    return res.data.data;
  },
  getSimilar: async (incidentId?: string): Promise<SimilarIncident[]> => {
    const url = incidentId ? `${endpoints.learning.similar}?incidentId=${incidentId}` : endpoints.learning.similar;
    const res = await apiClient.get<{ success: boolean; data: SimilarIncident[] }>(url);
    return res.data.data;
  },
  getGrowth: async (): Promise<LearningGrowthItem[]> => {
    const res = await apiClient.get<{ success: boolean; data: LearningGrowthItem[] }>(endpoints.learning.growth);
    return res.data.data;
  },
};

export default learningApi;
