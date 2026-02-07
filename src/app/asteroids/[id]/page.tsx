import { MOCK_ASTEROIDS } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, ArrowLeft, Ruler, Activity, Crosshair, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

// In Next.js 16/Generic App Router, params is a Promise or object depending on config.
// For simplicity in this starter, treating as resolved or simple prop access. 
// If async params are required (Next 15+ changes), this might need `await params`.
// We will assume standard behavior for now.

export default async function AsteroidPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const asteroid = MOCK_ASTEROIDS.find(a => a.id === id);

  if (!asteroid) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold text-destructive mb-4">Object Not Found</h1>
        <Button asChild variant="ghost"><Link href="/asteroids">Back to Database</Link></Button>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/asteroids"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <div>
           <div className="flex items-center gap-3">
             <h1 className="text-3xl font-bold tracking-tight">{asteroid.name}</h1>
             <Badge variant="outline" className="text-lg px-3 py-1">{asteroid.confidence} Confidence</Badge>
           </div>
           <p className="text-muted-foreground">ID: {asteroid.id} • Approach: {new Date(asteroid.approach_date).toLocaleDateString('en-US', { timeZone: 'UTC' })}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Physical Properties */}
        <Card className="md:col-span-1 border-white/5 bg-card/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Ruler className="w-5 h-5 text-primary" />
              Physical Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-muted-foreground">Diameter</span>
              <span className="font-mono">{asteroid.size_km} km</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-muted-foreground">Velocity</span>
              <span className="font-mono">{asteroid.velocity_kph.toLocaleString('en-US')} km/h</span>
            </div>
             <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-muted-foreground">Miss Distance</span>
              <span className="font-mono">{asteroid.miss_distance_km.toLocaleString('en-US')} km</span>
            </div>
          </CardContent>

          <CardHeader className="mt-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="w-5 h-5 text-primary" />
              Orbital Viz
            </CardTitle>
          </CardHeader>
          <CardContent className="h-48 bg-black/20 rounded-lg flex items-center justify-center border border-white/5">
             <p className="text-muted-foreground text-sm">Orbit Visualization Placeholder</p>
          </CardContent>
        </Card>

        {/* Risk Analysis */}
        <div className="md:col-span-2 space-y-6">
           <Card className="border-white/5 bg-card/40 backdrop-blur-sm">
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Crosshair className="w-5 h-5 text-primary" />
                 Risk Intelligence Breakdown
               </CardTitle>
             </CardHeader>
             <CardContent className="grid gap-4 md:grid-cols-2">
                
                {/* Earth Risk */}
                <div className="p-4 rounded-lg bg-background/50 border border-white/5">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">Human Impact</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-foreground">{asteroid.risk_earth}</span>
                    {asteroid.risk_earth !== 'None' && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Probability of entering Earth's atmosphere. Calculated using JPL Sentry data.
                  </p>
                </div>
                
                 {/* Satellite Risk */}
                <div className="p-4 rounded-lg bg-background/50 border border-white/5">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">Satellite Swarms</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-foreground">{asteroid.risk_satellites}</span>
                     {asteroid.risk_satellites !== 'None' && <AlertTriangle className="w-5 h-5 text-orange-500" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Relative proximity to GEO, MEO, and LEO belts. Potential for conjunction events.
                  </p>
                </div>

                 {/* ISS Risk */}
                <div className="p-4 rounded-lg bg-background/50 border border-white/5">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">ISS Safety</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-foreground">{asteroid.risk_iss}</span>
                     {asteroid.risk_iss !== 'None' && <AlertTriangle className="w-5 h-5 text-destructive" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Specific conjunction analysis for the International Space Station orbital path.
                  </p>
                </div>

             </CardContent>
           </Card>

           <Card className="border-white/5 bg-card/40 backdrop-blur-sm">
             <CardHeader>
               <CardTitle className="text-lg">Assessment Summary</CardTitle>
             </CardHeader>
             <CardContent>
               <p className="text-muted-foreground leading-relaxed">
                 {asteroid.details}
               </p>
               <div className="mt-4 p-3 bg-primary/5 rounded border border-primary/10 text-sm text-primary/80">
                 <span className="font-semibold block mb-1">Analyst Note:</span>
                 This data is based on the latest trajectory solution. Uncertainty ellipsoids indicate a 99% probability of safe passage for Earth, but key satellite corridors require active monitoring.
               </div>
             </CardContent>
           </Card>
        </div>
      </div>

      {/* Gallery Section */}
      <Card className="border-white/5 bg-card/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ImageIcon className="w-5 h-5 text-primary" />
            Visual Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            "https://images.unsplash.com/photo-1614728853975-672f79e74b39?auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80"
          ].map((url, i) => (
            <div key={i} className="aspect-square rounded-lg overflow-hidden border border-white/10 relative group cursor-pointer hover:border-primary/50 transition-colors">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" 
                style={{ backgroundImage: `url('${url}')` }} 
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="text-white text-xs font-medium border border-white/30 px-3 py-1.5 rounded-full backdrop-blur-md">
                    View High-Res
                  </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      </div>
  );
}
