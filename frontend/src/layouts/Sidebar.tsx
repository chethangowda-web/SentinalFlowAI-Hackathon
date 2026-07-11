import * as React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertOctagon,
  Sparkles,
  Shield,
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
  Cpu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { motion } from 'framer-motion';

type NavGroup = {
  label: string;
  items: {
    label: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Monitor',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Incidents', path: '/incidents', icon: AlertOctagon, badge: '3' },
      { label: 'Monitoring', path: '/monitoring', icon: Activity },
    ],
  },
  {
    label: 'AI & Intelligence',
    items: [
      { label: 'AI Intelligence', path: '/intelligence', icon: Sparkles },
      { label: 'Agents', path: '/agents', icon: Bot },
      { label: 'Governance', path: '/governance', icon: Shield },
      { label: 'Learning Center', path: '/learning', icon: Cpu },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Runbooks', path: '/runbooks', icon: BookOpen },
      { label: 'Notifications', path: '/notifications', icon: Bell },
      { label: 'Knowledge Base', path: '/knowledge', icon: FolderHeart },
    ],
  },
  {
    label: 'Infrastructure',
    items: [
      { label: 'Reports', path: '/reports', icon: BarChart3 },
      { label: 'Organizations', path: '/organizations', icon: Network },
      { label: 'Users', path: '/users', icon: Users },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Audit Logs', path: '/audit', icon: History },
      { label: 'Platform', path: '/platform', icon: Terminal },
      { label: 'Settings', path: '/settings', icon: Settings },
    ],
  },
];

function NavItem({
  item,
  collapsed,
  locationPath,
}: {
  item: NavGroup['items'][0];
  collapsed: boolean;
  locationPath: string;
}) {
  const Icon = item.icon;
  const isActive = locationPath === item.path || locationPath.startsWith(item.path + '/');

  return (
    <Tooltip key={item.path} delayDuration={50}>
      <TooltipTrigger asChild>
        <NavLink
          to={item.path}
          className={cn(
            'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 cursor-pointer overflow-hidden group',
            isActive
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
          )}
        >
          {isActive && (
            <motion.div
              layoutId="sidebar-active"
              className="absolute inset-0 rounded-lg bg-primary/10 border border-primary/20"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          <div className="relative flex items-center gap-3">
            <div
              className={cn(
                'flex items-center justify-center w-5 h-5 shrink-0 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4" />
            </div>
            {!collapsed && (
              <>
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto inline-flex items-center justify-center rounded-full bg-primary/20 text-primary text-[10px] font-bold px-1.5 min-w-[18px] h-[18px]">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </div>
        </NavLink>
      </TooltipTrigger>
      {collapsed && (
        <TooltipContent side="right" className="flex items-center gap-2">
          <span>{item.label}</span>
          {item.badge && (
            <span className="inline-flex items-center justify-center rounded-full bg-primary/20 text-primary text-[10px] font-bold px-1.5 min-w-[16px] h-4">
              {item.badge}
            </span>
          )}
        </TooltipContent>
      )}
    </Tooltip>
  );
}

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { activeOrganization } = useAuthStore();
  const location = useLocation();

  return (
    <TooltipProvider>
      <div
        className={cn(
          'relative flex flex-col border-r border-border/50 bg-sidebar transition-all duration-300 select-none h-screen sticky top-0 z-40',
          sidebarCollapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-14 items-center justify-between border-b border-border/50 px-3 shrink-0">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary shadow-lg shadow-primary/25">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-bold tracking-tight text-foreground">
                  SentinelFlow
                </span>
                {activeOrganization && (
                  <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                    {activeOrganization.name}
                  </span>
                )}
              </div>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className={cn(
              'rounded-lg p-1.5 hover:bg-accent text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer',
              sidebarCollapsed && 'mx-auto'
            )}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              {!sidebarCollapsed && (
                <div className="px-3 pb-1">
                  <span className="text-[10px] font-semibold tracking-wider text-muted-foreground/60 uppercase">
                    {group.label}
                  </span>
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavItem
                    key={item.path}
                    item={item}
                    collapsed={sidebarCollapsed}
                    locationPath={location.pathname}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-border/50 p-3 shrink-0">
          {!sidebarCollapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Live</span>
                </div>
                <span>v2.4.1</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

export default Sidebar;
