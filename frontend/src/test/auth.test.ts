import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../store/authStore';

describe('AuthStore State Transitions', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it('should initialize with null tokens and user', () => {
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should store credentials on login', () => {
    const mockUser = {
      id: 'usr_1',
      email: 'operator@sentinelflow.io',
      name: 'Jane Operator',
      role: 'operator',
      organizations: [
        { id: 'org_1', name: 'Acme Security Corp', slug: 'acme-sec', role: 'operator' },
      ],
      activeOrgId: 'org_1',
    };

    useAuthStore.getState().login('access-token-123', 'refresh-token-456', mockUser);

    const state = useAuthStore.getState();
    expect(state.token).toBe('access-token-123');
    expect(state.refreshToken).toBe('refresh-token-456');
    expect(state.user).toEqual(mockUser);
    expect(state.activeOrganization).toEqual(mockUser.organizations[0]);
    expect(state.isAuthenticated).toBe(true);
  });

  it('should clear credentials on logout', () => {
    const mockUser = {
      id: 'usr_1',
      email: 'operator@sentinelflow.io',
      name: 'Jane Operator',
      role: 'operator',
      organizations: [],
    };

    useAuthStore.getState().login('access-token-123', 'refresh-token-456', mockUser);
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
