import { useState, useEffect } from 'react';
import {
  Bell, Sun, Moon, LogOut, Cpu, Cloud, Globe, Search, ChevronDown,
  Zap, Users, Radio, ShieldCheck, Sparkles, Clock, Command, Settings,
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useRealtimeStore } from '@/store/realtimeStore';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const ENVIRONMENTS = [
  { value: 'production', label: 'Production', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  { value: 'staging', label: 'Staging', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  { value: 'development', label: 'Development', color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
];

const CLOUD_PROVIDERS = [
  { value: 'aws', label: 'AWS' },
  { value: 'gcp', label: 'GCP' },
  { value: 'azure', label: 'Azure' },
];

const AI_MODELS = [
  { value: 'groq/llama-3.3-70b', label: 'Llama 3.3 70B' },
  { value: 'groq/llama-3.1-8b', label: 'Llama 3.1 8B' },
  { value: 'groq/mixtral-8x7b', label: 'Mixtral 8x7B' },
];

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <span className="text-xs text-muted-foreground font-mono tabular-nums">
      {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </span>
  );
}

export function TopBar() {
  const {
    theme, setTheme, setNotificationDrawerOpen, setCommandPaletteOpen,
    environment, setEnvironment, cloudProvider, setCloudProvider, aiModel, setAiModel,
  } = useUIStore();
  const { user, activeOrganization, switchOrganization, logout } = useAuthStore();
  const { connected: wsConnected } = useRealtimeStore();
  const currentEnv = ENVIRONMENTS.find(e => e.value === environment) || ENVIRONMENTS[0];
  const currentCloud = CLOUD_PROVIDERS.find(c => c.value === cloudProvider) || CLOUD_PROVIDERS[0];
  const currentModel = AI_MODELS.find(m => m.value === aiModel) || AI_MODELS[0];

  return (
    <motion.header
      className="flex h-14 items-center justify-between border-b border-border/40 bg-background/70 backdrop-blur-2xl px-5 select-none sticky top-0 z-30 shrink-0"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 text-sm mr-2">
          <span className="text-muted-foreground/60 font-medium">SentinelFlow</span>
          <span className="text-muted-foreground/30">/</span>
          <span className="font-semibold text-foreground text-sm">Executive Dashboard</span>
        </div>

        <div className="hidden lg:flex items-center gap-2">
          <div className="w-px h-4 bg-border/50" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider border transition-all cursor-pointer',
                currentEnv.color
              )}>
                <Zap className="w-2.5 h-2.5" />
                {currentEnv.label}
                <ChevronDown className="w-2.5 h-2.5 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-36 text-xs">
              <DropdownMenuLabel className="text-[10px] text-muted-foreground font-normal">Environment</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ENVIRONMENTS.map(env => (
                <DropdownMenuItem key={env.value} onClick={() => setEnvironment(env.value)} className="cursor-pointer text-xs">
                  <div className={cn('w-1.5 h-1.5 rounded-full mr-2', env.color.split(' ')[0])} />
                  {env.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium text-muted-foreground border border-border/30 bg-accent/20 hover:bg-accent/40 transition-all cursor-pointer">
                <Cloud className="w-2.5 h-2.5" />
                {currentCloud.label}
                <ChevronDown className="w-2.5 h-2.5 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-28 text-xs">
              <DropdownMenuLabel className="text-[10px] text-muted-foreground font-normal">Provider</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {CLOUD_PROVIDERS.map(p => (
                <DropdownMenuItem key={p.value} onClick={() => setCloudProvider(p.value)} className="cursor-pointer text-xs">
                  <Cloud className="w-3 h-3 mr-2" />
                  {p.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium text-muted-foreground border border-border/30 bg-accent/20 hover:bg-accent/40 transition-all cursor-pointer">
                <Sparkles className="w-2.5 h-2.5" />
                {currentModel.label}
                <ChevronDown className="w-2.5 h-2.5 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40 text-xs">
              <DropdownMenuLabel className="text-[10px] text-muted-foreground font-normal">AI Model</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {AI_MODELS.map(m => (
                <DropdownMenuItem key={m.value} onClick={() => setAiModel(m.value)} className="cursor-pointer text-xs">
                  <Sparkles className="w-3 h-3 mr-2 text-primary" />
                  {m.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/30 bg-accent/20 hover:bg-accent/40 hover:border-border/60 transition-all text-xs text-muted-foreground w-56 cursor-pointer group"
        >
          <Search className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-muted-foreground transition-colors" />
          <span className="flex-1 text-left text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">Search anything...</span>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-accent/40 border border-border/30 text-[9px] font-mono text-muted-foreground/60">
            <Command className="w-2.5 h-2.5" />K
          </kbd>
        </button>

        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-accent/20 border border-border/30">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
            <span className="text-[9px] text-muted-foreground font-medium">API</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
            <span className="text-[9px] text-muted-foreground font-medium">4 Agents</span>
          </div>
        </div>

        <div className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-semibold uppercase tracking-wider border transition-all',
          wsConnected
            ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
            : 'text-red-400 border-red-500/20 bg-red-500/10'
        )}>
          <div className={cn('w-1.5 h-1.5 rounded-full', wsConnected ? 'bg-emerald-400 animate-pulse-dot' : 'bg-red-400')} />
          {wsConnected ? 'Live' : 'Disconnected'}
        </div>

        <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 text-muted-foreground/60">
          <Clock className="w-3 h-3" />
          <LiveClock />
        </div>

        <Button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer">
          {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </Button>

        <Button
          onClick={() => setNotificationDrawerOpen(true)}
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground relative cursor-pointer"
        >
          <Bell className="h-3.5 w-3.5" />
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
            <span className="relative rounded-full bg-red-500 h-2 w-2" />
          </span>
        </Button>

        {user && user.organizations.length > 0 && activeOrganization && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium text-muted-foreground border border-border/30 bg-accent/20 hover:bg-accent/40 transition-all cursor-pointer">
                <Users className="w-3 h-3" />
                <span className="max-w-[80px] truncate">{activeOrganization.name}</span>
                <ChevronDown className="w-2.5 h-2.5 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 text-xs">
              <DropdownMenuLabel className="text-[10px] text-muted-foreground font-normal">Switch Organization</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {user.organizations.map((org) => (
                <DropdownMenuItem key={org.id} onClick={() => switchOrganization(org.id)} className="cursor-pointer text-xs">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary">
                      {org.name.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">{org.name}</span>
                      <span className="text-[9px] text-muted-foreground">{org.role}</span>
                    </div>
                  </div>
                  {org.id === activeOrganization.id && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none cursor-pointer">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Avatar className="h-7 w-7 border border-border/40 ring-1 ring-primary/10 hover:ring-primary/30 transition-all">
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                    {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 text-xs">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="font-semibold text-foreground text-sm">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-400 focus:text-red-400 gap-2 cursor-pointer text-xs">
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </motion.header>
  );
}

export default TopBar;
