import { Bell, Sun, Moon, LogOut, Cpu } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useRealtimeStore } from '@/store/realtimeStore';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/incidents': 'Incidents',
  '/intelligence': 'AI Intelligence',
  '/agents': 'Agents',
  '/governance': 'Enkrypt Governance',
  '/learning': 'Learning Center',
  '/runbooks': 'Runbooks',
  '/notifications': 'Notifications',
  '/monitoring': 'Monitoring',
  '/knowledge': 'Knowledge Base',
  '/reports': 'Reports',
  '/organizations': 'Organizations',
  '/users': 'Users',
  '/audit': 'Audit Logs',
  '/platform': 'Platform',
  '/settings': 'Settings',
};

export function TopBar() {
  const { theme, setTheme, setNotificationDrawerOpen } = useUIStore();
  const { user, activeOrganization, switchOrganization, logout } = useAuthStore();
  const { connected: wsConnected } = useRealtimeStore();
  const location = useLocation();

  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const currentPage = PAGE_TITLES[location.pathname] || 'Dashboard';

  return (
    <header className="flex h-14 items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-xl px-6 select-none sticky top-0 z-30 shrink-0">
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">SentinelFlow</span>
          <span className="text-muted-foreground/40">/</span>
          <span className="font-semibold text-foreground">{currentPage}</span>
        </div>
      </div>

      {/* Right: Status + Actions */}
      <div className="flex items-center gap-3">
        {/* Live Status Indicators */}
        <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-accent/30 border border-border/30">
          <div className="flex items-center gap-1.5">
            <div className={cn('w-2 h-2 rounded-full', wsConnected ? 'bg-emerald-500' : 'bg-red-500')} />
            <span className="text-[11px] text-muted-foreground font-medium">
              {wsConnected ? 'Realtime' : 'Offline'}
            </span>
          </div>
          <div className="w-px h-3 bg-border" />
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] text-muted-foreground font-medium">API</span>
          </div>
          <div className="w-px h-3 bg-border" />
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3 h-3 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground font-medium">4 Agents</span>
          </div>
        </div>

        {/* Theme Toggle */}
        <Button onClick={handleThemeToggle} variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground cursor-pointer">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Notification Bell */}
        <Button
          onClick={() => setNotificationDrawerOpen(true)}
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground relative cursor-pointer"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-red-500" />
        </Button>

        {/* Organization Selector */}
        {user && user.organizations.length > 0 && activeOrganization && (
          <div className="w-36">
            <Select value={activeOrganization.id} onValueChange={(val) => switchOrganization(val)}>
              <SelectTrigger className="h-8 text-xs bg-accent/30 border-border/50">
                <SelectValue placeholder="Org" />
              </SelectTrigger>
              <SelectContent>
                {user.organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id} className="text-xs">
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* User Profile Dropdown */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none cursor-pointer">
              <Avatar className="h-8 w-8 border border-border/50 ring-1 ring-primary/10 hover:ring-primary/30 transition-all">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 text-xs">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="font-semibold text-foreground">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-400 focus:text-red-400 gap-2 cursor-pointer">
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}

export default TopBar;
