import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface UIState {
  theme: Theme;
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  notificationDrawerOpen: boolean;
  environment: string;
  cloudProvider: string;
  aiModel: string;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setNotificationDrawerOpen: (open: boolean) => void;
  setEnvironment: (env: string) => void;
  setCloudProvider: (provider: string) => void;
  setAiModel: (model: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'dark',
      sidebarCollapsed: false,
      commandPaletteOpen: false,
      notificationDrawerOpen: false,
      environment: 'production',
      cloudProvider: 'aws',
      aiModel: 'groq/llama-3.3-70b',

      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      setNotificationDrawerOpen: (open) => set({ notificationDrawerOpen: open }),
      setEnvironment: (environment) => set({ environment }),
      setCloudProvider: (cloudProvider) => set({ cloudProvider }),
      setAiModel: (aiModel) => set({ aiModel }),
    }),
    { name: 'sentinelflow-ui', partialize: (s) => ({ theme: s.theme, sidebarCollapsed: s.sidebarCollapsed, environment: s.environment, cloudProvider: s.cloudProvider, aiModel: s.aiModel }) }
  )
);
