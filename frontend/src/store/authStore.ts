import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserSession {
  id: string;
  device: string;
  ipAddress: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  role: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string;
  timezone?: string;
  language?: string;
  organizations: Organization[];
  activeOrgId?: string;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  activeOrganization: Organization | null;
  sessions: UserSession[];
  loading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  login: (token: string, refreshToken: string, user: User) => void;
  logout: () => void;
  setToken: (token: string) => void;
  setRefreshToken: (refreshToken: string) => void;
  setUser: (user: User | ((prev: User | null) => User | null)) => void;
  setSessions: (sessions: UserSession[]) => void;
  setLoading: (loading: boolean) => void;
  switchOrganization: (orgId: string) => Promise<void>;
  updateProfile: (profile: Partial<User>) => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,
      activeOrganization: null,
      sessions: [],
      loading: false,
      isAuthenticated: false,

      login: (token, refreshToken, user) => {
        const activeOrg = user.organizations.find(o => o.id === user.activeOrgId) || user.organizations[0] || null;
        set({
          token,
          refreshToken,
          user,
          activeOrganization: activeOrg,
          isAuthenticated: true,
          loading: false,
        });
      },

      logout: () => {
        set({
          token: null,
          refreshToken: null,
          user: null,
          activeOrganization: null,
          sessions: [],
          isAuthenticated: false,
          loading: false,
        });
      },

      setToken: (token) => set({ token }),
      setRefreshToken: (refreshToken) => set({ refreshToken }),
      setUser: (userUpdate) => {
        const currentUser = get().user;
        const newUser = typeof userUpdate === 'function' ? userUpdate(currentUser) : userUpdate;
        if (newUser) {
          const activeOrg = newUser.organizations.find(o => o.id === newUser.activeOrgId) || newUser.organizations[0] || null;
          set({ user: newUser, activeOrganization: activeOrg });
        } else {
          set({ user: null, activeOrganization: null });
        }
      },
      setSessions: (sessions) => set({ sessions }),
      setLoading: (loading) => set({ loading }),

      switchOrganization: async (orgId: string) => {
        const { user } = get();
        if (!user) return;
        
        const org = user.organizations.find((o) => o.id === orgId);
        if (!org) throw new Error('User does not belong to this organization');

        // Update local user activeOrgId
        const updatedUser = { ...user, activeOrgId: orgId };
        set({
          user: updatedUser,
          activeOrganization: org,
        });
      },

      updateProfile: async (profileUpdate: Partial<User>) => {
        const { user } = get();
        if (!user) return;
        
        const updatedUser = { ...user, ...profileUpdate };
        set({ user: updatedUser });
      },

      hasPermission: (permission: string) => {
        const { user, activeOrganization } = get();
        if (!user || !activeOrganization) return false;
        
        // Superadmin bypasses RBAC
        if (user.role === 'superadmin' || activeOrganization.role === 'owner' || activeOrganization.role === 'admin') {
          return true;
        }
        
        // RBAC logic mapper (in mock, we check user's roles/permissions)
        const rolePermissions: Record<string, string[]> = {
          member: ['incidents:view', 'runbooks:view', 'agents:view', 'notifications:view'],
          operator: ['incidents:view', 'incidents:edit', 'runbooks:view', 'runbooks:execute', 'agents:view'],
          admin: ['*'],
        };
        
        const permissions = rolePermissions[activeOrganization.role.toLowerCase()] || [];
        return permissions.includes('*') || permissions.includes(permission);
      },
    }),
    {
      name: 'sentinelflow-auth-extended',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        activeOrganization: state.activeOrganization,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
