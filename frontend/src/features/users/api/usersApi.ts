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
    const url = orgId ? `/custom/v1/auth/organizations/${orgId}/members` : '/custom/v1/auth/teams';
    const res = await apiClient.get<{ success: boolean; data: TeamMember[] }>(url);
    return res.data.data;
  },
};

export default usersApi;
