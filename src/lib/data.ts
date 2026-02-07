export type RiskLevel = 'None' | 'Low' | 'Monitor' | 'Attention' | 'Critical';

export interface Asteroid {
  id: string;
  name: string;
  size_km: number;
  velocity_kph: number;
  miss_distance_km: number;
  approach_date: string;
  risk_earth: RiskLevel;
  risk_human: RiskLevel;
  risk_iss: RiskLevel;
  risk_satellites: RiskLevel;
  confidence: 'High' | 'Medium' | 'Low';
  details: string;
}

export interface Satellite {
  id: string;
  name: string;
  orbit: 'LEO' | 'MEO' | 'GEO';
  status: 'Active' | 'Inactive' | 'Debris';
  risk_level: RiskLevel;
}

export const MOCK_ASTEROIDS: Asteroid[] = [
  {
    id: '2025-CW1',
    name: '2025 CW1',
    size_km: 0.12,
    velocity_kph: 45000,
    miss_distance_km: 150000,
    approach_date: '2026-02-14T10:00:00Z',
    risk_earth: 'None',
    risk_human: 'None',
    risk_iss: 'Monitor',
    risk_satellites: 'Attention',
    confidence: 'High',
    details: 'Passing through GEO belt. High relevance for communication satellites.',
  },
  {
    id: '2024-XY2',
    name: '2024 XY2',
    size_km: 0.8,
    velocity_kph: 62000,
    miss_distance_km: 2500000,
    approach_date: '2026-03-01T14:30:00Z',
    risk_earth: 'Low',
    risk_human: 'None',
    risk_iss: 'None',
    risk_satellites: 'None',
    confidence: 'Medium',
    details: 'Large object, safe distance. Informational tracking only.',
  },
  {
    id: '2026-AB3',
    name: '2026 AB3',
    size_km: 0.04,
    velocity_kph: 28000,
    miss_distance_km: 35000,
    approach_date: '2026-02-10T08:15:00Z',
    risk_earth: 'None',
    risk_human: 'None',
    risk_iss: 'Attention',
    risk_satellites: 'Monitor',
    confidence: 'High',
    details: 'Approaching within GEO belt. Potential conjunction with inactive debris.',
  },
  {
     id: '99942-A',
     name: '99942 Apophis (Sim)',
     size_km: 0.37,
     velocity_kph: 30000,
     miss_distance_km: 31000,
     approach_date: '2029-04-13T21:46:00Z',
     risk_earth: 'Monitor',
     risk_human: 'None',
     risk_iss: 'Attention',
     risk_satellites: 'Critical',
     confidence: 'High',
     details: 'Famous close approach simulation. Will pass closer than many satellites.',
  }
];

export const MOCK_SATELLITES: Satellite[] = [
  { id: 'ISS', name: 'International Space Station', orbit: 'LEO', status: 'Active', risk_level: 'Low' },
  { id: 'HST', name: 'Hubble Space Telescope', orbit: 'LEO', status: 'Active', risk_level: 'None' },
  { id: 'GPS-III', name: 'GPS Block III', orbit: 'MEO', status: 'Active', risk_level: 'None' },
  { id: 'SAT-COM-1', name: 'Commercial Comsat 1', orbit: 'GEO', status: 'Active', risk_level: 'Monitor' },
];

export const MOCK_ALERTS = [
  {
    type: 'info',
    message: 'New tracking data available for 2025 CW1. Confidence increased to High.',
    timestamp: '2h ago',
  },
  {
    type: 'warning',
    message: 'Conjunction warning: 2026 AB3 passes near GEO belt sector 4.',
    timestamp: '5h ago',
  },
];

// =============================================================================
// LIVE DATA FETCHING (NASA NeoWs Integration)
// =============================================================================

import type { NormalizedNeoWsData } from '@/lib/neows/types';

/**
 * Fetch live asteroid data from the internal NeoWs API route.
 * Falls back to mock data if the API is unavailable.
 * 
 * @returns Normalized NeoWs data or null if unavailable
 */
export async function fetchLiveAsteroids(): Promise<NormalizedNeoWsData | null> {
  try {
    const response = await fetch('/api/neows', {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    
    if (!response.ok) {
      console.warn('[Data] NeoWs API returned non-OK status:', response.status);
      return null;
    }
    
    const data: NormalizedNeoWsData = await response.json();
    return data;
    
  } catch (err) {
    console.warn('[Data] Failed to fetch live asteroid data:', err);
    return null;
  }
}

/**
 * Convert NeoWs data to the legacy Asteroid format used by the UI.
 * This maintains backward compatibility with existing components.
 */
export function convertNeoWsToLegacyFormat(
  neoWsData: NormalizedNeoWsData
): Asteroid[] {
  return neoWsData.events.map((event) => {
    const asteroid = neoWsData.asteroids.find(a => a.id === event.asteroid_id);
    
    // Determine approximate risk levels based on miss distance
    // NOTE: This is for display only, not scientific assessment
    const missDistanceKm = event.miss_distance_km;
    let riskSatellites: RiskLevel = 'None';
    let riskIss: RiskLevel = 'None';
    
    if (missDistanceKm < 42000) {
      riskSatellites = 'Critical';
      riskIss = 'Attention';
    } else if (missDistanceKm < 200000) {
      riskSatellites = 'Attention';
    } else if (missDistanceKm < 500000) {
      riskSatellites = 'Monitor';
    }
    
    if (missDistanceKm < 400) {
      riskIss = 'Critical';
    } else if (missDistanceKm < 1000) {
      riskIss = 'Attention';
    }
    
    return {
      id: event.asteroid_id,
      name: asteroid?.name ?? event.asteroid_name,
      size_km: asteroid ? (asteroid.diameter_min_km + asteroid.diameter_max_km) / 2 : 0,
      velocity_kph: event.relative_velocity_km_s * 3600,
      miss_distance_km: missDistanceKm,
      approach_date: new Date(event.approach_timestamp).toISOString(),
      risk_earth: asteroid?.hazardous_flag ? 'Monitor' : 'None',
      risk_human: 'None', // NeoWs does not provide this
      risk_iss: riskIss,
      risk_satellites: riskSatellites,
      confidence: 'High', // NeoWs data is considered reliable
      details: `Close approach on ${event.approach_date}. Data source: NASA NeoWs.`,
    };
  });
}

