import { Search, Bell, Sun, Moon, LogOut } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
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

export function TopBar() {
  const { theme, setTheme, setCommandPaletteOpen, setNotificationDrawerOpen } = useUIStore();
  const { user, activeOrganization, switchOrganization, logout } = useAuthStore();

  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-6 select-none sticky top-0 z-30">
      {/* Left: Command Search trigger */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex h-9 w-60 items-center justify-between rounded-md border bg-black/10 px-3 text-xs text-muted-foreground hover:bg-black/20 focus:outline-none cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5" />
            Search command palette...
          </span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right: Notifications, Theme, Tenant Selector, User Avatar */}
      <div className="flex items-center gap-4">
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

        {/* Tenant Organization Switcher */}
        {user && user.organizations.length > 0 && activeOrganization && (
          <div className="w-40">
            <Select value={activeOrganization.id} onValueChange={(val) => switchOrganization(val)}>
              <SelectTrigger className="h-8 text-xs bg-black/10">
                <SelectValue placeholder="Switch organization" />
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
              <Avatar className="h-8 w-8 border">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback className="text-xs">
                  {user.name.split(' ').map((n) => n[0]).join('')}
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
