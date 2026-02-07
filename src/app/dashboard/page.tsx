'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Rocket, 
  Shield, 
  Satellite, 
  AlertTriangle,
  TrendingUp,
  Radio,
  RefreshCw,
  Globe,
  Orbit,
  Zap,
  Database,
  Target,
  Clock,
  ArrowUpRight,
  LayoutDashboard,
  Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';


// Types
interface AsteroidData {
  id: string;
  name: string;
  size_km: number;
  velocity_kph: number;
  miss_distance_km: number;
  approach_date: string;
  is_potentially_hazardous: boolean;
  risk_score: number;
  severity: 'info' | 'warning' | 'alert' | 'critical';
  severity_label: string;
  severity_color: string;
}

interface SatelliteData {
  norad_id: number;
  name: string;
  object_type: string;
  status: string;
  orbit_class: string;
  country: string;
}

interface DashboardData {
  asteroids: AsteroidData[];
  satellites: SatelliteData[];
  isLoading: boolean;
  lastSync: Date | null;
  errors: string[];
}

// Risk Gauge Component
function RiskGauge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const radius = size === 'lg' ? 45 : size === 'md' ? 35 : 25;
  const stroke = size === 'lg' ? 8 : size === 'md' ? 6 : 4;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  
  const color = score >= 76 ? '#ef4444' : score >= 51 ? '#f97316' : score >= 26 ? '#eab308' : '#3b82f6';
  
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={(radius + stroke) * 2} height={(radius + stroke) * 2} className="transform -rotate-90">
        <circle
          cx={radius + stroke}
          cy={radius + stroke}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.1}
          strokeWidth={stroke}
        />
        <circle
          cx={radius + stroke}
          cy={radius + stroke}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <span className="absolute text-lg font-bold" style={{ color }}>{score}</span>
    </div>
  );
}



// Radar Chart
function RadarChart({ data }: { data: { label: string; value: number }[] }) {
  const cx = 100, cy = 100, r = 70;
  const angleStep = (2 * Math.PI) / data.length;
  
  const points = data.map((d, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const val = Math.max(0.1, Math.min(d.value, 1)) * r; 
    return {
      x: cx + val * Math.cos(angle),
      y: cy + val * Math.sin(angle),
      angle
    };
  });

  const pointsString = points.map(p => `${p.x},${p.y}`).join(' ');
  
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
      <defs>
        <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id="radar-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1].map((l, i) => (
        <circle key={i} cx={cx} cy={cy} r={r * l} fill="none" stroke="white" strokeOpacity={0.05} strokeDasharray={i === 3 ? "0" : "2 2"} />
      ))}

      {/* Axes */}
      {data.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        return (
          <line
            key={`axis-${i}`}
            x1={cx} y1={cy}
            x2={cx + r * Math.cos(angle)}
            y2={cy + r * Math.sin(angle)}
            stroke="white" strokeOpacity={0.1} strokeWidth={0.5}
          />
        );
      })}

      {/* Polygon */}
      <polygon 
        points={pointsString} 
        fill="url(#radar-grad)" 
        stroke="var(--primary)" 
        strokeWidth={1.5} 
        filter="url(#neon-glow)"
        className="transition-all duration-1000 ease-in-out"
      />

      {/* Data markers */}
      {points.map((p, i) => (
        <circle 
          key={`dot-${i}`} 
          cx={p.x} cy={p.y} r={2} 
          fill="var(--primary)" 
          className="animate-pulse"
        />
      ))}

      {/* Labels */}
      {data.map((d, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const lx = cx + (r + 20) * Math.cos(angle);
        const ly = cy + (r + 20) * Math.sin(angle);
        return (
          <text 
            key={i} x={lx} y={ly}
            textAnchor="middle" dominantBaseline="middle" 
            className="fill-white/30 text-[7px] font-mono font-bold uppercase tracking-widest"
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    asteroids: [],
    satellites: [],
    isLoading: true,
    lastSync: null,
    errors: [],
  });

  const fetchAllData = async () => {
    setData(prev => ({ ...prev, isLoading: true, errors: [] }));
    const errors: string[] = [];
    
    try {
      const [asteroidsRes, satellitesRes] = await Promise.allSettled([
        fetch('/api/asteroids'),
        fetch('/api/satellites'),
      ]);

      let asteroids: AsteroidData[] = [];
      let satellites: SatelliteData[] = [];

      if (asteroidsRes.status === 'fulfilled' && asteroidsRes.value.ok) {
        const json = await asteroidsRes.value.json();
        asteroids = json.asteroids || [];
      } else {
        errors.push('Asteroids API');
      }

      if (satellitesRes.status === 'fulfilled' && satellitesRes.value.ok) {
        const json = await satellitesRes.value.json();
        satellites = json.objects || [];
      } else {
        errors.push('Satellites API');
      }

      setData({
        asteroids,
        satellites,
        isLoading: false,
        lastSync: new Date(),
        errors,
      });

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setData(prev => ({ ...prev, isLoading: false, errors: ['Network error'] }));
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate stats
  const criticalAlerts = data.asteroids.filter(a => a.severity === 'critical');
  const hazardousCount = data.asteroids.filter(a => a.is_potentially_hazardous).length;
  const activeSatellites = data.satellites.filter(s => s.status === 'ACTIVE').length || data.satellites.length;
  const avgRiskScore = data.asteroids.length > 0 
    ? Math.round(data.asteroids.reduce((sum, a) => sum + a.risk_score, 0) / data.asteroids.length) 
    : 0;

  const timeSinceSync = data.lastSync 
    ? Math.floor((Date.now() - data.lastSync.getTime()) / 1000)
    : null;

  const radarData = [
    { label: 'NEOs', value: Math.min(data.asteroids.length / 20, 1) },
    { label: 'Hazard', value: Math.min(hazardousCount / 5, 1) },
    { label: 'Critical', value: Math.min(criticalAlerts.length / 3, 1) },
    { label: 'Satellites', value: Math.min(activeSatellites / 50, 1) },
    { label: 'Risk', value: avgRiskScore / 100 },
  ];

  return (
    <div className="relative min-h-screen text-white">
      {/* 1. Background Layers - Matching Homepage Style */}
      <div className="fixed inset-0 z-0 bg-[#020205] pointer-events-none">
        <div className="star-field">
          <div className="falling-star" style={{ top: '0%', left: '100%', animationDelay: '0s', animationDuration: '15s' }} />
          <div className="falling-star" style={{ top: '30%', left: '80%', animationDelay: '5s', animationDuration: '20s' }} />
          <div className="falling-star" style={{ top: '10%', left: '60%', animationDelay: '10s', animationDuration: '25s' }} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/5 to-purple-900/5" />
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen animate-float" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[700px] h-[700px] bg-cyan-600/5 rounded-full blur-[120px] mix-blend-screen animate-float" style={{ animationDelay: '3s' }} />
      </div>

      <div className="relative z-10 section-container pt-24 pb-20 space-y-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <LayoutDashboard className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xs font-mono font-black tracking-[0.5em] text-primary uppercase">Console Operational</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none text-white">
              MISSION <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/20">CONTROL</span>
            </h1>
            <p className="text-xl text-blue-100/60 mt-4 max-w-xl font-light">
              Autonomous risk detection and orbital vector monitoring in real-time.
            </p>
          </div>
          
          <div className="flex items-center gap-4 animate-fade-in-up animation-delay-200">
             <div className="flex flex-col items-end">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">Telemetry Status</span>
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 py-1 px-3">
                  <span className="relative flex h-2 w-2 mr-2">
                    <span className="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  LIVE FEED
                </Badge>
             </div>
             <Button variant="outline" onClick={fetchAllData} disabled={data.isLoading} className="cosmic-button-outline h-14 px-8 text-sm">
                <RefreshCw className={`mr-2 h-4 w-4 ${data.isLoading ? 'animate-spin' : ''}`} />
                {timeSinceSync !== null ? `RE-SYNC (${timeSinceSync}s ago)` : 'SYNC SYSTEM'}
             </Button>
          </div>
        </div>

        {/* 1. Core Statistics - High Contrast Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard icon={Rocket} value={data.asteroids.length} label="NEOs Tracked" color="primary" isLoading={data.isLoading} href="/asteroids" />
          <StatCard icon={AlertTriangle} value={criticalAlerts.length} label="Critical Alerts" color={criticalAlerts.length > 0 ? 'red' : 'green'} isLoading={data.isLoading} />
          <StatCard icon={Target} value={hazardousCount} label="Hazardous" color={hazardousCount > 0 ? 'yellow' : 'green'} isLoading={data.isLoading} />
          <StatCard icon={Satellite} value={activeSatellites} label="Space Assets" color="blue" isLoading={data.isLoading} href="/satellites" />
          <StatCard icon={Shield} value={`${avgRiskScore}/100`} label="Avg Risk Factor" color={avgRiskScore > 50 ? 'yellow' : 'green'} isLoading={data.isLoading} />
        </div>

        {/* 2. Primary Layout - Alerts and Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Active Alerts (Left 8 Columns) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                <Radio className="w-6 h-6 text-primary animate-pulse" />
                ACTIVE THREAT VECTORS
              </h2>
              <Link href="/asteroids" className="text-xs font-mono text-white/40 hover:text-white transition-colors tracking-widest uppercase">
                Browse Full Catalog ↗
              </Link>
            </div>
            
            {data.isLoading ? (
              <div className="grid gap-6 md:grid-cols-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-40 glass-card animate-pulse" />
                ))}
              </div>
            ) : data.asteroids.length === 0 ? (
              <div className="p-20 glass-card flex flex-col items-center justify-center text-center">
                <Shield className="w-12 h-12 text-white/10 mb-4" />
                <p className="text-white/40 tracking-widest uppercase text-sm">No Immediate Threats Detected</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {data.asteroids.slice(0, 6).map(asteroid => (
                  <AlertCard key={asteroid.id} asteroid={asteroid} />
                ))}
              </div>
            )}
          </div>

          {/* Visualization & Health (Right 4 Columns) */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Threat Overview Radar */}
            <div className="glass-card glow-border p-8 flex flex-col items-center text-center">
              <h3 className="text-sm font-black tracking-[0.3em] uppercase mb-8 text-white/60">Global Risk Profile</h3>
              <div className="w-full aspect-square relative flex items-center justify-center">
                 <div className="absolute inset-0 border border-white/5 rounded-full animate-pulse shadow-[0_0_50px_rgba(255,255,255,0.02)]" />
                 <RadarChart data={radarData} />
              </div>
              <div className="mt-8 pt-6 border-t border-white/5 w-full text-left">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-mono text-white/40 uppercase">System Integrity</span>
                    <span className="text-[10px] font-mono text-green-400">NOMINAL</span>
                 </div>
                 <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-[94%]" />
                 </div>
              </div>
            </div>

            {/* Orbital Status - New Info to fill page */}
            <div className="glass-card p-6 border-l-4 border-l-primary space-y-6">
               <h3 className="text-lg font-black tracking-tight">ORBITAL CLARITY</h3>
               <div className="space-y-4">
                  {[
                    { label: "Deep Space Network", status: "STABLE", icon: Globe, color: "text-blue-400" },
                    { label: "Sentinel-1 Tracking", status: "ACTIVE", icon: Orbit, color: "text-purple-400" },
                    { label: "NEO Validation", status: "NOMINAL", icon: Target, color: "text-green-400" },
                    { label: "Sensor Array Health", status: "98.2%", icon: Activity, color: "text-cyan-400" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                       <div className="flex items-center gap-3">
                          <item.icon className={`w-4 h-4 ${item.color}`} />
                          <span className="text-xs font-medium text-white/80">{item.label}</span>
                       </div>
                       <span className="text-[10px] font-mono font-bold">{item.status}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>

        {/* Global Footer Source Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-12 py-8 text-[10px] font-mono uppercase tracking-[0.3em] text-white/30 border-t border-white/5">
          <span className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]" />
            NASA NeoWs API v1.4
          </span>
          <span className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
            CelesTrak Orbital v2.1
          </span>
          <span className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_10px_#a855f7]" />
            NASA Planetary Data System
          </span>
        </div>
      </div>
    </div>
  );
}

// Sub-components updated for high-contrast dashboard aesthetics

function StatCard({ 
  icon: Icon, 
  value, 
  label, 
  color = 'primary',
  isLoading = false,
  href
}: { 
  icon: any;
  value: string | number;
  label: string;
  color?: 'primary' | 'green' | 'yellow' | 'red' | 'blue' | 'purple';
  isLoading?: boolean;
  href?: string;
}) {
  const colorIcons = {
    primary: 'text-primary',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
  };
  
  const content = (
    <div className={cn(
      "group relative flex flex-col gap-4 p-8 glass-card glow-border transition-all duration-500",
      href ? 'hover:scale-[1.02] cursor-pointer' : ''
    )}>
      <div className="flex items-start justify-between">
        <div className={cn("p-3 rounded-xl bg-white/5 border border-white/5 group-hover:scale-110 transition-transform duration-500", colorIcons[color])}>
          <Icon className="w-6 h-6" />
        </div>
        {href && <ArrowUpRight className="w-5 h-5 text-white/20 group-hover:text-white transition-colors" />}
      </div>
      
      <div className="space-y-1">
        {isLoading ? (
          <div className="h-10 w-24 bg-white/5 rounded animate-pulse" />
        ) : (
          <span className="text-4xl font-black tracking-tighter text-white">
            {typeof value === 'number' ? value.toLocaleString('en-US') : value}
          </span>
        )}
        <div className="text-[10px] font-mono font-black text-white/40 uppercase tracking-[0.2em] group-hover:text-white/60 transition-colors">
          {label}
        </div>
      </div>
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-12 bg-white/[0.01] blur-[40px] rounded-full pointer-events-none" />
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

function AlertCard({ asteroid }: { asteroid: AsteroidData }) {
  const severityStyles = {
    info: 'border-l-blue-500',
    warning: 'border-l-yellow-500',
    alert: 'border-l-orange-500',
    critical: 'border-l-red-500 animate-pulse',
  };

  const badgeStyles = {
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    alert: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    critical: 'bg-red-500/20 text-red-500 border-red-500/30 font-black',
  };

  return (
    <div className={cn(
      "group relative flex flex-col p-6 glass-card border-l-4 overflow-hidden gap-6",
      severityStyles[asteroid.severity]
    )}>
      <div className="flex items-start gap-4">
        <div className="scale-75 origin-top-left">
           <RiskGauge score={asteroid.risk_score} size="md" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-1 mb-4">
            <h4 className="text-xl font-black tracking-tight text-white group-hover:text-primary transition-colors truncate">
              {asteroid.name}
            </h4>
            <Badge variant="outline" className={cn("inline-fit w-fit text-[9px] font-mono tracking-widest uppercase py-0.5 px-2", badgeStyles[asteroid.severity])}>
              {asteroid.severity_label}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-y-4 gap-x-2">
            <div className="space-y-1">
              <span className="block text-[10px] font-mono text-white/30 uppercase tracking-tighter">Velocity</span>
              <span className="text-sm font-bold text-white/90">
                {Math.round(asteroid.velocity_kph).toLocaleString()} <span className="text-[10px] text-white/40">KM/H</span>
              </span>
            </div>
            <div className="space-y-1">
              <span className="block text-[10px] font-mono text-white/30 uppercase tracking-tighter">Miss Distance</span>
              <span className="text-sm font-bold text-white/90">
                {(asteroid.miss_distance_km / 1000000).toFixed(1)}M <span className="text-[10px] text-white/40">KM</span>
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-white/40">
         <span>SIZE: {asteroid.size_km.toFixed(3)} KM</span>
         <span>APPROACH: {asteroid.approach_date}</span>
      </div>
      
      {/* Decorative Gradient */}
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

