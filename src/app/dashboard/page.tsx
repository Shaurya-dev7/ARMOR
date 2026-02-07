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
  Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';

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

// Stat Card Component
function StatCard({ 
  icon: Icon, 
  value, 
  label, 
  color = 'primary',
  isLoading = false,
  href
}: { 
  icon: React.ElementType;
  value: string | number;
  label: string;
  color?: 'primary' | 'green' | 'yellow' | 'red' | 'blue' | 'purple';
  isLoading?: boolean;
  href?: string;
}) {
  const colorClasses = {
    primary: 'text-primary bg-primary/10',
    green: 'text-green-500 bg-green-500/10',
    yellow: 'text-yellow-500 bg-yellow-500/10',
    red: 'text-red-500 bg-red-500/10',
    blue: 'text-blue-500 bg-blue-500/10',
    purple: 'text-purple-500 bg-purple-500/10',
  };
  
  const content = (
    <div className={`flex items-center gap-4 p-4 rounded-xl bg-card/40 border border-white/5 backdrop-blur-sm transition-all ${href ? 'hover:bg-card/60 cursor-pointer' : ''}`}>
      <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
        <Icon className={`w-5 h-5 ${isLoading ? 'animate-pulse' : ''}`} />
      </div>
      <div className="flex-1">
        {isLoading ? (
          <div className="h-8 w-16 bg-white/10 rounded animate-pulse" />
        ) : (
          <span className="text-2xl font-bold tracking-tight">
            {typeof value === 'number' ? value.toLocaleString('en-US') : value}
          </span>
        )}
        <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
      </div>
      {href && <ArrowUpRight className="w-4 h-4 text-muted-foreground" />}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

// Alert Card with Image Background
function AlertCard({ asteroid }: { asteroid: AsteroidData }) {
  const severityColors = {
    info: 'border-blue-500/30 bg-blue-500/5',
    warning: 'border-yellow-500/30 bg-yellow-500/5',
    alert: 'border-orange-500/30 bg-orange-500/5',
    critical: 'border-red-500/30 bg-red-500/5',
  };

  const badgeColors = {
    info: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
    warning: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
    alert: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
    critical: 'bg-red-500/20 text-red-500 border-red-500/30',
  };

  return (
    <div className={`relative p-4 rounded-xl border backdrop-blur-sm overflow-hidden ${severityColors[asteroid.severity]}`}>
      {/* Background Image */}
      <div 
        className="absolute inset-0 opacity-10 bg-cover bg-center"
        style={{ 
          backgroundImage: `url('https://images-assets.nasa.gov/image/PIA22946/PIA22946~small.jpg')` 
        }}
      />
      
      <div className="relative flex items-start gap-4">
        <RiskGauge score={asteroid.risk_score} size="sm" />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold truncate">{asteroid.name}</h4>
            <Badge variant="outline" className={`text-[10px] ${badgeColors[asteroid.severity]}`}>
              {asteroid.severity_label}
            </Badge>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
            <div>
              <span className="block opacity-60">Size</span>
              <span className="font-medium text-foreground">{asteroid.size_km.toFixed(3)} km</span>
            </div>
            <div>
              <span className="block opacity-60">Distance</span>
              <span className="font-medium text-foreground">{(asteroid.miss_distance_km / 1000000).toFixed(2)}M km</span>
            </div>
            <div>
              <span className="block opacity-60">Velocity</span>
              <span className="font-medium text-foreground">{Math.round(asteroid.velocity_kph / 1000)} km/s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Radar Chart
function RadarChart({ data }: { data: { label: string; value: number }[] }) {
  const cx = 100, cy = 100, r = 70;
  const angleStep = (2 * Math.PI) / data.length;
  
  const points = data.map((d, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const val = Math.min(d.value, 1) * r;
    return `${cx + val * Math.cos(angle)},${cy + val * Math.sin(angle)}`;
  }).join(' ');
  
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      {[0.25, 0.5, 0.75, 1].map((l, i) => (
        <circle key={i} cx={cx} cy={cy} r={r * l} fill="none" stroke="currentColor" strokeOpacity={0.1} />
      ))}
      <polygon points={points} fill="hsl(var(--primary))" fillOpacity={0.2} stroke="hsl(var(--primary))" strokeWidth={2} />
      {data.map((d, i) => {
        const angle = i * angleStep - Math.PI / 2;
        return (
          <text key={i} x={cx + (r + 16) * Math.cos(angle)} y={cy + (r + 16) * Math.sin(angle)}
            textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-[9px]">{d.label}</text>
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
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Mission Control</h1>
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Live
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">Real-time orbital intelligence with risk scoring</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAllData} disabled={data.isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${data.isLoading ? 'animate-spin' : ''}`} />
          {timeSinceSync !== null ? `${timeSinceSync}s ago` : 'Refresh'}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={Rocket} value={data.asteroids.length} label="NEOs Tracked" color="primary" isLoading={data.isLoading} href="/asteroids" />
        <StatCard icon={AlertTriangle} value={criticalAlerts.length} label="Critical Alerts" color={criticalAlerts.length > 0 ? 'red' : 'green'} isLoading={data.isLoading} />
        <StatCard icon={Target} value={hazardousCount} label="Hazardous" color={hazardousCount > 0 ? 'yellow' : 'green'} isLoading={data.isLoading} />
        <StatCard icon={Satellite} value={activeSatellites} label="Satellites" color="blue" isLoading={data.isLoading} href="/satellites" />
        <StatCard icon={Shield} value={`${avgRiskScore}/100`} label="Avg Risk Score" color={avgRiskScore > 50 ? 'yellow' : 'green'} isLoading={data.isLoading} />
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Alert Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Active Alerts
            </h2>
            <Link href="/asteroids" className="text-sm text-muted-foreground hover:text-foreground">
              View All →
            </Link>
          </div>
          
          {data.isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : data.asteroids.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No alerts at this time</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {data.asteroids.slice(0, 6).map(asteroid => (
                <AlertCard key={asteroid.id} asteroid={asteroid} />
              ))}
            </div>
          )}
        </div>

        {/* Radar Chart */}
        <Card className="border-white/5 bg-card/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Threat Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full aspect-square max-w-[200px] mx-auto">
              <RadarChart data={radarData} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Sources */}
      <div className="flex items-center justify-center gap-8 py-4 text-xs text-muted-foreground border-t border-white/5">
        <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500" />NASA NeoWs</span>
        <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" />CelesTrak</span>
        <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500" />NASA Images</span>
      </div>
    </div>
  );
}
