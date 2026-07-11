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
  LayoutDashboard,
  AlertOctagon,
  Sparkles,
  Shield,
  Bot,
  BookOpen,
  Bell,
  Activity,
  Settings,
  Users,
  Cpu,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react';

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
      <CommandInput
        placeholder="Type a command or search..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList className="text-xs">
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => handleNavigate('/dashboard')}>
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Dashboard
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate('/incidents')}>
            <AlertOctagon className="w-4 h-4 mr-2" />
            Incidents
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate('/intelligence')}>
            <Sparkles className="w-4 h-4 mr-2" />
            AI Intelligence
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate('/governance')}>
            <Shield className="w-4 h-4 mr-2" />
            Enkrypt Governance
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate('/learning')}>
            <Cpu className="w-4 h-4 mr-2" />
            Learning Center
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate('/agents')}>
            <Bot className="w-4 h-4 mr-2" />
            Agents
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate('/runbooks')}>
            <BookOpen className="w-4 h-4 mr-2" />
            Runbooks
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate('/monitoring')}>
            <Activity className="w-4 h-4 mr-2" />
            Monitoring
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate('/notifications')}>
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate('/settings')}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {filteredIncidents.length > 0 && (
          <CommandGroup heading="Incidents">
            {filteredIncidents.map(inc => (
              <CommandItem
                key={inc.id}
                onSelect={() => handleNavigate(`/incidents?id=${inc.id}`)}
              >
                <AlertOctagon className="w-3 h-3 mr-2 text-muted-foreground" />
                <span className="font-mono text-muted-foreground mr-2 text-[10px]">{inc.id}</span>
                {inc.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredRunbooks.length > 0 && (
          <CommandGroup heading="Runbooks">
            {filteredRunbooks.map(rb => (
              <CommandItem
                key={rb.id}
                onSelect={() => handleNavigate('/runbooks')}
              >
                <BookOpen className="w-3 h-3 mr-2 text-muted-foreground" />
                {rb.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredAgents.length > 0 && (
          <CommandGroup heading="Agents">
            {filteredAgents.map((ag: any) => (
              <CommandItem
                key={ag.id}
                onSelect={() => handleNavigate('/agents')}
              >
                <Bot className="w-3 h-3 mr-2 text-muted-foreground" />
                {ag.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); setCommandPaletteOpen(false); }}>
            {theme === 'dark' ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
            Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </CommandItem>
          <CommandItem onSelect={() => { logout(); setCommandPaletteOpen(false); }}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </CommandItem>
        </CommandGroup>

        {user && user.organizations.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Switch Organization">
              {user.organizations.map((org) => (
                <CommandItem
                  key={org.id}
                  onSelect={() => {
                    switchOrganization(org.id);
                    setCommandPaletteOpen(false);
                  }}
                >
                  <Users className="w-3 h-3 mr-2 text-muted-foreground" />
                  {org.name}
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
