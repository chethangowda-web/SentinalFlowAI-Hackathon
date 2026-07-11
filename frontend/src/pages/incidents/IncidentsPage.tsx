import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIncidents } from '@/hooks/useIncidents';
import { useRealtime } from '@/hooks/useRealtime';
import { CreateIncidentDialog } from './CreateIncidentDialog';
import { IncidentDetailsDrawer } from './IncidentDetailsDrawer';
import { RiskBadge } from '@/components/ai/RiskBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import {
  Plus, Search, CheckSquare, Square, ChevronUp, ChevronDown, AlertTriangle,
  Filter, Clock, ArrowUpDown, MoreHorizontal, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SortKey = 'title' | 'severity' | 'status' | 'service' | 'environment' | 'createdAt';
type SortDir = 'asc' | 'desc';

const SEVERITY_ORDER: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
const STATUS_ORDER: Record<string, number> = { OPEN: 0, ACKNOWLEDGED: 1, INVESTIGATING: 2, RESOLVED: 3, CLOSED: 4 };

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#EF4444',
  HIGH: '#F59E0B',
  MEDIUM: '#3B82F6',
  LOW: '#22C55E',
};

export function IncidentsPage() {
  useRealtime();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [severityFilter, setSeverityFilter] = React.useState<string>('ALL');
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');
  const [selectedIncidentId, setSelectedIncidentId] = React.useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = React.useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = React.useState<SortDir>('desc');

  const { incidents, isLoading, isError, refetch, createIncident, isCreating } = useIncidents();

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const filteredIncidents = React.useMemo(() => {
    return (incidents || [])
      .filter((inc) => {
        const matchesSearch = inc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inc.service.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSeverity = severityFilter === 'ALL' || inc.severity === severityFilter;
        const matchesStatus = statusFilter === 'ALL' || inc.status === statusFilter;
        return matchesSearch && matchesSeverity && matchesStatus;
      })
      .sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1;
        switch (sortKey) {
          case 'severity':
            return ((SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99)) * dir;
          case 'status':
            return ((STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99)) * dir;
          case 'title':
            return a.title.localeCompare(b.title) * dir;
          case 'service':
            return a.service.localeCompare(b.service) * dir;
          case 'environment':
            return a.environment.localeCompare(b.environment) * dir;
          case 'createdAt':
            return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
          default:
            return 0;
        }
      });
  }, [incidents, searchQuery, severityFilter, statusFilter, sortKey, sortDir]);

  const toggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
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

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) return null;
    return sortDir === 'asc' ? (
      <ChevronUp className="w-3 h-3 inline ml-0.5" />
    ) : (
      <ChevronDown className="w-3 h-3 inline ml-0.5" />
    );
  };

  const statusColors: Record<string, string> = {
    OPEN: 'bg-red-500/10 border-red-500/20 text-red-400',
    ACKNOWLEDGED: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    INVESTIGATING: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    RESOLVED: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    CLOSED: 'bg-muted border-border text-muted-foreground',
  };

  if (isLoading) {
    return (
      <div className="flex h-[80svh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">Loading incidents...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <motion.div
        className="flex flex-col h-[60vh] items-center justify-center space-y-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-4 rounded-full bg-destructive/10">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-foreground">Failed to load incidents</p>
          <p className="text-xs text-muted-foreground">Connection interrupted. Please try again.</p>
        </div>
        <Button onClick={() => refetch()} size="sm" variant="outline" className="cursor-pointer">
          Retry
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-5 max-w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Incident Management</h1>
          <p className="text-sm text-muted-foreground">Monitor, triage, and resolve operational alarms</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.div whileHover={{ scale: 1.02 }}>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="gap-1.5 text-xs h-9 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Report Incident
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4">
        <Badge variant="secondary" className="gap-1.5 text-xs px-3 py-1">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse-dot" />
          {filteredIncidents.filter((i) => i.status === 'OPEN').length} Open
        </Badge>
        <Badge variant="outline" className="text-xs px-3 py-1">
          {filteredIncidents.length} Total
        </Badge>
        <span className="text-[10px] text-muted-foreground">
          Last updated {new Date().toLocaleTimeString()}
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 bg-card border border-border/40 rounded-xl p-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
          <Input
            placeholder="Search by ID, title, or service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background text-xs h-9 border-border/40 focus:border-primary/30 rounded-lg"
          />
        </div>
        <div className="flex gap-2">
          <div className="w-36">
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="h-9 text-xs bg-background border-border/40 rounded-lg">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="ALL">All Severities</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-36">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 text-xs bg-background border-border/40 rounded-lg">
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
      </div>

      {/* Selection Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="flex items-center justify-between bg-primary/10 border border-primary/20 px-4 py-2.5 rounded-xl text-xs"
          >
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-primary" />
              <span className="font-medium text-foreground">{selectedIds.size} selected</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds(new Set())}
              className="h-7 text-xs cursor-pointer"
            >
              Clear selection
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Master-Detail Layout */}
      <div className="grid grid-cols-1 gap-0">
        {/* Master: Table */}
        <div className="border border-border/40 rounded-xl bg-card/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="enterprise-table">
              <thead>
                <tr className="bg-muted/10">
                  <th className="w-10 text-center">
                    <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                      {selectedIds.size === filteredIncidents.length && filteredIncidents.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="cursor-pointer hover:text-foreground transition-colors" onClick={() => toggleSort('title')}>
                    <div className="flex items-center gap-1">
                      Incident
                      <ArrowUpDown className="w-3 h-3 opacity-50" />
                    </div>
                  </th>
                  <th className="cursor-pointer hover:text-foreground transition-colors" onClick={() => toggleSort('severity')}>
                    Severity <SortIcon columnKey="severity" />
                  </th>
                  <th className="cursor-pointer hover:text-foreground transition-colors" onClick={() => toggleSort('status')}>
                    Status <SortIcon columnKey="status" />
                  </th>
                  <th className="cursor-pointer hover:text-foreground transition-colors" onClick={() => toggleSort('service')}>
                    Service <SortIcon columnKey="service" />
                  </th>
                  <th className="cursor-pointer hover:text-foreground transition-colors" onClick={() => toggleSort('environment')}>
                    Environment <SortIcon columnKey="environment" />
                  </th>
                  <th className="cursor-pointer hover:text-foreground transition-colors" onClick={() => toggleSort('createdAt')}>
                    Age <SortIcon columnKey="createdAt" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredIncidents.length > 0 ? (
                  filteredIncidents.map((inc, idx) => (
                    <motion.tr
                      key={inc.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      onClick={() => setSelectedIncidentId(inc.id)}
                      className={cn(
                        'cursor-pointer transition-all border-b border-border/20',
                        selectedIncidentId === inc.id ? 'bg-primary/5' : 'hover:bg-accent/20'
                      )}
                    >
                      <td className="text-center" onClick={(e) => toggleSelectRow(inc.id, e)}>
                        <button className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                          {selectedIds.has(inc.id) ? (
                            <CheckSquare className="w-4 h-4 text-primary" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-1 h-8 rounded-full shrink-0"
                            style={{ backgroundColor: SEVERITY_COLORS[inc.severity] || '#6B7280' }}
                          />
                          <div>
                            <span className="font-mono text-[10px] text-muted-foreground block">{inc.id}</span>
                            <span className="font-semibold text-foreground text-sm">{inc.title}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <RiskBadge level={inc.severity} />
                      </td>
                      <td>
                        <span className={cn('px-2 py-0.5 rounded text-[10px] font-semibold border inline-block', statusColors[inc.status] || '')}>
                          {inc.status}
                        </span>
                      </td>
                      <td>
                        <code className="text-[11px] text-foreground font-mono bg-accent/20 px-1.5 py-0.5 rounded">{inc.service}</code>
                      </td>
                      <td>
                        <Badge variant="outline" className="text-[10px] font-mono border-border/30">
                          {inc.environment}
                        </Badge>
                      </td>
                      <td className="text-muted-foreground text-[10px] whitespace-nowrap font-mono">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          {inc.createdAt.includes('ago') ? inc.createdAt : new Date(inc.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7}>
                      <motion.div
                        className="flex flex-col items-center justify-center py-16 gap-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <div className="empty-state-illustration">
                          <AlertCircle className="w-8 h-8 text-muted-foreground/40" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">No incidents found</p>
                        <p className="text-xs text-muted-foreground text-center max-w-xs">
                          {searchQuery || severityFilter !== 'ALL' || statusFilter !== 'ALL'
                            ? 'Try adjusting your search or filter criteria'
                            : 'No incidents have been reported yet. Your systems are healthy.'}
                        </p>
                        {(searchQuery || severityFilter !== 'ALL' || statusFilter !== 'ALL') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setSearchQuery(''); setSeverityFilter('ALL'); setStatusFilter('ALL'); }}
                            className="text-xs cursor-pointer"
                          >
                            Clear Filters
                          </Button>
                        )}
                      </motion.div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
    </motion.div>
  );
}

export default IncidentsPage;
