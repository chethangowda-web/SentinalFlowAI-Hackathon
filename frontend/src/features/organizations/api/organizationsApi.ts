import { apiClient } from '@/api/client';
import { Organization } from '@/store/authStore';

export interface OrganizationMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  lastActiveAt: string;
  avatarUrl?: string;
}

export interface OrganizationDetail extends Organization {
  memberCount?: number;
  createdAt: string;
}

export const organizationsApi = {
  listOrganizations: async (): Promise<OrganizationDetail[]> => {
    const res = await apiClient.get<{ organizations: OrganizationDetail[] }>('/custom/v1/auth/organizations');
    return res.data.organizations || [];
  },

  getOrganization: async (orgId: string): Promise<OrganizationDetail | null> => {
    const res = await apiClient.get<{ success: boolean; data: OrganizationDetail }>(`/custom/v1/auth/organizations/${orgId}`);
    return res.data.data || null;
  },

  listMembers: async (orgId?: string): Promise<OrganizationMember[]> => {
    const res = await apiClient.get<{ teams: OrganizationMember[] }>('/custom/v1/auth/teams');
    return res.data.teams || [];
  },
};

export default organizationsApi;
