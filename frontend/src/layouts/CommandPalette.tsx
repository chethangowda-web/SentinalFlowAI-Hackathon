import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { incidentApi } from '@/api/incident';
import { runbookApi } from '@/api/runbook';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import {
  LayoutDashboard, AlertOctagon, Sparkles, Shield,
  Bot, BookOpen, Bell, Activity, Settings, Users, Cpu,
  Sun, Moon, LogOut, Search, Command, ArrowRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen, theme, setTheme } = useUIStore();
  const { user, switchOrganization, logout } = useAuthStore();
  const navigate = useNavigate();
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  const incidentsQuery = useQuery({
    queryKey: ['search', 'incidents'],
    queryFn: () => incidentApi.getIncidents(),
    enabled: commandPaletteOpen,
  });

  const runbooksQuery = useQuery({
    queryKey: ['search', 'runbooks'],
    queryFn: () => runbookApi.listRunbooks(),
    enabled: commandPaletteOpen,
  });

  const agentsQuery = useQuery({
    queryKey: ['search', 'agents'],
    queryFn: async () => {
      const res = await apiClient.get<any[]>(endpoints.agents.list);
      return res.data;
    },
    enabled: commandPaletteOpen,
  });

  const handleNavigate = (path: string) => {
    navigate(path);
    setCommandPaletteOpen(false);
  };

  const filteredIncidents = React.useMemo(() => {
    const list = incidentsQuery.data || [];
    if (!search) return list.slice(0, 3);
    return list.filter(i =>
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.id.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 5);
  }, [incidentsQuery.data, search]);

  const filteredRunbooks = React.useMemo(() => {
    const list = runbooksQuery.data || [];
    if (!search) return list.slice(0, 3);
    return list.filter(r =>
      r.name.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 5);
  }, [runbooksQuery.data, search]);

  const filteredAgents = React.useMemo(() => {
    const list = agentsQuery.data || [];
    if (!search) return list.slice(0, 3);
    return list.filter((a: any) =>
      a.name?.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 5);
  }, [agentsQuery.data, search]);

  return (
    <CommandDialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <div className="flex items-center border-b border-border/40 px-3">
        <Search className="w-4 h-4 text-muted-foreground/50 shrink-0" />
        <CommandInput
          placeholder="Search pages, incidents, runbooks, agents..."
          value={search}
          onValueChange={setSearch}
          className="border-0 focus:ring-0 text-xs h-11"
        />
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-accent/40 border border-border/30 text-[9px] font-mono text-muted-foreground/50 shrink-0">
          ESC
        </kbd>
      </div>
      <CommandList className="text-xs max-h-[400px] overflow-y-auto">
        <CommandEmpty className="py-8 text-center">
          <div className="flex flex-col items-center gap-2">
            <Search className="w-5 h-5 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No results found</p>
            <p className="text-[10px] text-muted-foreground/50">Try a different search term</p>
          </div>
        </CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => handleNavigate('/dashboard')} className="gap-2 py-2">
            <LayoutDashboard className="w-4 h-4 text-primary" />
            <span>Executive Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate('/incidents')} className="gap-2 py-2">
            <AlertOctagon className="w-4 h-4 text-red-400" />
            <span>Incident Management</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate('/intelligence')} className="gap-2 py-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>AI Intelligence</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate('/governance')} className="gap-2 py-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>Enkrypt Governance</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate('/learning')} className="gap-2 py-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Learning Center</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate('/agents')} className="gap-2 py-2">
            <Bot className="w-4 h-4 text-blue-400" />
            <span>Agent Pipeline</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate('/runbooks')} className="gap-2 py-2">
            <BookOpen className="w-4 h-4 text-violet-400" />
            <span>Runbooks</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate('/monitoring')} className="gap-2 py-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Live Monitoring</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate('/settings')} className="gap-2 py-2">
            <Settings className="w-4 h-4 text-muted-foreground" />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>

        {filteredIncidents.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Incidents">
              {filteredIncidents.map(inc => (
                <CommandItem key={inc.id} onSelect={() => handleNavigate(`/incidents?id=${inc.id}`)} className="gap-2 py-1.5">
                  <AlertOctagon className="w-3 h-3 text-muted-foreground" />
                  <span className="font-mono text-muted-foreground text-[9px]">{inc.id}</span>
                  <span className="flex-1 truncate">{inc.title}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground/40" />
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {filteredRunbooks.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Runbooks">
              {filteredRunbooks.map(rb => (
                <CommandItem key={rb.id} onSelect={() => handleNavigate('/runbooks')} className="gap-2 py-1.5">
                  <BookOpen className="w-3 h-3 text-muted-foreground" />
                  <span className="flex-1 truncate">{rb.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {filteredAgents.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Agents">
              {filteredAgents.map((ag: any) => (
                <CommandItem key={ag.id} onSelect={() => handleNavigate('/agents')} className="gap-2 py-1.5">
                  <Bot className="w-3 h-3 text-muted-foreground" />
                  <span className="flex-1 truncate">{ag.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); setCommandPaletteOpen(false); }} className="gap-2 py-2">
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-violet-400" />}
            Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </CommandItem>
          <CommandItem onSelect={() => { logout(); setCommandPaletteOpen(false); }} className="gap-2 py-2 text-red-400">
            <LogOut className="w-4 h-4" />
            Sign Out
          </CommandItem>
        </CommandGroup>

        {user && user.organizations.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Switch Organization">
              {user.organizations.map((org) => (
                <CommandItem key={org.id} onSelect={() => { switchOrganization(org.id); setCommandPaletteOpen(false); }} className="gap-2 py-2">
                  <Users className="w-3 h-3 text-muted-foreground" />
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary">
                      {org.name.charAt(0)}
                    </div>
                    <span>{org.name}</span>
                  </div>
                  <Badge variant="outline" className="text-[8px] px-1 py-0">{org.role}</Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

export default CommandPalette;
