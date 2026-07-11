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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Send, Sparkles, DollarSign, Clock, AlertTriangle, FileText, Shield, ShieldCheck, ShieldAlert } from 'lucide-react';

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
              <TabsList className="grid grid-cols-5 h-9 bg-black/10 shrink-0 text-xs">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="ai">AI Analysis</TabsTrigger>
                <TabsTrigger value="governance">Governance</TabsTrigger>
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Card className="bg-muted/10 border">
                        <CardHeader className="pb-1 pt-2 px-3">
                          <CardTitle className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            Business Impact
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="px-3 pb-2 space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Est. Revenue Loss</span>
                            <span className="font-semibold text-red-400">
                              ${(decision.estimatedBusinessImpact ? parseInt(decision.estimatedBusinessImpact.replace(/[^0-9]/g, '')) * 1500 : 45000).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">SLA Penalty Risk</span>
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-amber-900/20 text-amber-400 border-amber-800">
                              {decision.confidence < 0.5 ? 'HIGH' : decision.confidence < 0.7 ? 'MEDIUM' : 'LOW'}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Est. Resolution</span>
                            <span className="font-semibold text-slate-200 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              {decision.estimatedResolutionTime || '45-60m'}
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-muted/10 border">
                        <CardHeader className="pb-1 pt-2 px-3">
                          <CardTitle className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Risk & Recovery
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="px-3 pb-2 space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Risk Level</span>
                            <RiskBadge level={decision.riskLevel || incident.severity} />
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Recovery Strategy</span>
                            <span className="font-semibold text-emerald-400">
                              {decision.approvalRecommendation === 'AUTO_REMEDIATE' ? 'Auto-Remediation' : 'Manual Rollback'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Human Approval</span>
                            <Badge variant="outline" className={`text-[10px] h-5 px-1.5 ${decision.status === 'PENDING' ? 'bg-blue-900/20 text-blue-400 border-blue-800' : 'bg-emerald-900/20 text-emerald-400 border-emerald-800'}`}>
                              {decision.status === 'PENDING' ? 'Required' : 'Approved'}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-2 border p-3 rounded bg-muted/10">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Possible Root Causes</span>
                      <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                        {decision.possibleRootCauses?.map((cause) => (
                          <li key={cause}>{cause}</li>
                        ))}
                      </ul>
                    </div>

                    {decision.reasoningSteps && decision.reasoningSteps.length > 0 && (
                      <div className="space-y-2 border p-3 rounded bg-muted/10">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          Reasoning Steps
                        </span>
                        <div className="space-y-1.5">
                          {decision.reasoningSteps.map((step, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs">
                              <span className="text-muted-foreground font-mono shrink-0 w-4">#{i + 1}</span>
                              <div className="flex-1">
                                <span className="font-semibold text-slate-200">{step.step}</span>
                                <p className="text-muted-foreground text-[11px]">{step.thought}</p>
                              </div>
                              <span className="text-[10px] font-mono text-purple-400 shrink-0">
                                {(step.confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <RecommendationCard
                      title="AI Decision Action Plan"
                      description={decision.recommendedAction}
                      riskLevel={decision.riskLevel || incident.severity}
                      confidence={decision.confidence}
                      actions={
                        decision.status === 'PENDING'
                          ? [
                              {
                                label: 'Approve & Trigger automation',
                                onClick: () => approveDecision(),
                              },
                            ]
                          : decision.status === 'APPROVED'
                          ? [
                              {
                                label: 'Approved - Auto-remediation in progress',
                                onClick: () => {},
                              },
                            ]
                          : []
                      }
                    />

                    {decision.recommendedRunbooks && decision.recommendedRunbooks.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                          Recommended Runbooks ({decision.recommendedRunbooks.length})
                        </span>
                        {decision.recommendedRunbooks.map((rb: any, i: number) => (
                          <div key={i} className="p-2.5 border rounded bg-muted/10 flex justify-between items-center text-xs">
                            <div>
                              <p className="font-semibold text-slate-200">{rb.name || rb.runbookId}</p>
                              {rb.reasoning && <p className="text-[10px] text-muted-foreground mt-0.5">{rb.reasoning}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                              {rb.score && (
                                <span className="text-[10px] font-mono text-purple-400">{rb.score.toFixed(0)}% match</span>
                              )}
                              {rb.estimatedRecoveryTimeMinutes && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {rb.estimatedRecoveryTimeMinutes}m
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 border border-dashed rounded text-xs text-muted-foreground gap-2 bg-muted/5">
                    <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
                    Calculating AI diagnosis recommendations...
                  </div>
                )}
              </TabsContent>

              <TabsContent value="governance" className="flex-1 overflow-y-auto space-y-4 pt-4">
                {decision ? (
                  <>
                    {/* AI Trust & Risk Scores */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Card className="bg-muted/10 border">
                        <CardHeader className="pb-1 pt-2 px-3">
                          <CardTitle className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            AI Trust Score
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="px-3 pb-3">
                          <div className="text-2xl font-bold font-mono" style={{ color: decision.confidence >= 0.7 ? '#34d399' : decision.confidence >= 0.4 ? '#fbbf24' : '#ef4444' }}>
                            {(decision.confidence * 100).toFixed(0)}%
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                            <div className="h-1.5 rounded-full bg-current transition-all" style={{ width: `${decision.confidence * 100}%`, color: decision.confidence >= 0.7 ? '#34d399' : decision.confidence >= 0.4 ? '#fbbf24' : '#ef4444' }} />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-muted/10 border">
                        <CardHeader className="pb-1 pt-2 px-3">
                          <CardTitle className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3 text-amber-400" />
                            Risk Score
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="px-3 pb-3">
                          <div className="text-2xl font-bold font-mono text-amber-400">
                            {Math.round((1 - (decision.confidence || 0)) * 100)}%
                          </div>
                          <Badge variant="outline" className={`mt-1 text-[10px] h-5 px-1.5 ${
                            decision.riskLevel === 'CRITICAL' ? 'bg-red-900/20 text-red-400 border-red-800' :
                            decision.riskLevel === 'HIGH' ? 'bg-orange-900/20 text-orange-400 border-orange-800' :
                            decision.riskLevel === 'MEDIUM' ? 'bg-amber-900/20 text-amber-400 border-amber-800' :
                            'bg-emerald-900/20 text-emerald-400 border-emerald-800'
                          }`}>
                            {decision.riskLevel || 'MEDIUM'}
                          </Badge>
                        </CardContent>
                      </Card>

                      <Card className="bg-muted/10 border">
                        <CardHeader className="pb-1 pt-2 px-3">
                          <CardTitle className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                            <Shield className="w-3 h-3 text-purple-400" />
                            Policy Status
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="px-3 pb-3">
                          <div className="flex items-center gap-2">
                            {decision.status === 'APPROVED' ? (
                              <Badge className="bg-emerald-900/20 text-emerald-400 border-emerald-800 text-[10px] h-5">APPROVED</Badge>
                            ) : decision.status === 'PENDING' ? (
                              <Badge className="bg-amber-900/20 text-amber-400 border-amber-800 text-[10px] h-5">REVIEW</Badge>
                            ) : (
                              <Badge className="bg-red-900/20 text-red-400 border-red-800 text-[10px] h-5">BLOCKED</Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1.5">
                            {decision.approvalRecommendation === 'AUTO_REMEDIATE' ? 'Auto-remediation approved' : 'Manual review required'}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Violations List */}
                    {decision.possibleRootCauses && decision.possibleRootCauses.length > 0 && (
                      <div className="space-y-2 border p-3 rounded bg-muted/10">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          Governance Violations
                        </span>
                        <ul className="space-y-1">
                          {decision.possibleRootCauses.slice(0, 3).map((cause, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs">
                              <span className="text-red-400 mt-0.5 shrink-0">●</span>
                              <span className="text-slate-300">{cause}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Confidence Breakdown */}
                    {decision.confidenceBreakdown && Object.keys(decision.confidenceBreakdown).length > 0 && (
                      <div className="space-y-2 border p-3 rounded bg-muted/10">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Enkrypt AI Detector Breakdown</span>
                        <div className="space-y-2">
                          {Object.entries(decision.confidenceBreakdown).map(([detector, score]) => (
                            <div key={detector} className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-300 capitalize w-32 shrink-0">{detector.replace(/_/g, ' ')}</span>
                              <div className="flex-1 bg-muted rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    (score as number) > 0.7 ? 'bg-red-500' : (score as number) > 0.4 ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${(score as number) * 100}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">
                                {((score as number) * 100).toFixed(0)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Enkrypt Policy Decision */}
                    <Card className="bg-muted/10 border">
                      <CardHeader className="pb-2 pt-2 px-3">
                        <CardTitle className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          Enkrypt AI Policy Decision
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-3 pb-2 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Recommended Action</span>
                          <span className="font-semibold text-slate-200">{decision.recommendedAction}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Approval Status</span>
                          <Badge variant="outline" className={`text-[10px] h-5 px-1.5 ${
                            decision.status === 'APPROVED' ? 'bg-emerald-900/20 text-emerald-400 border-emerald-800' :
                            decision.status === 'PENDING' ? 'bg-blue-900/20 text-blue-400 border-blue-800' :
                            'bg-red-900/20 text-red-400 border-red-800'
                          }`}>
                            {decision.status}
                          </Badge>
                        </div>
                        {decision.status === 'PENDING' && (
                          <div className="pt-1">
                            <Button
                              size="sm"
                              onClick={() => approveDecision()}
                              className="bg-purple-600 hover:bg-purple-700 text-white text-[11px] h-8 cursor-pointer w-full"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                              Approve AI Plan
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 border border-dashed rounded text-xs text-muted-foreground gap-2 bg-muted/5">
                    <Shield className="w-6 h-6 text-purple-400 animate-pulse" />
                    Running Enkrypt AI governance checks...
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
