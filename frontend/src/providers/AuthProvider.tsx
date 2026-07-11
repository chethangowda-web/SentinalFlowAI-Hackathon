import * as React from 'react';
import { useAuthStore } from '@/store/authStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useAuthStore();

  return <>{children}</>;
}

export default AuthProvider;
