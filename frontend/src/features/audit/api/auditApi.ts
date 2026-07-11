import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  severity: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  entity: string;
  details?: Record<string, any>;
}

export const auditApi = {
  list: async (): Promise<AuditLog[]> => {
    const res = await apiClient.get<{ success: boolean; data: AuditLog[] }>(endpoints.governance.audit);
    return res.data.data;
  },
};

export default auditApi;
