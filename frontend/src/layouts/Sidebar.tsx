import * as React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, AlertOctagon, Sparkles, Shield,
  BookOpen, Bell, Activity, Bot, FolderHeart,
  BarChart3, Network, Users, History, Terminal,
  Settings, ChevronLeft, ChevronRight, Cpu,
  Pin, Dot, Gauge, ScrollText, FileBarChart,
  Lightbulb, Eye, Lock,
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
import { motion, AnimatePresence } from 'framer-motion';

type NavItemDef = {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  color?: string;
};

type NavGroup = {
  label: string;
  items: NavItemDef[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Dashboard',
    items: [
      { label: 'Executive Dashboard', path: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Monitoring',
    items: [
      { label: 'Incidents', path: '/incidents', icon: AlertOctagon, badge: '3', color: '#EF4444' },
      { label: 'Live Monitoring', path: '/monitoring', icon: Activity, color: '#22C55E' },
    ],
  },
  {
    label: 'AI & Intelligence',
    items: [
      { label: 'AI Intelligence', path: '/intelligence', icon: Sparkles, color: '#A78BFA' },
      { label: 'Agents', path: '/agents', icon: Bot, color: '#60A5FA' },
      { label: 'Governance', path: '/governance', icon: Shield, color: '#F59E0B' },
      { label: 'Learning Center', path: '/learning', icon: Cpu, color: '#34D399' },
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
    label: 'Reports',
    items: [
      { label: 'Analytics', path: '/reports', icon: BarChart3 },
      { label: 'Audit Logs', path: '/audit', icon: History },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Organizations', path: '/organizations', icon: Network },
      { label: 'Users', path: '/users', icon: Users },
      { label: 'Platform', path: '/platform', icon: Terminal },
      { label: 'Settings', path: '/settings', icon: Settings },
    ],
  },
];

const RECENT_INCIDENTS = [
  { id: 'INC-203', title: 'DB connection pool exhausted', severity: 'critical' },
  { id: 'INC-202', title: 'API gateway latency spike', severity: 'high' },
  { id: 'INC-201', title: 'Certificate renewal failure', severity: 'medium' },
];

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#EF4444',
  high: '#F59E0B',
  medium: '#3B82F6',
  low: '#22C55E',
};

function NavItem({
  item,
  collapsed,
  locationPath,
}: {
  item: NavItemDef;
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
            'relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 cursor-pointer overflow-hidden group',
            isActive
              ? 'text-primary'
              : 'text-muted-foreground/70 hover:text-foreground hover:bg-accent/40'
          )}
        >
          {isActive && (
            <motion.div
              layoutId="sidebar-active"
              className="absolute inset-0 rounded-xl bg-primary/8 border border-primary/15"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <div className="relative flex items-center gap-2.5 w-full">
            <div
              className={cn(
                'flex items-center justify-center w-5 h-5 shrink-0 transition-colors rounded-lg',
                isActive ? 'text-primary' : 'text-muted-foreground/50 group-hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4" />
            </div>
            {!collapsed && (
              <>
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center justify-center rounded-full bg-primary/15 text-primary text-[9px] font-bold px-1.5 min-w-[18px] h-[18px]"
                  >
                    {item.badge}
                  </motion.span>
                )}
              </>
            )}
          </div>
        </NavLink>
      </TooltipTrigger>
      {collapsed && (
        <TooltipContent side="right" className="flex items-center gap-2 text-xs">
          <span>{item.label}</span>
          {item.badge && (
            <span className="inline-flex items-center justify-center rounded-full bg-primary/20 text-primary text-[9px] font-bold px-1.5 min-w-[16px] h-4">
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
      <motion.div
        className={cn(
          'relative flex flex-col border-r border-border/40 bg-sidebar select-none h-screen sticky top-0 z-40 shrink-0',
        )}
        animate={{ width: sidebarCollapsed ? 64 : 240 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Brand Header */}
        <div className="flex h-14 items-center justify-between border-b border-border/40 px-3 shrink-0">
          <AnimatePresence mode="wait">
            {!sidebarCollapsed ? (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2.5 overflow-hidden"
              >
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary shadow-lg shadow-primary/25 ring-1 ring-primary/20">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-bold tracking-tight text-foreground">
                    SentinelFlow
                  </span>
                  {activeOrganization && (
                    <span className="text-[9px] text-muted-foreground truncate max-w-[120px]">
                      {activeOrganization.name}
                    </span>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="collapsed"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="mx-auto"
              >
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary shadow-lg shadow-primary/25">
                  <Shield className="w-4 h-4 text-white" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={toggleSidebar}
            className={cn(
              'rounded-lg p-1.5 hover:bg-accent text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer shrink-0',
              sidebarCollapsed && 'mx-auto mt-2'
            )}
          >
            <motion.div
              animate={{ rotate: sidebarCollapsed ? 180 : 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </motion.div>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-4 scrollbar-none">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              {!sidebarCollapsed && (
                <motion.div
                  className="px-3 pb-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <span className="text-[9px] font-semibold tracking-widest text-muted-foreground/40 uppercase">
                    {group.label}
                  </span>
                </motion.div>
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

          {/* Pinned / Recent Incidents */}
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="pt-2"
            >
              <div className="px-3 pb-1 flex items-center gap-1.5">
                <Pin className="w-2.5 h-2.5 text-muted-foreground/40" />
                <span className="text-[9px] font-semibold tracking-widest text-muted-foreground/40 uppercase">
                  Recent Incidents
                </span>
              </div>
              <div className="space-y-0.5 px-1">
                {RECENT_INCIDENTS.map((inc) => (
                  <NavLink
                    key={inc.id}
                    to="/incidents"
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] text-muted-foreground/60 hover:text-foreground hover:bg-accent/30 transition-all cursor-pointer"
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: SEVERITY_COLORS[inc.severity] }}
                    />
                    <span className="truncate">{inc.title}</span>
                  </NavLink>
                ))}
              </div>
            </motion.div>
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-border/40 p-3 shrink-0">
          <AnimatePresence mode="wait">
            {!sidebarCollapsed ? (
              <motion.div
                key="expanded-footer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
                    <span>Live</span>
                  </div>
                  <span className="text-muted-foreground/40">v2.4.1</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-emerald-500/50" />
                  <div className="w-1 h-1 rounded-full bg-emerald-500/30" />
                  <div className="w-1 h-1 rounded-full bg-emerald-500/50" />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="collapsed-footer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}

export default Sidebar;
