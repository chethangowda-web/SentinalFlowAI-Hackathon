import { Play, CheckSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function RunbooksPage() {
  const runbooks = [
    { id: '1', name: 'Database Pool Auto-Scaling Script', duration: '3s execution', trigger: 'Manual or Auto' },
    { id: '2', name: 'Restart Auth Cluster Pod Services', duration: '12s execution', trigger: 'Manual Approval Only' },
    { id: '3', name: 'Flush Redis Cache Server Sessions', duration: '1s execution', trigger: 'Manual or Auto' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Operational Runbooks</h1>
        <p className="text-sm text-muted-foreground">Checklists and automation scripts to mitigate incidents</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {runbooks.map((rb) => (
          <Card key={rb.id} className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckSquare className="w-4.5 h-4.5 text-purple-400" />
                  {rb.name}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground bg-muted/40 px-2 py-0.5 border rounded">
                  {rb.trigger}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-between items-center text-xs pt-2">
              <span className="text-muted-foreground">{rb.duration}</span>
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white gap-1 text-[11px] h-8 px-3 cursor-pointer">
                <Play className="w-3 h-3 fill-current" />
                Trigger Execution
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default RunbooksPage;
