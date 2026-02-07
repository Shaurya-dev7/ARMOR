'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Satellite, 
  Search, 
  RefreshCw, 
  Globe, 
  Orbit,
  Zap,
  Filter,
  ArrowUpDown
} from 'lucide-react';

interface SatelliteData {
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
}

interface SatelliteStats {
  total: number;
  active: number;
  byOrbit: Record<string, number>;
  byType: Record<string, number>;
}

export default function SatellitesPage() {
  const [satellites, setSatellites] = useState<SatelliteData[]>([]);
  const [filteredSatellites, setFilteredSatellites] = useState<SatelliteData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [stats, setStats] = useState<SatelliteStats>({ total: 0, active: 0, byOrbit: {}, byType: {} });

  const fetchSatellites = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch from both sources
      const [celestrakRes, spacetrackRes] = await Promise.allSettled([
        fetch('/api/satellites'),
        fetch('/api/spacetrack?limit=50&type=PAYLOAD'),
      ]);

      let allSatellites: SatelliteData[] = [];

      if (celestrakRes.status === 'fulfilled' && celestrakRes.value.ok) {
        const json = await celestrakRes.value.json();
        allSatellites = [...allSatellites, ...(json.objects || [])];
      }

      if (spacetrackRes.status === 'fulfilled' && spacetrackRes.value.ok) {
        const json = await spacetrackRes.value.json();
        // Merge Space-Track data, avoiding duplicates by NORAD ID
        const existingIds = new Set(allSatellites.map(s => s.norad_id));
        const newSats = (json.objects || []).filter((s: SatelliteData) => !existingIds.has(s.norad_id));
        allSatellites = [...allSatellites, ...newSats];
      }

      setSatellites(allSatellites);
      setFilteredSatellites(allSatellites);

      // Calculate stats
      const active = allSatellites.filter(s => s.status === 'ACTIVE').length;
      const byOrbit: Record<string, number> = {};
      const byType: Record<string, number> = {};
      
      allSatellites.forEach(sat => {
        byOrbit[sat.orbit_class] = (byOrbit[sat.orbit_class] || 0) + 1;
        byType[sat.object_type] = (byType[sat.object_type] || 0) + 1;
      });

      setStats({ total: allSatellites.length, active, byOrbit, byType });

    } catch (err) {
      setError('Failed to load satellite data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSatellites();
  }, []);

  useEffect(() => {
    let filtered = satellites;
    
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.norad_id.toString().includes(searchTerm)
      );
    }
    
    if (activeFilter !== 'all') {
      filtered = filtered.filter(s => s.orbit_class === activeFilter);
    }
    
    setFilteredSatellites(filtered);
  }, [searchTerm, activeFilter, satellites]);

  const orbitColors: Record<string, string> = {
    LEO: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    MEO: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    GEO: 'bg-green-500/10 text-green-500 border-green-500/20',
    HEO: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  };

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Space Assets</h1>
            <Badge variant="outline">{stats.total} objects</Badge>
          </div>
          <p className="text-muted-foreground">
            Satellite catalog from CelesTrak & Space-Track
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or NORAD ID..."
              className="h-9 w-full md:w-[250px] rounded-md border border-input bg-background pl-9 pr-3 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" className="h-9" onClick={fetchSatellites} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="border-white/5 bg-card/40 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Satellite className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/5 bg-card/40 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Zap className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-500">{stats.active}</div>
                <div className="text-xs text-muted-foreground">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/5 bg-card/40 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Globe className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-500">{stats.byOrbit.LEO || 0}</div>
                <div className="text-xs text-muted-foreground">LEO</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/5 bg-card/40 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Orbit className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-500">{stats.byOrbit.MEO || 0}</div>
                <div className="text-xs text-muted-foreground">MEO</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/5 bg-card/40 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Globe className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-500">{stats.byOrbit.GEO || 0}</div>
                <div className="text-xs text-muted-foreground">GEO</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/5 bg-card/40 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Orbit className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-500">{stats.byOrbit.HEO || 0}</div>
                <div className="text-xs text-muted-foreground">HEO</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        <Button 
          variant={activeFilter === 'all' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setActiveFilter('all')}
        >
          All
        </Button>
        {Object.keys(stats.byOrbit).map((orbit) => (
          <Button 
            key={orbit}
            variant={activeFilter === orbit ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setActiveFilter(orbit)}
          >
            {orbit} ({stats.byOrbit[orbit]})
          </Button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="border-white/5 bg-card/40">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="h-5 w-32 bg-white/10 rounded animate-pulse" />
                  <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={fetchSatellites}>Try Again</Button>
        </div>
      )}

      {/* Satellite Grid */}
      {!isLoading && !error && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSatellites.map((sat) => (
            <Card key={sat.norad_id} className="border-white/5 bg-card/40 backdrop-blur-sm hover:bg-card/60 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate" title={sat.name}>{sat.name}</h3>
                    <p className="text-xs text-muted-foreground">NORAD: {sat.norad_id}</p>
                  </div>
                  <Badge variant="outline" className={orbitColors[sat.orbit_class] || 'bg-gray-500/10'}>
                    {sat.orbit_class}
                  </Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Status</span>
                    <div className={`font-medium ${sat.status === 'ACTIVE' ? 'text-green-500' : 'text-muted-foreground'}`}>
                      {sat.status || 'Unknown'}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Country</span>
                    <div className="font-medium">{sat.country || 'Unknown'}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type</span>
                    <div className="font-medium">{sat.object_type || 'Unknown'}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Period</span>
                    <div className="font-medium">{sat.period_minutes ? `${sat.period_minutes.toFixed(1)} min` : '--'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredSatellites.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No satellites found matching your criteria.
        </div>
      )}
    </div>
  );
}
