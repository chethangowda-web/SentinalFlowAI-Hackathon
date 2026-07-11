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

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const { user, switchOrganization } = useAuthStore();
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
          <CommandItem onSelect={() => handleNavigate('/dashboard')}>Go to Dashboard</CommandItem>
          <CommandItem onSelect={() => handleNavigate('/incidents')}>Go to Incidents</CommandItem>
          <CommandItem onSelect={() => handleNavigate('/intelligence')}>Go to AI Intelligence</CommandItem>
          <CommandItem onSelect={() => handleNavigate('/runbooks')}>Go to Runbooks</CommandItem>
          <CommandItem onSelect={() => handleNavigate('/agents')}>Go to Agents</CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {filteredIncidents.length > 0 && (
          <CommandGroup heading="Matching Incidents">
            {filteredIncidents.map(inc => (
              <CommandItem
                key={inc.id}
                onSelect={() => handleNavigate(`/incidents?id=${inc.id}`)}
              >
                <span className="font-mono text-muted-foreground mr-2">{inc.id}</span>
                {inc.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        {filteredRunbooks.length > 0 && (
          <CommandGroup heading="Matching Runbooks">
            {filteredRunbooks.map(rb => (
              <CommandItem
                key={rb.id}
                onSelect={() => handleNavigate('/runbooks')}
              >
                {rb.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        {filteredAgents.length > 0 && (
          <CommandGroup heading="Matching Agents">
            {filteredAgents.map((ag: any) => (
              <CommandItem
                key={ag.id}
                onSelect={() => handleNavigate('/agents')}
              >
                {ag.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        {user && user.organizations.length > 0 && (
          <CommandGroup heading="Switch Organization">
            {user.organizations.map((org) => (
              <CommandItem
                key={org.id}
                onSelect={() => {
                  switchOrganization(org.id);
                  setCommandPaletteOpen(false);
                }}
              >
                Switch to {org.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

export default CommandPalette;
