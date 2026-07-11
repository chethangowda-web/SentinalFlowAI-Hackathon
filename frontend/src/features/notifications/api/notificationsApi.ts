import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';

export interface Notification {
  id: string;
  message: string;
  severity: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  timestamp: string;
  read: boolean;
}

export const notificationsApi = {
  list: async (): Promise<Notification[]> => {
    const res = await apiClient.get<{ success: boolean; data: Notification[] }>(endpoints.notifications.list);
    return res.data.data;
  },
};

export default notificationsApi;
