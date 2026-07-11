import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';

export interface KnowledgeNode {
  id: string;
  name: string;
  category: string;
  categoryIndex: number;
  description?: string;
  symbolSize?: number;
}

export interface KnowledgeLink {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface KnowledgeGraphData {
  nodes: KnowledgeNode[];
  links: KnowledgeLink[];
  categories: string[];
}

export interface SimilarResult {
  id: string;
  title: string;
  similarity: number;
  severity: string;
  resolvedAt?: string;
  runbookUsed?: string;
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  category: string;
  score: number;
}

export const knowledgeApi = {
  getKnowledgeGraph: async (): Promise<KnowledgeGraphData> => {
    const res = await apiClient.get<{ success: boolean; data: KnowledgeGraphData }>(endpoints.learning.knowledge);
    return res.data.data;
  },

  search: async (query: string): Promise<SearchResult[]> => {
    const res = await apiClient.get<{ success: boolean; data: SearchResult[] }>(endpoints.learning.search, {
      params: { q: query },
    });
    return res.data.data;
  },

  getSimilar: async (): Promise<SimilarResult[]> => {
    const res = await apiClient.get<{ success: boolean; data: SimilarResult[] }>(endpoints.learning.similar);
    return res.data.data;
  },
};

export default knowledgeApi;
