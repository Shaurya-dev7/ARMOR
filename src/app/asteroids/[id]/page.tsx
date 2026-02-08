'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, ArrowLeft, Ruler, Activity, Crosshair, Image as ImageIcon } from 'lucide-react';
import AnimatedShaderBackground from '@/components/ui/animated-shader-background';
import dynamic from 'next/dynamic';

const AsteroidOrbit3D = dynamic(() => import('@/components/ui/AsteroidOrbit3D'), { ssr: false });

export default function AsteroidPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [asteroid, setAsteroid] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    const fetchAsteroid = async () => {
      try {
        setLoading(true);
        // Fetch from API
        // Since we don't have a single item endpoint yet, we fetch list and find.
        // Optimization: In production, create /api/asteroids/[id]
        const response = await fetch('/api/asteroids');
        const data = await response.json();
        
        const found = (data.asteroids || []).find((a: any) => a.id === id);
        
        if (found) {
          setAsteroid(found);
        } else {
          setError('Asteroid not found in daily database.');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch asteroid details.');
      } finally {
        setLoading(false);
      }
    };

    fetchAsteroid();
  }, [id]);

  if (loading) {
     return (
       <div className="min-h-screen bg-black flex items-center justify-center">
         <div className="animate-pulse flex flex-col items-center gap-4">
              <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <p className="text-white/50 text-sm tracking-widest uppercase">Analyzing Trajectory...</p>
         </div>
       </div>
     );
  }

  if (error || !asteroid) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-destructive font-bold text-center">{error || 'Object Not Found'}</p>
        <Button onClick={() => router.push('/asteroids')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Return to Database
        </Button>
      </div>
    );
  }

  // Prepare orbit data
  const orbitData = {
    name: asteroid.name,
    distance_au: asteroid.miss_distance_km / 149597870.7, // Convert km to AU
    velocity_km_s: asteroid.velocity_kph / 3600,
    eccentricity: 0.2, // Default
  };

  return (
    <>
    <AnimatedShaderBackground />
    <div className="section-container pt-24 pb-20 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" onClick={() => router.push('/asteroids')} className="shrink-0">
               <ArrowLeft className="w-5 h-5" />
             </Button>
             <div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white glow-text">{asteroid.name}</h1>
                <div className="flex items-center gap-3 mt-2 text-sm text-white/60 font-mono">
                    <span>ID: {asteroid.id}</span>
                    <span>•</span>
                    <span>Approach: {new Date(asteroid.approach_date).toLocaleDateString()}</span>
                </div>
             </div>
        </div>
        <div className="flex gap-2">
            <Badge variant="outline" className={`text-lg px-4 py-1.5 ${
                asteroid.severity === 'critical' ? 'bg-red-500/20 text-red-400 border-red-500/50' : 
                asteroid.severity === 'alert' ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' :
                'bg-blue-500/20 text-blue-400 border-blue-500/50'
            }`}>
                {asteroid.severity?.toUpperCase()} RISK
            </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Data */}
        <div className="space-y-6">
             {/* Physical Properties */}
            <Card className="glass-card border-l-4 border-l-secondary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Ruler className="w-5 h-5 text-secondary" />
                  Physical Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-white/60">Diameter</span>
                  <span className="font-mono">{asteroid.size_km.toFixed(3)} km</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-white/60">Velocity</span>
                  <span className="font-mono">{asteroid.velocity_kph.toLocaleString('en-US')} km/h</span>
                </div>
                 <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-white/60">Miss Distance</span>
                  <span className="font-mono">{(asteroid.miss_distance_km / 1000000).toFixed(2)}M km</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-white/60">Relative Vel.</span>
                  <span className="font-mono">{(asteroid.velocity_kph / 3600).toFixed(2)} km/s</span>
                </div>
              </CardContent>
            </Card>

             {/* Risk Analysis */}
            <Card className="glass-card">
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <Crosshair className="w-5 h-5 text-primary" />
                     Risk Assessment
                   </CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                    {/* Public Alert Message */}
                    {asteroid.public_alert && (
                        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 mb-4">
                            <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Public Advisory</h4>
                            <p className="text-sm text-white/90 leading-relaxed">
                                {asteroid.public_alert.message}
                            </p>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-white/5 rounded">
                            <span className="text-xs text-secondary block mb-1">IMPACT PROBABILITY</span>
                            <span className="text-xl font-bold">{asteroid.impact_probability ? (asteroid.impact_probability * 100).toFixed(4) + '%' : '0%'}</span>
                        </div>
                        <div className="p-3 bg-white/5 rounded">
                            <span className="text-xs text-secondary block mb-1">HAZARDOUS</span>
                            <span className={`text-xl font-bold ${asteroid.is_potentially_hazardous ? 'text-red-400' : 'text-green-400'}`}>
                                {asteroid.is_potentially_hazardous ? 'YES' : 'NO'}
                            </span>
                        </div>
                    </div>
                 </CardContent>
            </Card>
        </div>

        {/* Right Column: Visualization */}
        <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl h-[500px] lg:h-[600px] relative group">
                 {/* Live 3D View */}
                 <div className="absolute inset-0 z-0">
                    <AsteroidOrbit3D data={orbitData} />
                 </div>
                 
                 {/* Overlay */}
                 <div className="absolute top-4 right-4 z-10">
                    <Badge variant="secondary" className="bg-black/50 backdrop-blur border-white/10">
                        <Activity className="w-3 h-3 mr-1 text-green-400 animate-pulse" /> LIVE SIMULATION
                    </Badge>
                 </div>
            </div>

            {/* Assessment Note */}
            <Card className="glass-card bg-primary/5 border-primary/10">
                 <CardContent className="pt-6">
                    <div className="flex gap-4">
                        <div className="shrink-0 mt-1">
                            <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white mb-1">AI Interpretation</h3>
                            <p className="text-white/70 text-sm leading-relaxed">
                                This object is being tracked by global monitoring networks. Its trajectory is well-defined. 
                                {asteroid.is_potentially_hazardous 
                                    ? " While classified as potentially hazardous due to size and proximity, no immediate impact threat is detected." 
                                    : " It poses no threat to Earth or orbital assets at this time."}
                            </p>
                        </div>
                    </div>
                 </CardContent>
            </Card>
        </div>
      </div>
    </div>
    </>
  );
}
