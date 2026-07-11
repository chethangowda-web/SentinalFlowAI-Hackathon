import * as React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertOctagon,
  Sparkles,
  BookOpen,
  Bell,
  Activity,
  Bot,
  FolderHeart,
  BarChart3,
  Network,
  Users,
  History,
  Terminal,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Incidents', path: '/incidents', icon: AlertOctagon },
  { label: 'AI Intelligence', path: '/intelligence', icon: Sparkles },
  { label: 'Runbooks', path: '/runbooks', icon: BookOpen },
  { label: 'Notifications', path: '/notifications', icon: Bell },
  { label: 'Live Monitoring', path: '/monitoring', icon: Activity },
  { label: 'Agents', path: '/agents', icon: Bot },
  { label: 'Knowledge Base', path: '/knowledge', icon: FolderHeart },
  { label: 'Reports', path: '/reports', icon: BarChart3 },
  { label: 'Organizations', path: '/organizations', icon: Network },
  { label: 'Users', path: '/users', icon: Users },
  { label: 'Audit Logs', path: '/audit', icon: History },
  { label: 'Platform', path: '/platform', icon: Terminal },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <TooltipProvider>
      <div
        className={cn(
          'relative flex flex-col border-r bg-card transition-all duration-300 select-none h-screen sticky top-0',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-14 items-center justify-between border-b px-4">
          {!sidebarCollapsed && (
            <span className="text-sm font-bold tracking-wider text-purple-400 font-mono">
              SENTINELFLOW
            </span>
          )}
          <button
            onClick={toggleSidebar}
            className="ml-auto rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Tooltip key={item.path} delayDuration={50}>
                <TooltipTrigger asChild>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-all cursor-pointer',
                        isActive
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent'
                      )
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </NavLink>
                </TooltipTrigger>
                {sidebarCollapsed && (
                  <TooltipContent side="right">
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </nav>
      </div>
    </TooltipProvider>
  );
}

export default Sidebar;
