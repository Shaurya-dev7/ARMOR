'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Search, 
  RefreshCw, 
  AlertTriangle,
  Shield,
  Rocket,
  Target,
  EyeOff,
  Eye
} from 'lucide-react';
import Link from 'next/link';

interface Asteroid {
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
  // New Interpretation Fields
  is_suppressed: boolean;
  civilian_relevance: string;
  confidence: string;
}

// Risk Gauge Component
function RiskGauge({ score }: { score: number }) {
  const radius = 28;
  const stroke = 5;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  
  const color = score >= 76 ? '#ef4444' : score >= 51 ? '#f97316' : score >= 26 ? '#eab308' : '#3b82f6';
  
  return (
    <div className="relative flex items-center justify-center w-16 h-16">
      <svg width="66" height="66" className="transform -rotate-90">
        <circle cx="33" cy="33" r={radius} fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth={stroke} />
        <circle cx="33" cy="33" r={radius} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circumference} strokeDashoffset={circumference - progress}
          strokeLinecap="round" className="transition-all duration-500" />
      </svg>
      <span className="absolute text-sm font-bold" style={{ color }}>{score}</span>
    </div>
  );
}

export default function AsteroidsPage() {
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [filteredAsteroids, setFilteredAsteroids] = useState<Asteroid[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showSuppressed, setShowSuppressed] = useState(false);

  const fetchAsteroids = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/asteroids');
      const data = await response.json();
      
      if (data.asteroids && Array.isArray(data.asteroids)) {
        setAsteroids(data.asteroids);
      } else {
        setError('Failed to load asteroid data');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Failed to fetch asteroids:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAsteroids();
  }, []);

  useEffect(() => {
    let filtered = asteroids;
    
    // 1. Suppression Filter (Default: Hide suppressed)
    if (!showSuppressed) {
      filtered = filtered.filter(a => !a.is_suppressed);
    }
    
    // 2. Search Filter
    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // 3. Severity Filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(a => a.severity === activeFilter);
    }
    
    setFilteredAsteroids(filtered);
  }, [searchTerm, activeFilter, showSuppressed, asteroids]);

  const severityCounts = {
    critical: asteroids.filter(a => a.severity === 'critical' && (!a.is_suppressed || showSuppressed)).length,
    alert: asteroids.filter(a => a.severity === 'alert' && (!a.is_suppressed || showSuppressed)).length,
    warning: asteroids.filter(a => a.severity === 'warning' && (!a.is_suppressed || showSuppressed)).length,
    info: asteroids.filter(a => a.severity === 'info' && (!a.is_suppressed || showSuppressed)).length,
  };

  const suppressedCount = asteroids.filter(a => a.is_suppressed).length;

  const severityColors: Record<string, string> = {
    critical: 'bg-red-500/10 text-red-500 border-red-500/20',
    alert: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    warning: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  };

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Asteroid Database</h1>
            <Badge variant="outline">{filteredAsteroids.length} visible</Badge>
          </div>
          <p className="text-muted-foreground">Near-Earth Objects with meaning-first interpretation</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              className="h-9 w-full md:w-[200px] rounded-md border border-input bg-background pl-9 pr-3 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" className="h-9" onClick={fetchAsteroids} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-card/40 border border-white/5">
          <div className="flex items-center gap-3">
            <Rocket className="w-5 h-5 text-primary" />
            <div>
              <div className="text-2xl font-bold">{asteroids.length}</div>
              <div className="text-xs text-muted-foreground">Total Analyzed</div>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card/40 border border-red-500/20">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <div>
              <div className="text-2xl font-bold text-red-500">{severityCounts.critical}</div>
              <div className="text-xs text-muted-foreground">Critical</div>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card/40 border border-orange-500/20">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-orange-500" />
            <div>
              <div className="text-2xl font-bold text-orange-500">{severityCounts.alert}</div>
              <div className="text-xs text-muted-foreground">Alerts</div>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card/40 border border-yellow-500/20">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-yellow-500" />
            <div>
              <div className="text-2xl font-bold text-yellow-500">{severityCounts.warning}</div>
              <div className="text-xs text-muted-foreground">Warnings</div>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card/40 border border-blue-500/20">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-blue-500" />
            <div>
              <div className="text-2xl font-bold text-blue-500">{severityCounts.info}</div>
              <div className="text-xs text-muted-foreground">Safe</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Toggles */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex gap-2 flex-wrap">
          <Button variant={activeFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setActiveFilter('all')}>
            All
          </Button>
          {(['critical', 'alert', 'warning', 'info'] as const).map(severity => (
            <Button 
              key={severity}
              variant={activeFilter === severity ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveFilter(severity)}
              className={activeFilter === severity ? '' : severityColors[severity]}
            >
              {severity.charAt(0).toUpperCase() + severity.slice(1)} ({severityCounts[severity]})
            </Button>
          ))}
        </div>

        {/* Suppression Toggle */}
        <div className="flex items-center gap-2">
           <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowSuppressed(!showSuppressed)}
            className="text-muted-foreground hover:text-foreground"
          >
            {showSuppressed ? (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Hide {suppressedCount} Suppressed
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Show {suppressedCount} Suppressed (Noise)
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-12">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={fetchAsteroids}>Try Again</Button>
        </div>
      )}

      {/* Asteroid List */}
      {!isLoading && !error && (
        <div className="space-y-3">
          {filteredAsteroids.map(asteroid => (
            <Card key={asteroid.id} className={`border-white/5 bg-card/40 backdrop-blur-sm hover:bg-card/60 transition-all ${asteroid.is_suppressed ? 'opacity-50 grayscale' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Risk Gauge */}
                  <RiskGauge score={asteroid.risk_score} />
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold truncate">{asteroid.name}</h3>
                      <Badge variant="outline" className={severityColors[asteroid.severity]}>
                        {asteroid.severity_label}
                      </Badge>
                      
                      {asteroid.is_suppressed && (
                        <Badge variant="secondary" className="text-[10px]">SUPPRESSED: NOISE</Badge>
                      )}
                      
                      {/* Confidence Badge */}
                      <Badge variant="outline" className="border-white/10 text-muted-foreground text-[10px]">
                         {asteroid.confidence.toUpperCase()} CONFIDENCE
                      </Badge>
                    </div>
                    
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span><span className="opacity-50">Size</span> {asteroid.size_km.toFixed(3)} km</span>
                      <span><span className="opacity-50">Dist</span> {(asteroid.miss_distance_km / 1000000).toFixed(2)}M km</span>
                      <span><span className="opacity-50">Vel</span> {Math.round(asteroid.velocity_kph / 1000)} km/s</span>
                      <span><span className="opacity-50">Date</span> {new Date(asteroid.approach_date).toLocaleDateString('en-US', { timeZone: 'UTC' })}</span>
                    </div>
                  </div>
                  
                  {/* Action */}
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/asteroids/${asteroid.id}`}>
                      {asteroid.is_suppressed ? 'Raw Data' : 'Details'} <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {filteredAsteroids.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              {showSuppressed 
                ? "No asteroids found." 
                : "No relevant events found. All visible data has been suppressed as noise."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
