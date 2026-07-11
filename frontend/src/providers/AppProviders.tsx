import * as React from 'react';
import { ThemeProvider } from './ThemeProvider';
import { QueryProvider } from './QueryProvider';
import { AuthProvider } from './AuthProvider';
import { SocketProvider } from './SocketProvider';
import { CommandProvider } from './CommandProvider';
import { ModalProvider } from './ModalProvider';
import { NotificationProvider } from './NotificationProvider';
import { OrganizationProvider } from './OrganizationProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AuthProvider>
          <OrganizationProvider>
            <SocketProvider>
              <CommandProvider>
                <ModalProvider>
                  <NotificationProvider>
                    {children}
                  </NotificationProvider>
                </ModalProvider>
              </CommandProvider>
            </SocketProvider>
          </OrganizationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}

export default AppProviders;
