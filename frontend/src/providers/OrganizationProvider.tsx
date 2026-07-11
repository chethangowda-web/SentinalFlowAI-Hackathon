import * as React from 'react';
import { useAuthStore } from '@/store/authStore';

interface OrgContextValue {
  orgId: string | null;
}

const OrgContext = React.createContext<OrgContextValue | null>(null);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { activeOrganization } = useAuthStore();

  const val = React.useMemo(() => ({
    orgId: activeOrganization?.id || null,
  }), [activeOrganization]);

  return <OrgContext.Provider value={val}>{children}</OrgContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useOrg() {
  const context = React.useContext(OrgContext);
  if (!context) {
    throw new Error('useOrg must be used within OrganizationProvider');
  }
  return context;
}

export default OrganizationProvider;
