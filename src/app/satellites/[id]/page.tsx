'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Satellite, Activity, Globe, Ruler, Clock } from 'lucide-react';
import AnimatedShaderBackground from '@/components/ui/animated-shader-background';
// Dynamic import for the 3D component to avoid SSR issues with Three.js
import dynamic from 'next/dynamic';

const AsteroidOrbit3D = dynamic(() => import('@/components/ui/AsteroidOrbit3D'), { ssr: false });

interface SatelliteDetail {
  norad_id: number;
  name: string;
  object_type: string;
  status: string;
  orbit_class: string;
  country: string;
  launch_date?: string;
  inclination_deg?: number;
  period_minutes?: number;
  apogee_km?: number;
  perigee_km?: number;
  velocity_kms?: number; // Estimated
}

export default function SatelliteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [satellite, setSatellite] = useState<SatelliteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // Try fetching from Space-Track via our API proxy first as it has more details
        // In a real app, we'd have a dedicated single-item endpoint like /api/satellites/${id}
        // For now, we'll fetch list and find (fallback) or ideally hit a specific endpoint if avail.
        // Assuming /api/satellites might return a list, we'll try to find it there or fetch from spacetrack.
        
        // Strategy: Fetch from /api/spacetrack with specific query if possible, or filter client side from list.
        // Since we don't have a verified single-item endpoint, let's try fetching specific data.
        
        // Simulated fetch for now using the list endpoint and filtering
        const [celestrakRes, spacetrackRes] = await Promise.allSettled([
            fetch('/api/satellites'),
            fetch('/api/spacetrack?limit=200&type=PAYLOAD'), // fetching more to increase odds of finding it
        ]);

        let foundSat: SatelliteDetail | undefined;

        if (celestrakRes.status === 'fulfilled' && celestrakRes.value.ok) {
            const data = await celestrakRes.value.json();
            foundSat = (data.objects || []).find((s: any) => s.norad_id.toString() === id);
        }

        if (!foundSat && spacetrackRes.status === 'fulfilled' && spacetrackRes.value.ok) {
             const data = await spacetrackRes.value.json();
             foundSat = (data.objects || []).find((s: any) => s.norad_id.toString() === id);
        }

        if (foundSat) {
          // Normalize/Enhance data
          setSatellite({
            ...foundSat,
            velocity_kms: 7.6 // Approximate LEO velocity if missing
          });
        } else {
          setError('Satellite not found in tracked catalog.');
        }

      } catch (err) {
        console.error(err);
        setError('Failed to load satellite details.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
             <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
             <p className="text-white/50 text-sm tracking-widest uppercase">Acquiring Telemetry...</p>
        </div>
      </div>
    );
  }

  if (error || !satellite) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <p className="text-destructive font-bold">{error || 'Satellite not found'}</p>
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Return to Catalog
        </Button>
      </div>
    );
  }

  // Prepared data for 3D view
  // We map satellite orbit data to the format AsteroidOrbit3D expects
  // 1 AU = 149.6M km. LEO is super close (~400km). 
  // Visualizing LEO scale accurately is hard. We will "fake" the distance for visual clarity.
  // LEO (Low) -> 0.1 AU visual
  // GEO (High) -> 0.3 AU visual
  let visualDistance = 0.15; // default
  if (satellite.orbit_class === 'GEO') visualDistance = 0.4;
  if (satellite.orbit_class === 'MEO') visualDistance = 0.25;

  const orbitData = {
    name: satellite.name,
    distance_au: visualDistance, // Visual scale only
    eccentricity: 0, // Circular approximation
    velocity_km_s: satellite.velocity_kms || 7,
  };

  return (
    <>
      <AnimatedShaderBackground />
      <div className="section-container pt-24 pb-20 space-y-8">
        
        {/* Navigation */}
        <Button 
          variant="ghost" 
          className="text-white/50 hover:text-white -ml-4" 
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Catalog
        </Button>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-8">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white glow-text">
                        {satellite.name}
                    </h1>
                    <Badge className={satellite.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                        {satellite.status}
                    </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-white/60 font-mono">
                    <span>NORAD: {satellite.norad_id}</span>
                    <span>•</span>
                    <span>{satellite.country}</span>
                    <span>•</span>
                    <span>{satellite.launch_date || 'Launch Date Unknown'}</span>
                </div>
            </div>
            <div className="flex gap-2">
                <Button className="cosmic-button">
                    <Activity className="mr-2 h-4 w-4" /> Live Tracking
                </Button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Details */}
            <div className="space-y-6">
                <Card className="glass-card border-l-4 border-l-primary">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Satellite className="w-5 h-5 text-primary" /> Orbital Parameters
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-white/60 text-sm">Orbit Class</span>
                            <span className="font-mono font-bold">{satellite.orbit_class}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-white/60 text-sm">Inclination</span>
                            <span className="font-mono">{satellite.inclination_deg?.toFixed(2)}°</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-white/60 text-sm">Period</span>
                            <span className="font-mono">{satellite.period_minutes?.toFixed(1)} min</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-white/60 text-sm">Apogee</span>
                            <span className="font-mono">{satellite.apogee_km?.toLocaleString()} km</span>
                        </div>
                         <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-white/60 text-sm">Perigee</span>
                            <span className="font-mono">{satellite.perigee_km?.toLocaleString()} km</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Globe className="w-5 h-5 text-secondary" /> Physical Object
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-white/60 text-sm">Type</span>
                            <span className="font-mono">{satellite.object_type}</span>
                        </div>
                         <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-white/60 text-sm">Owner/Country</span>
                            <span className="font-mono">{satellite.country}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: Visualization */}
            <div className="lg:col-span-2 space-y-4">
                <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                    {/* Reuse the AsteroidOrbit3D but contextually for satellite */}
                    <AsteroidOrbit3D data={orbitData} />
                </div>
                <div className="flex justify-between text-xs text-white/30 font-mono px-2">
                     <span>Visualization Mode: ORBITAL_PLANE_XZ</span>
                     <span>update_frequency: REALTIME</span>
                </div>
            </div>
        </div>
      </div>
    </>
  );
}
