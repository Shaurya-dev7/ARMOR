import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Globe, Satellite, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RiskLevel } from '@/lib/data';

interface RiskCardProps {
  title: string;
  type: 'earth' | 'satellite' | 'iss';
  riskLevel: RiskLevel;
  description: string;
  confidence: 'High' | 'Medium' | 'Low';
}

const RISK_COLORS: Record<RiskLevel, string> = {
  'None': 'text-muted-foreground bg-muted/20 border-muted/20',
  'Low': 'text-primary bg-primary/10 border-primary/20',
  'Monitor': 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
  'Attention': 'text-orange-500 bg-orange-500/10 border-orange-500/20',
  'Critical': 'text-destructive bg-destructive/10 border-destructive/20',
};

const ICONS = {
  earth: Globe,
  satellite: Satellite,
  iss: Zap, // Zap used for ISS/Station generic if needed, or maybe something else? Using Zap for now as distinct.
};

export function RiskCard({ title, type, riskLevel, description, confidence }: RiskCardProps) {
  const Icon = ICONS[type];
  const colorClass = RISK_COLORS[riskLevel];

  return (
    <Card className="border-white/5 bg-card/40 backdrop-blur-sm hover:bg-card/60 transition-colors group">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
          {title}
        </CardTitle>
        <Icon className={cn("h-4 w-4", colorClass.split(' ')[0])} />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
           <span className={cn("text-2xl font-bold px-3 py-1 rounded-md border", colorClass)}>
             {riskLevel}
           </span>
        </div>
        <p className="text-xs text-muted-foreground mb-4 min-h-[40px]">
          {description}
        </p>
        
        <div className="flex items-center justify-between text-xs pt-4 border-t border-white/5">
          <span className="text-muted-foreground">Confidence</span>
          <Badge variant="outline" className={cn(
             confidence === 'High' ? 'text-primary border-primary/20' : 'text-muted-foreground'
          )}>
            {confidence}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
