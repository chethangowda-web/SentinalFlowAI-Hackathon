import * as React from 'react';
import { useIncidents } from '@/hooks/useIncidents';
import { useRealtime } from '@/hooks/useRealtime';
import { CreateIncidentDialog } from './CreateIncidentDialog';
import { IncidentDetailsDrawer } from './IncidentDetailsDrawer';
import { RiskBadge } from '@/components/ai/RiskBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { Plus, Search, CheckSquare, Square, CheckCircle2 } from 'lucide-react';

export function IncidentsPage() {
  useRealtime();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [severityFilter, setSeverityFilter] = React.useState<string>('ALL');
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');
  const [selectedIncidentId, setSelectedIncidentId] = React.useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  const { incidents, isLoading, isError, refetch, createIncident, isCreating } = useIncidents();

  const filteredIncidents = React.useMemo(() => {
    return incidents.filter((inc) => {
      const matchesSearch = inc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.service.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSeverity = severityFilter === 'ALL' || inc.severity === severityFilter;
      const matchesStatus = statusFilter === 'ALL' || inc.status === statusFilter;

      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }, [incidents, searchQuery, severityFilter, statusFilter]);

  const toggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredIncidents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredIncidents.map((i) => i.id)));
    }
  };

  const handleCreateSubmit = async (values: any) => {
    await createIncident(values);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex h-[80svh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col h-[80svh] items-center justify-center space-y-4">
        <p className="text-sm text-red-400 font-semibold font-mono">Failed to load incident database</p>
        <Button onClick={() => refetch()} size="sm" className="bg-purple-600 hover:bg-purple-700 text-white cursor-pointer">
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 font-mono">Incidents Console</h1>
          <p className="text-xs text-muted-foreground">Monitor and lifecycle manage incoming telemetry alarms</p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5 text-xs h-9 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Report Incident
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-3 bg-card/40 p-3 border rounded-md">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID, title, or service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-black/10 text-xs h-9 border-border"
          />
        </div>

        <div className="w-full md:w-40">
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="h-9 text-xs bg-black/10 border-border">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="ALL">All Severities</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-40">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-xs bg-black/10 border-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
              <SelectItem value="INVESTIGATING">Investigating</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-purple-950/20 border border-purple-500/30 px-4 py-2.5 rounded-md text-xs text-purple-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
            <span>{selectedIds.size} incidents selected</span>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedIds(new Set())}
              className="h-8 text-[11px] border-purple-500/25 hover:bg-purple-950/40 text-purple-300 cursor-pointer"
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      <div className="border rounded-md bg-card/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b bg-muted/20 text-muted-foreground font-semibold">
                <th className="p-3 w-10 text-center">
                  <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-foreground cursor-pointer">
                    {selectedIds.size === filteredIncidents.length && filteredIncidents.length > 0 ? (
                      <CheckSquare className="w-4.5 h-4.5 text-purple-500" />
                    ) : (
                      <Square className="w-4.5 h-4.5" />
                    )}
                  </button>
                </th>
                <th className="p-3">Incident</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Status</th>
                <th className="p-3">Service Target</th>
                <th className="p-3">Environment</th>
                <th className="p-3">Age</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.length > 0 ? (
                filteredIncidents.map((inc) => (
                  <tr
                    key={inc.id}
                    onClick={() => setSelectedIncidentId(inc.id)}
                    className="border-b hover:bg-muted/10 cursor-pointer transition-colors"
                  >
                    <td className="p-3 text-center" onClick={(e) => toggleSelectRow(inc.id, e)}>
                      <button className="text-muted-foreground hover:text-foreground cursor-pointer">
                        {selectedIds.has(inc.id) ? (
                          <CheckSquare className="w-4.5 h-4.5 text-purple-500" />
                        ) : (
                          <Square className="w-4.5 h-4.5" />
                        )}
                      </button>
                    </td>
                    <td className="p-3">
                      <div>
                        <span className="font-mono text-[10px] text-muted-foreground block">{inc.id}</span>
                        <span className="font-semibold text-slate-200">{inc.title}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <RiskBadge level={inc.severity} />
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        inc.status === 'OPEN' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                        inc.status === 'ACKNOWLEDGED' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                        inc.status === 'INVESTIGATING' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                        'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      }`}>
                        {inc.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-300">{inc.service}</td>
                    <td className="p-3 capitalize">{inc.environment}</td>
                    <td className="p-3 text-muted-foreground text-[10px] whitespace-nowrap">
                      {inc.createdAt.includes('ago') ? inc.createdAt : new Date(inc.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No active telemetry alarms matching the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateIncidentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateSubmit}
        loading={isCreating}
      />

      <IncidentDetailsDrawer
        incidentId={selectedIncidentId}
        onClose={() => setSelectedIncidentId(null)}
      />
    </div>
  );
}

export default IncidentsPage;
