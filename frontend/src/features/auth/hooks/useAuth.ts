import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi } from '../api/authApi';
import { useAuthStore, User } from '@/store/authStore';
import {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '../types';

export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const store = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => authApi.login(credentials),
    onSuccess: (data) => {
      store.login(data.token, data.refreshToken, data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate('/dashboard');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error || 'Failed to login. Please try again.';
      toast.error(msg);
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: (data) => {
      store.login(data.token, data.refreshToken, data.user);
      toast.success(`Welcome to SentinelFlow, ${data.user.name}!`);
      navigate('/dashboard');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error || 'Registration failed.';
      toast.error(msg);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      store.logout();
      toast.success('Logged out successfully.');
      navigate('/login');
      queryClient.clear();
    },
    onError: () => {
      // Even if API request fails, clear local session
      store.logout();
      navigate('/login');
      queryClient.clear();
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (data: ForgotPasswordRequest) => authApi.forgotPassword(data),
    onSuccess: (data) => {
      toast.success(data.message || 'Password reset link sent to your email.');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error || 'Failed to process request.';
      toast.error(msg);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (data: ResetPasswordRequest) => authApi.resetPassword(data),
    onSuccess: (data) => {
      toast.success(data.message || 'Password reset successful. You can login now.');
      navigate('/login');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error || 'Failed to reset password.';
      toast.error(msg);
    },
  });

  const switchOrgMutation = useMutation({
    mutationFn: (orgId: string) => authApi.switchOrganization(orgId),
    onSuccess: async (data) => {
      store.login(data.token, data.refreshToken, data.user);
      toast.success(`Switched to ${data.user.organizations.find(o => o.id === data.user.activeOrgId)?.name}`);
      queryClient.invalidateQueries();
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error || 'Failed to switch organization.';
      toast.error(msg);
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (profile: Partial<User>) => authApi.updateProfile(profile),
    onSuccess: (data) => {
      store.setUser(data.user);
      toast.success('Profile updated successfully.');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error || 'Failed to update profile.';
      toast.error(msg);
    },
  });

  const userSessionsQuery = useQuery({
    queryKey: ['auth', 'sessions'],
    queryFn: () => authApi.sessions(),
    enabled: store.isAuthenticated,
  });

  return {
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,

    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,

    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,

    forgotPassword: forgotPasswordMutation.mutate,
    isSendingResetLink: forgotPasswordMutation.isPending,
    isResetLinkSent: forgotPasswordMutation.isSuccess,

    resetPassword: resetPasswordMutation.mutate,
    isResettingPassword: resetPasswordMutation.isPending,

    switchOrganization: switchOrgMutation.mutate,
    isSwitchingOrg: switchOrgMutation.isPending,

    updateProfile: updateProfileMutation.mutate,
    isUpdatingProfile: updateProfileMutation.isPending,

    sessions: userSessionsQuery.data || [],
    isLoadingSessions: userSessionsQuery.isLoading,
    refetchSessions: userSessionsQuery.refetch,
    
    isAuthenticated: store.isAuthenticated,
    user: store.user,
    activeOrg: store.activeOrganization,
  };
}
