import * as React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useIncident } from '@/hooks/useIncident';
import { useTimeline } from '@/hooks/useTimeline';
import { useDecision } from '@/hooks/useDecision';
import { useRunbooks } from '@/hooks/useRunbooks';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RiskBadge } from '@/components/ai/RiskBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIConfidenceCard } from '@/components/ai/AIConfidenceCard';
import { RecommendationCard } from '@/components/ai/RecommendationCard';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { Play, Send, Sparkles } from 'lucide-react';

interface IncidentDetailsDrawerProps {
  incidentId: string | null;
  onClose: () => void;
}

export function IncidentDetailsDrawer({ incidentId, onClose }: IncidentDetailsDrawerProps) {
  const {
    incident,
    isLoading,
    acknowledgeIncident,
    isAcknowledging,
    resolveIncident,
    isResolving,
    closeIncident,
    isClosing,
  } = useIncident(incidentId || '');

  const {
    timeline,
    notes,
    addNote,
    isAddingNote,
  } = useTimeline(incidentId || '');

  const { decision, approveDecision } = useDecision(incidentId || '');
  const { runbooks, executeRunbook, isExecuting } = useRunbooks();

  const [commentText, setCommentText] = React.useState('');

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    await addNote(commentText);
    setCommentText('');
  };

  const handleAcknowledge = async () => {
    if (!incidentId) return;
    await acknowledgeIncident();
  };

  const handleResolve = async () => {
    if (!incidentId) return;
    await resolveIncident('Resolved via Incident Details Panel');
  };

  const handleClose = async () => {
    if (!incidentId) return;
    await closeIncident('Closed via Incident Details Panel');
  };

  if (!incidentId) return null;

  return (
    <Sheet open={!!incidentId} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="w-[600px] sm:max-w-[600px] bg-card text-foreground select-none overflow-y-auto flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : incident ? (
          <>
            <SheetHeader className="border-b pb-4 shrink-0">
              <div className="flex justify-between items-start">
                <span className="font-mono text-xs text-muted-foreground font-semibold">
                  {incident.id}
                </span>
                <RiskBadge level={incident.severity} />
              </div>
              <SheetTitle className="text-slate-200 text-sm font-semibold pt-1">
                {incident.title}
              </SheetTitle>
              <div className="flex gap-2 pt-3">
                {incident.status === 'OPEN' && (
                  <Button
                    size="sm"
                    onClick={handleAcknowledge}
                    disabled={isAcknowledging}
                    className="h-8 bg-purple-600 hover:bg-purple-700 text-white text-[11px] cursor-pointer"
                  >
                    Acknowledge
                  </Button>
                )}
                {(incident.status === 'OPEN' || incident.status === 'ACKNOWLEDGED' || incident.status === 'INVESTIGATING') && (
                  <Button
                    size="sm"
                    onClick={handleResolve}
                    disabled={isResolving}
                    className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] cursor-pointer"
                  >
                    Resolve
                  </Button>
                )}
                {incident.status === 'RESOLVED' && (
                  <Button
                    size="sm"
                    onClick={handleClose}
                    disabled={isClosing}
                    className="h-8 bg-slate-700 hover:bg-slate-800 text-white text-[11px] cursor-pointer"
                  >
                    Close Incident
                  </Button>
                )}
              </div>
            </SheetHeader>

            <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0 pt-4">
              <TabsList className="grid grid-cols-4 h-9 bg-black/10 shrink-0 text-xs">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="ai">AI Analysis</TabsTrigger>
                <TabsTrigger value="runbooks">Runbooks</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="flex-1 overflow-y-auto space-y-4 pt-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Description</span>
                  <p className="text-xs text-slate-300 leading-relaxed bg-muted/20 p-3 border rounded">
                    {incident.description || 'No description provided.'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs border bg-muted/10 p-3 rounded">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Service Target</span>
                    <span className="font-semibold text-slate-200">{incident.service}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Environment</span>
                    <span className="font-semibold text-slate-200">{incident.environment}</span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="timeline" className="flex-1 overflow-y-auto flex flex-col min-h-0 pt-4">
                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  <div className="space-y-3">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Timeline Logs</span>
                    {timeline.map((evt) => (
                      <div key={evt.id} className="p-2 border rounded bg-muted/20 text-xs flex gap-2">
                        <span className="text-muted-foreground text-[10px] font-mono whitespace-nowrap">
                          {new Date(evt.timestamp).toLocaleTimeString()}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-200">{evt.action}</p>
                          {evt.notes && <p className="text-[11px] text-muted-foreground">{evt.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 pt-2">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Operator Notes</span>
                    {notes.map((n) => (
                      <div key={n.id} className="p-2 border rounded bg-muted/10 text-xs space-y-1">
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span className="font-semibold">{n.author}</span>
                          <span>{new Date(n.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-slate-200">{n.content}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSendComment} className="pt-4 border-t flex gap-2 shrink-0">
                  <Textarea
                    placeholder="Add comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="min-h-[40px] text-xs flex-1 bg-black/10"
                  />
                  <Button
                    type="submit"
                    disabled={isAddingNote}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white h-10 w-10 flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    <Send className="w-4.5 h-4.5" />
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="ai" className="flex-1 overflow-y-auto space-y-4 pt-4">
                {decision ? (
                  <>
                    <AIConfidenceCard
                      score={decision.confidence}
                      breakdown={Object.entries(decision.confidenceBreakdown || {}).map(([label, weight]) => ({
                        label,
                        weight,
                      }))}
                    />

                    <div className="space-y-2 border p-3 rounded bg-muted/10">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Possible Root Causes</span>
                      <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                        {decision.possibleRootCauses?.map((cause) => (
                          <li key={cause}>{cause}</li>
                        ))}
                      </ul>
                    </div>

                    <RecommendationCard
                      title="AI Decision Action Plan"
                      description={decision.recommendedAction}
                      riskLevel={incident.severity}
                      confidence={decision.confidence}
                      actions={
                        decision.status === 'PENDING'
                          ? [
                              {
                                label: 'Approve & Trigger automation',
                                onClick: () => approveDecision(),
                              },
                            ]
                          : []
                      }
                    />
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 border border-dashed rounded text-xs text-muted-foreground gap-2 bg-muted/5">
                    <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
                    Calculating AI diagnosis recommendations...
                  </div>
                )}
              </TabsContent>

              <TabsContent value="runbooks" className="flex-1 overflow-y-auto space-y-3 pt-4">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Available Runbook automations</span>
                {runbooks.map((rb) => (
                  <div key={rb.id} className="p-3 border rounded-md bg-muted/10 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-semibold text-slate-200">{rb.name}</p>
                      <p className="text-[10px] text-muted-foreground">{rb.description || 'No description'}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => executeRunbook({ runbookId: rb.id, incidentId: incident.id })}
                      disabled={isExecuting}
                      className="bg-purple-600 hover:bg-purple-700 text-white gap-1 text-[11px] h-8 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Execute
                    </Button>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
            Incident details not found
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default IncidentDetailsDrawer;
