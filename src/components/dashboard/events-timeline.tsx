import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MOCK_ASTEROIDS } from '@/lib/data';
import { ArrowRight, Calendar } from 'lucide-react';
import Link from 'next/link';

export function EventsTimeline() {
  // Sort by date (mock sorted)
  const events = MOCK_ASTEROIDS.slice(0, 3); 

  return (
    <Card className="col-span-2 border-white/5 bg-card/40 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Upcoming Approaches
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {events.map((asteroid, index) => (
            <div key={asteroid.id} className="relative pl-6 border-l border-white/10 last:pb-0">
              {/* Dot */}
              <div className="absolute left-[-2.5px] top-2 w-[5px] h-[5px] rounded-full bg-primary ring-4 ring-background" />
              
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                 {/* Thumbnail */}
                 <div className="h-16 w-16 rounded bg-black/50 border border-white/10 shrink-0 overflow-hidden relative group">
                   <div className="absolute inset-0 bg-[url('https://images-assets.nasa.gov/image/PIA22946/PIA22946~small.jpg')] bg-cover bg-center opacity-60 group-hover:opacity-100 transition-opacity" />
                 </div>

                 <div className="flex-1">
                   <div className="flex sm:items-center justify-between gap-4 mb-1">
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        {asteroid.name}
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border px-1.5 py-0.5 rounded border-white/10">
                          {new Date(asteroid.approach_date).toLocaleDateString()}
                        </span>
                      </h4>
                       <Link 
                        href={`/asteroids/${asteroid.id}`}
                        className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 group whitespace-nowrap"
                      >
                        Analysis <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </Link>
                   </div>
                   <p className="text-sm text-muted-foreground max-w-md line-clamp-2">
                     {asteroid.details}
                   </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
