import { apiClient } from '@/api/client';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  lastActiveAt: string;
  avatarUrl?: string;
  phone?: string;
  department?: string;
}

export const usersApi = {
  listMembers: async (orgId?: string): Promise<TeamMember[]> => {
    const res = await apiClient.get<{ success: boolean; data: TeamMember[] }>('/custom/v1/auth/members');
    return res.data.data ?? [];
  },
};

export default usersApi;
