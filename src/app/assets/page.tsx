'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MOCK_SATELLITES } from '@/lib/data';
import { Satellite, Zap, Globe, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BauhausCard } from '@/components/ui/bauhaus-card';

const TABS = ['LEO', 'MEO', 'GEO', 'ALL'];

export default function SpaceAssetsPage() {
  const [activeTab, setActiveTab] = useState('ALL');

  const filteredSatellites = activeTab === 'ALL' 
    ? MOCK_SATELLITES 
    : MOCK_SATELLITES.filter(s => s.orbit === activeTab);

  return (
    <div className="section-container pt-24 pb-20 space-y-12">
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
           <BauhausCard
             key={sat.id}
             id={sat.id}
             accentColor={
               sat.risk_level === 'Critical' ? '#ef4444' : 
               sat.risk_level === 'Attention' ? '#fc6800' : 
               sat.risk_level === 'Monitor' ? '#156ef6' : '#24d200'
             }
             backgroundColor="var(--bauhaus-card-bg)"
             separatorColor="var(--bauhaus-card-separator)"
             topInscription={`${sat.orbit} • MISSION CONTROL`}
             mainText={sat.name}
             subMainText={`Status: ${sat.status} | Tracking ID: ${sat.id}`}
             progressBarInscription="Collision Probability"
             progress={sat.risk_level === 'Critical' ? 85 : sat.risk_level === 'Attention' ? 45 : sat.risk_level === 'Monitor' ? 15 : 0}
             progressValue={sat.risk_level === 'None' ? 'Nominal' : `${sat.risk_level} Warning`}
             filledButtonInscription="View Telemetry"
             outlinedButtonInscription="Alert Logs"
             textColorTop="var(--bauhaus-card-inscription-top)"
             textColorMain="var(--bauhaus-card-inscription-main)"
             textColorSub="var(--bauhaus-card-inscription-sub)"
             textColorProgressLabel="var(--bauhaus-card-inscription-progress-label)"
             textColorProgressValue="var(--bauhaus-card-inscription-progress-value)"
             progressBarBackground="var(--bauhaus-card-progress-bar-bg)"
             chronicleButtonBg="var(--bauhaus-chronicle-bg)"
             chronicleButtonFg="var(--bauhaus-chronicle-fg)"
             chronicleButtonHoverFg="var(--bauhaus-chronicle-hover-fg)"
           />
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
