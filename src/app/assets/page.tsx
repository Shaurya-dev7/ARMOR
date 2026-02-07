'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MOCK_SATELLITES } from '@/lib/data';
import { Satellite, Zap, Globe, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = ['LEO', 'MEO', 'GEO', 'ALL'];

export default function SpaceAssetsPage() {
  const [activeTab, setActiveTab] = useState('ALL');

  const filteredSatellites = activeTab === 'ALL' 
    ? MOCK_SATELLITES 
    : MOCK_SATELLITES.filter(s => s.orbit === activeTab);

  return (
    <div className="container py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Space Assets Monitor</h1>
          <p className="text-muted-foreground">
            Tracking critical infrastructure in Low, Medium, and Geostationary Earth Orbits.
          </p>
        </div>
        
        <div className="flex gap-2 bg-muted/50 p-1 rounded-lg">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
                activeTab === tab 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredSatellites.map((sat) => (
          <Card key={sat.id} className="border-white/5 bg-card/40 backdrop-blur-sm hover:border-primary/30 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                {sat.id === 'ISS' ? <Zap className="w-4 h-4 text-primary" /> : <Satellite className="w-4 h-4 text-muted-foreground" />}
                {sat.name}
              </CardTitle>
              <Badge variant="outline">{sat.orbit}</Badge>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-32 w-full rounded-md bg-black/50 overflow-hidden mb-4 relative group">
                 <div 
                   className="absolute inset-0 bg-cover bg-center opacity-60 group-hover:opacity-80 transition-opacity duration-500"
                   style={{ 
                     backgroundImage: sat.id === 'ISS' 
                       ? 'url("https://www.nasa.gov/sites/default/files/thumbnails/image/iss065e324398.jpg")' 
                       : 'url("https://images-assets.nasa.gov/image/PIA12348/PIA12348~orig.jpg")' 
                   }}
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                 <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                    <Badge variant="outline" className="bg-black/50 backdrop-blur-md border-white/10 text-xs">{sat.orbit}</Badge>
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-muted-foreground">Status</span>
                   <Badge className={cn(
                     sat.status === 'Active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500'
                   )}>
                     {sat.status}
                   </Badge>
                 </div>
                 
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-muted-foreground">Risk Level</span>
                   <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-bold",
                        sat.risk_level === 'None' ? 'text-muted-foreground' : 
                        sat.risk_level === 'Low' ? 'text-primary' : 'text-orange-500'
                      )}>
                        {sat.risk_level}
                      </span>
                      {sat.risk_level !== 'None' && <AlertTriangle className="w-4 h-4 text-orange-500" />}
                   </div>
                 </div>

                 {sat.risk_level !== 'None' && (
                   <div className="p-2 bg-orange-500/10 border border-orange-500/20 rounded text-xs text-orange-200">
                     Proximity alert: 2025 CW1 passing within 200km of orbital shell.
                   </div>
                 )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8 border-white/5 bg-card/20 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
           <Globe className="w-12 h-12 text-muted-foreground opacity-50" />
           <div>
             <h3 className="text-lg font-semibold">Integrate Your Fleet</h3>
             <p className="text-muted-foreground max-w-md mx-auto">
               Satellite operators can connect their telemetry streams via API to receive real-time conjunction warnings.
             </p>
           </div>
           <Button variant="outline">View API Documentation</Button>
        </CardContent>
      </Card>
    </div>
  );
}
