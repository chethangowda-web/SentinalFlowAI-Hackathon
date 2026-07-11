import * as React from 'react';
import { Calendar, Server, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDashboardFilters } from '../hooks/useDashboardFilters';

export function FiltersPanel({ onRefresh }: { onRefresh?: () => void }) {
  const { filters, setFilters, resetFilters } = useDashboardFilters();

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 border rounded-lg bg-card/40 select-none">
      {/* Time Range */}
      <div className="flex items-center gap-1.5">
        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
        <Select
          value={filters.timeRange}
          onValueChange={(val) => setFilters({ timeRange: val as any })}
        >
          <SelectTrigger className="h-8 w-28 text-xs bg-muted/20 border-border">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent className="text-xs">
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Environment */}
      <div className="flex items-center gap-1.5">
        <Server className="w-3.5 h-3.5 text-muted-foreground" />
        <Select
          value={filters.environment}
          onValueChange={(val) => setFilters({ environment: val as any })}
        >
          <SelectTrigger className="h-8 w-28 text-xs bg-muted/20 border-border">
            <SelectValue placeholder="Environment" />
          </SelectTrigger>
          <SelectContent className="text-xs">
            <SelectItem value="all">All Envs</SelectItem>
            <SelectItem value="dev">Development</SelectItem>
            <SelectItem value="staging">Staging</SelectItem>
            <SelectItem value="production">Production</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Severity */}
      <div className="flex items-center gap-1.5">
        <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground" />
        <Select
          value={filters.severity}
          onValueChange={(val) => setFilters({ severity: val as any })}
        >
          <SelectTrigger className="h-8 w-28 text-xs bg-muted/20 border-border">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent className="text-xs">
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Actions */}
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={resetFilters}
          className="h-8 text-xs px-3 border-border cursor-pointer hover:bg-muted/30"
        >
          Reset Filters
        </Button>
        {onRefresh && (
          <Button
            size="sm"
            onClick={onRefresh}
            className="h-8 w-8 p-0 bg-purple-600 hover:bg-purple-700 text-white cursor-pointer flex items-center justify-center rounded"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default FiltersPanel;
