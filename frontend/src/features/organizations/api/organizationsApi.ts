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
    const res = await apiClient.get<{ success: boolean; data: OrganizationDetail[] }>('/custom/v1/auth/organizations');
    return res.data.data;
  },

  getOrganization: async (orgId: string): Promise<OrganizationDetail> => {
    const res = await apiClient.get<{ success: boolean; data: OrganizationDetail }>(`/custom/v1/auth/organizations/${orgId}`);
    return res.data.data;
  },

  listMembers: async (orgId?: string): Promise<OrganizationMember[]> => {
    const url = orgId ? `/custom/v1/auth/organizations/${orgId}/members` : '/custom/v1/auth/teams';
    const res = await apiClient.get<{ success: boolean; data: OrganizationMember[] }>(url);
    return res.data.data;
  },
};

export default organizationsApi;
