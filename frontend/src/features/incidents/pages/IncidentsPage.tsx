import * as React from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataGrid } from '@/components/data/DataGrid';
import { SimilarityCard } from '@/components/ai/SimilarityCard';
import { AIConfidenceCard } from '@/components/ai/AIConfidenceCard';
import { ReasoningViewer } from '@/components/ai/ReasoningViewer';
import { RiskBadge } from '@/components/ai/RiskBadge';

interface Incident {
  id: string;
  title: string;
  status: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;
}

const MOCK_INCIDENTS: Incident[] = [
  { id: 'INC-101', title: 'Pod connection timeout on cluster auth-db-primary', status: 'OPEN', severity: 'CRITICAL', createdAt: '10 mins ago' },
  { id: 'INC-102', title: 'Webhook callback queue payload size limit warning', status: 'ACKNOWLEDGED', severity: 'HIGH', createdAt: '25 mins ago' },
  { id: 'INC-103', title: 'Mastra task memory leak threshold reached', status: 'INVESTIGATING', severity: 'MEDIUM', createdAt: '1 hour ago' },
  { id: 'INC-104', title: 'SMTP email template validation formatting error', status: 'RESOLVED', severity: 'LOW', createdAt: '4 hours ago' },
];

export function IncidentsPage() {
  const [selectedIncident, setSelectedIncident] = React.useState<Incident | null>(MOCK_INCIDENTS[0]);

  const columns: ColumnDef<Incident>[] = [
    { accessorKey: 'id', header: 'ID', size: 80 },
    { accessorKey: 'title', header: 'Incident Summary', size: 300 },
    {
      accessorKey: 'severity',
      header: 'Severity',
      size: 100,
      cell: ({ row }) => <RiskBadge level={row.original.severity} />,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 120,
      cell: ({ row }) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-slate-700 bg-slate-800 text-slate-300">
          {row.original.status}
        </span>
      ),
    },
    { accessorKey: 'createdAt', header: 'Created', size: 100 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Incident Log Manager</h1>
        <p className="text-sm text-muted-foreground">Trace, investigate and manage platform security faults</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <DataGrid columns={columns} data={MOCK_INCIDENTS} onRowClick={(row) => setSelectedIncident(row)} height="400px" />
        </div>

        <div className="space-y-6">
          {selectedIncident ? (
            <>
              <div className="border p-4 rounded-lg bg-card space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-mono text-xs text-muted-foreground font-semibold">
                    {selectedIncident.id}
                  </span>
                  <RiskBadge level={selectedIncident.severity} />
                </div>
                <h3 className="text-sm font-semibold text-slate-200">{selectedIncident.title}</h3>
              </div>

              <AIConfidenceCard
                score={85}
                breakdown={[
                  { label: 'Correlation Vector Match', weight: 90 },
                  { label: 'Agent Topology Signal', weight: 80 },
                ]}
              />

              <ReasoningViewer
                reasoning={`#### Diagnostics Root Cause Identification
- Pod connection failure on primary database cluster triggered by memory pool depletion.
- Database logs indicate auth memory pools exhausted due to a high volume of unclosed active TCP connections.
`}
                citations={[
                  { id: '1', title: 'Database Pool Parameters', sourceName: 'Qdrant Doc' },
                ]}
              />

              <SimilarityCard
                currentTitle={selectedIncident.title}
                similarTitle="Auth pod cluster DB connection failure from socket depletion"
                similarId="INC-089"
                similarityScore={92}
                matchDetails={['Matching failure trace signature', 'Identical memory peak duration']}
              />
            </>
          ) : (
            <div className="text-center text-xs text-muted-foreground py-12 border rounded-lg bg-card/20">
              Select an incident from the data table to review AI diagnostics
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default IncidentsPage;
