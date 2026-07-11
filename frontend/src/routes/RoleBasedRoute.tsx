import * as React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  permission: string;
}

export function RoleBasedRoute({ children, permission }: RoleBasedRouteProps) {
  const { hasPermission } = useAuthStore();

  if (!hasPermission(permission)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}

export default RoleBasedRoute;
