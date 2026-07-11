import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Download, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDuration, formatNumber } from '@/utils/formatters';
import { reportsApi, type ReportData, type ReportFilters } from '../api/reportsApi';

function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}

function getMonthAgoISO() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().split('T')[0];
}

function exportCSV(data: ReportData) {
  const headers = ['ID', 'Title', 'Severity', 'Status', 'Service', 'Created At'];
  const rows = data.incidents.map((inc) => [
    inc.id,
    inc.title,
    inc.severity,
    inc.status,
    inc.service,
    inc.createdAt,
  ]);
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `incident-report-${data.dateRange.start}-to-${data.dateRange.end}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportPDF() {
  window.print();
}

export function ReportsPage() {
  const [filters, setFilters] = React.useState<ReportFilters>({
    startDate: getMonthAgoISO(),
    endDate: getTodayISO(),
  });
  const [shouldFetch, setShouldFetch] = React.useState(false);

  const { data: report, isLoading, isError, isFetching } = useQuery({
    queryKey: ['reports', filters],
    queryFn: () => reportsApi.getReportData(filters),
    enabled: shouldFetch,
  });

  const handleGenerate = () => {
    setShouldFetch(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Incident Reports</h1>
        <p className="text-sm text-muted-foreground">Export and analyze platform security diagnostics metrics</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">Report Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="startDate" className="text-xs text-muted-foreground">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endDate" className="text-xs text-muted-foreground">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                className="h-9 text-xs"
              />
            </div>
            <Button
              size="sm"
              onClick={handleGenerate}
              disabled={isFetching}
              className="h-9 gap-1.5"
            >
              {isFetching ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {isError && (
        <Card className="bg-card border-border">
          <CardContent className="py-8 text-xs text-muted-foreground text-center">
            Failed to generate report. Please try again later.
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {report && !isLoading && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="p-5 text-center space-y-1">
                <div className="text-2xl font-bold text-foreground">{formatNumber(report.totalIncidents)}</div>
                <div className="text-[10px] text-muted-foreground">Total Incidents</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-5 text-center space-y-1">
                <div className="text-2xl font-bold text-emerald-400">{formatNumber(report.resolvedIncidents)}</div>
                <div className="text-[10px] text-muted-foreground">Resolved</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-5 text-center space-y-1">
                <div className="text-2xl font-bold text-foreground">{formatDuration(report.averageResolutionTimeMs)}</div>
                <div className="text-[10px] text-muted-foreground">Avg Resolution Time</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-5 text-center space-y-1">
                <div className="text-2xl font-bold text-purple-400">{report.averageAiConfidence.toFixed(1)}%</div>
                <div className="text-[10px] text-muted-foreground">Avg AI Confidence</div>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-3">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={() => exportCSV(report)}
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={exportPDF}
            >
              <Download className="w-3.5 h-3.5" />
              Export PDF
            </Button>
          </div>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-foreground">
                Incident List ({report.incidents.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border text-xs">
                {report.incidents.length === 0 ? (
                  <div className="py-8 text-xs text-muted-foreground text-center">
                    No incidents found for the selected date range.
                  </div>
                ) : (
                  report.incidents.map((inc) => (
                    <div key={inc.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/30">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                          {inc.id}
                        </span>
                        <span className="text-foreground truncate">{inc.title}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`font-mono text-[10px] ${
                          inc.severity === 'CRITICAL' ? 'text-red-400'
                          : inc.severity === 'HIGH' ? 'text-orange-400'
                          : inc.severity === 'MEDIUM' ? 'text-yellow-400'
                          : 'text-blue-400'
                        }`}>
                          {inc.severity}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {inc.status}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(inc.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!report && !isLoading && !isError && !isFetching && (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-xs text-muted-foreground text-center">
            Select a date range and click Generate Report to view incident data.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ReportsPage;
