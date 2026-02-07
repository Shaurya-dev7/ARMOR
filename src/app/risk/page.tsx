'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Shield, 
  Target, 
  Info,
  ChevronRight
} from 'lucide-react';
import AnimatedShaderBackground from '@/components/ui/animated-shader-background';

// Torino Scale Visual Gauge
function TorinoGauge({ level = 0 }: { level?: number }) {
  const levels = [
    { value: 0, color: 'bg-white', label: 'No Hazard' },
    { value: 1, color: 'bg-green-500', label: 'Normal' },
    { value: 2, color: 'bg-yellow-400', label: 'Attention' },
    { value: 3, color: 'bg-yellow-500', label: 'Attention' },
    { value: 4, color: 'bg-yellow-600', label: 'Attention' },
    { value: 5, color: 'bg-orange-500', label: 'Threatening' },
    { value: 6, color: 'bg-orange-600', label: 'Threatening' },
    { value: 7, color: 'bg-orange-700', label: 'Threatening' },
    { value: 8, color: 'bg-red-500', label: 'Certain' },
    { value: 9, color: 'bg-red-600', label: 'Certain' },
    { value: 10, color: 'bg-red-700', label: 'Certain' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        {levels.map((l) => (
          <div
            key={l.value}
            className={`flex-1 h-8 rounded-sm ${l.color} ${
              l.value <= level ? 'opacity-100' : 'opacity-20'
            } transition-opacity relative group cursor-pointer`}
          >
            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-mono opacity-50">
              {l.value}
            </span>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
              {l.label}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-6">
        <span>No Hazard</span>
        <span>Certain Impact</span>
      </div>
    </div>
  );
}

// Palermo Scale Bar
function PalermoBar({ value = -3 }: { value?: number }) {
  // Normalize value from -10 to +2 range to 0-100%
  const normalized = Math.max(0, Math.min(100, ((value + 10) / 12) * 100));
  const isNegative = value < 0;
  
  return (
    <div className="space-y-3">
      <div className="relative h-6 bg-white/5 rounded-full overflow-hidden">
        {/* Scale markers */}
        <div className="absolute inset-0 flex items-center">
          <div className="absolute left-[83.3%] h-full w-px bg-yellow-500/50" /> {/* 0 mark */}
        </div>
        {/* Value bar */}
        <div 
          className={`h-full rounded-full transition-all duration-500 ${
            value >= 0 ? 'bg-red-500' : value >= -2 ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          style={{ width: `${normalized}%` }}
        />
        {/* Current value indicator */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-background shadow-lg transition-all duration-500"
          style={{ left: `calc(${normalized}% - 8px)` }}
        />
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-green-500">-10 (Safe)</span>
        <span className="text-muted-foreground">-2</span>
        <span className="text-yellow-500">0</span>
        <span className="text-red-500">+2 (Danger)</span>
      </div>
      <div className="text-center">
        <span className="text-2xl font-bold font-mono">{value.toFixed(1)}</span>
        <span className="text-sm text-muted-foreground ml-2">Current Max</span>
      </div>
    </div>
  );
}

// Orbit Uncertainty Visualization
function OrbitUncertainty() {
  return (
    <div className="relative h-48 flex items-center justify-center">
      {/* Central body (Earth) */}
      <div className="absolute w-8 h-8 rounded-full bg-blue-500 z-10" />
      
      {/* Orbit path */}
      <div className="absolute w-40 h-40 rounded-full border border-white/20" />
      
      {/* Uncertainty ellipse */}
      <div 
        className="absolute w-6 h-16 rounded-full border-2 border-primary/50 bg-primary/10 animate-pulse"
        style={{ 
          transform: 'rotate(-45deg) translateX(56px)',
        }}
      />
      
      {/* Asteroid dot */}
      <div 
        className="absolute w-3 h-3 rounded-full bg-primary"
        style={{ 
          transform: 'rotate(-45deg) translateX(56px)',
        }}
      />
      
      {/* Labels */}
      <div className="absolute top-2 left-2 text-xs text-muted-foreground">
        Uncertainty Region
      </div>
      <div className="absolute bottom-2 right-2 text-xs text-primary">
        ↔ Error Ellipsoid
      </div>
    </div>
  );
}

// Info Card with icon
function InfoCard({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 p-4 rounded-xl bg-card/40 border border-white/5 backdrop-blur-sm hover:bg-card/60 transition-colors cursor-pointer group">
      <div className="p-2 rounded-lg bg-primary/10 h-fit">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1">
        <h4 className="font-semibold mb-1 flex items-center gap-2">
          {title}
          <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </h4>
        <p className="text-sm text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}

export default function RiskIntelligencePage() {
  return (
    <>
    <AnimatedShaderBackground />
    <div className="section-container pt-24 pb-20 space-y-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-primary/10">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Risk Intelligence</h1>
          <p className="text-muted-foreground">Understanding threat assessment scales</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Torino Scale */}
        <Card className="border-white/5 bg-card/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Torino Impact Hazard Scale
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <TorinoGauge level={0} />
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded bg-green-500/10 border border-green-500/20">
                <span className="block text-green-500 font-bold">0-1</span>
                <span className="text-muted-foreground">No Concern</span>
              </div>
              <div className="p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
                <span className="block text-yellow-500 font-bold">2-4</span>
                <span className="text-muted-foreground">Monitor</span>
              </div>
              <div className="p-2 rounded bg-red-500/10 border border-red-500/20">
                <span className="block text-red-500 font-bold">5-10</span>
                <span className="text-muted-foreground">Threat</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Palermo Scale */}
        <Card className="border-white/5 bg-card/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Palermo Technical Scale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PalermoBar value={-2.8} />
          </CardContent>
        </Card>

        {/* Orbit Uncertainty */}
        <Card className="border-white/5 bg-card/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              Orbit Uncertainty
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OrbitUncertainty />
          </CardContent>
        </Card>

        {/* Key Concepts */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Key Concepts</h3>
          <InfoCard icon={Target} title="Observation Arc">
            Time between first and last observation. Longer = more precise.
          </InfoCard>
          <InfoCard icon={Shield} title="Condition Code">
            0-9 scale of orbit certainty. 0 is best.
          </InfoCard>
          <InfoCard icon={Info} title="Error Ellipsoid">
            3D region where object might be located.
          </InfoCard>
        </div>
      </div>
    </div>
    </>
  );
}
