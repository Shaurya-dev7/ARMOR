import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MOCK_ALERTS } from '@/lib/data';
import { Bell, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AlertsPanel() {
  return (
    <Card className="col-span-1 border-white/5 bg-card/40 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Intel Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {MOCK_ALERTS.map((alert, index) => (
             <div key={index} className="flex gap-3 items-start p-3 rounded-lg bg-background/50 border border-white/5 hover:bg-background/80 transition-colors">
               <div className={cn(
                 "mt-0.5",
                 alert.type === 'warning' ? "text-orange-500" : "text-primary"
               )}>
                 {alert.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
               </div>
               <div>
                 <p className="text-sm text-foreground mb-1">
                   {alert.message}
                 </p>
                 <span className="text-xs text-muted-foreground block">
                   {alert.timestamp}
                 </span>
               </div>
             </div>
          ))}
          {MOCK_ALERTS.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No active alerts.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
