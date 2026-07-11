import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { NotificationDrawer } from './NotificationDrawer';
import { CommandPalette } from './CommandPalette';
import { AIAssistant } from '@/components/ai/AIAssistant';

export function AppLayout() {

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main app space */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header toolbar */}
        <TopBar />

        {/* Dynamic page contents with layout constraints */}
        <main className="flex-1 overflow-y-auto relative p-6">
          <Outlet />
        </main>
      </div>

      {/* Overlays & Modals */}
      <CommandPalette />
      <NotificationDrawer />
      <AIAssistant />

    </div>
  );
}

export default AppLayout;
