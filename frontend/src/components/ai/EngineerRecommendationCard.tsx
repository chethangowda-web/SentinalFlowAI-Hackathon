import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserCheck, Star } from 'lucide-react';

interface EngineerRec {
  engineerId: string;
  name: string;
  avatarUrl: string;
  role: string;
  currentWorkload: number;
  expertise: string[];
  solvedIncidentsCount: number;
  confidence: number;
}

interface EngineerRecommendationCardProps {
  engineer: EngineerRec;
  onAssign: (id: string) => void;
  assigning?: boolean;
}

export function EngineerRecommendationCard({ engineer, onAssign, assigning = false }: EngineerRecommendationCardProps) {
  return (
    <Card className="bg-card border border-border shadow-sm select-none">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10 border">
            <AvatarImage src={engineer.avatarUrl} alt={engineer.name} />
            <AvatarFallback className="text-xs bg-purple-500/20 font-bold">{engineer.name.substr(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-slate-200 truncate">{engineer.name}</h4>
            <p className="text-[10px] text-muted-foreground truncate">{engineer.role}</p>
          </div>
          <div className="flex items-center text-[10px] font-mono font-bold text-purple-300 bg-purple-500/5 px-2 py-0.5 border border-purple-500/10 rounded">
            <Star className="w-3 h-3 text-purple-400 mr-1 fill-current" />
            {engineer.confidence}% match
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 py-2 border-y text-[10px] font-mono">
          <div>
            <span className="text-muted-foreground block text-[9px]">Active Workload</span>
            <span className={`font-bold ${engineer.currentWorkload > 2 ? 'text-amber-400' : 'text-slate-200'}`}>
              {engineer.currentWorkload} active {engineer.currentWorkload === 1 ? 'incident' : 'incidents'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[9px]">Past Resolves</span>
            <span className="font-bold text-slate-200">{engineer.solvedIncidentsCount} incidents</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {engineer.expertise.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[9px] px-1.5 py-0 bg-muted text-slate-300 font-normal">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex justify-end pt-1">
          <Button
            size="sm"
            onClick={() => onAssign(engineer.engineerId)}
            disabled={assigning}
            className="h-8 bg-purple-600 hover:bg-purple-700 text-white gap-1 text-[11px] cursor-pointer w-full sm:w-auto"
          >
            <UserCheck className="w-3.5 h-3.5" />
            {assigning ? 'Assigning...' : 'Assign Engineer'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default EngineerRecommendationCard;
