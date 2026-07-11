import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  SwitchOrgResponse,
} from '../types';
import { User, UserSession } from '@/store/authStore';

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>(endpoints.auth.login, data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post(endpoints.auth.logout);
  },

  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>(endpoints.auth.register, data);
    return response.data;
  },

  forgotPassword: async (data: ForgotPasswordRequest): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      endpoints.auth.forgotPassword,
      data
    );
    return response.data;
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      endpoints.auth.resetPassword,
      data
    );
    return response.data;
  },

  refreshToken: async (token: string): Promise<{ token: string; refreshToken: string }> => {
    const response = await apiClient.post<{ token: string; refreshToken: string }>(
      endpoints.auth.refresh,
      { token }
    );
    return response.data;
  },

  me: async (): Promise<{ user: User }> => {
    const response = await apiClient.get<{ user: User }>(endpoints.auth.me);
    return response.data;
  },

  sessions: async (): Promise<UserSession[]> => {
    const response = await apiClient.get<UserSession[]>(endpoints.auth.sessions);
    return response.data;
  },

  switchOrganization: async (orgId: string): Promise<SwitchOrgResponse> => {
    const response = await apiClient.post<SwitchOrgResponse>(
      endpoints.auth.switchOrganization(orgId)
    );
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<{ user: User }> => {
    const response = await apiClient.patch<{ user: User }>(endpoints.auth.updateProfile, data);
    return response.data;
  },
};
export default authApi;
