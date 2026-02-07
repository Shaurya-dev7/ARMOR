/**
 * Satellites API Route
 * 
 * Server-side endpoint for fetching CelesTrak satellite catalog data.
 * No API key required, but server-side for caching.
 * 
 * Query Parameters:
 * - group: Catalog group (default: 'stations')
 *   Options: active, stations, starlink, geo, debris, etc.
 * - regime: Filter by orbit regime (optional)
 *   Options: LEO, MEO, GEO, HEO
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  fetchCelesTrakCatalog,
  normalizeCelesTrakData,
  filterByOrbitRegime,
  type CelesTrakGroup,
  type CelesTrakError,
  type OrbitRegime,
} from '@/lib/celestrak';

// Mock satellite data for fallback
const MOCK_SATELLITES = [
  {
    norad_id: 25544,
    name: 'ISS (ZARYA)',
    object_id: '1998-067A',
    epoch: new Date().toISOString(),
    epoch_timestamp: Date.now(),
    inclination_deg: 51.6,
    eccentricity: 0.0001,
    mean_motion: 15.5,
    raan_deg: 180,
    arg_perigee_deg: 90,
    mean_anomaly_deg: 45,
    bstar: 0.00001,
    orbit_regime: 'LEO' as const,
    approx_altitude_km: 420,
    source: 'Mock Data' as const,
  },
  {
    norad_id: 48274,
    name: 'CSS (TIANHE)',
    object_id: '2021-035A',
    epoch: new Date().toISOString(),
    epoch_timestamp: Date.now(),
    inclination_deg: 41.5,
    eccentricity: 0.0002,
    mean_motion: 15.6,
    raan_deg: 200,
    arg_perigee_deg: 85,
    mean_anomaly_deg: 120,
    bstar: 0.00001,
    orbit_regime: 'LEO' as const,
    approx_altitude_km: 390,
    source: 'Mock Data' as const,
  },
];

function getMockData(group: string) {
  return {
    catalog_group: group,
    satellites: MOCK_SATELLITES,
    count: MOCK_SATELLITES.length,
    fetched_at: Date.now(),
    is_mock: true,
  };
}

const VALID_GROUPS: CelesTrakGroup[] = [
  'active', 'stations', 'visual', 'starlink', 'oneweb', 
  'iridium', 'geo', 'gps-ops', 'galileo', 'debris',
  'cosmos-2251-debris', 'fengyun-1c-debris'
];

const VALID_REGIMES: OrbitRegime[] = ['LEO', 'MEO', 'GEO', 'HEO'];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const groupParam = searchParams.get('group') || 'stations';
  const regimeParam = searchParams.get('regime');

  // Validate group parameter
  if (!VALID_GROUPS.includes(groupParam as CelesTrakGroup)) {
    return NextResponse.json(
      { error: `Invalid group. Valid options: ${VALID_GROUPS.join(', ')}` },
      { status: 400 }
    );
  }

  const group = groupParam as CelesTrakGroup;

  // Validate regime if provided
  if (regimeParam && !VALID_REGIMES.includes(regimeParam as OrbitRegime)) {
    return NextResponse.json(
      { error: `Invalid regime. Valid options: ${VALID_REGIMES.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    const rawData = await fetchCelesTrakCatalog(group);
    let normalizedData = normalizeCelesTrakData(rawData, group);

    // Filter by regime if requested
    if (regimeParam) {
      const regime = regimeParam as OrbitRegime;
      const filtered = filterByOrbitRegime(normalizedData, regime);
      normalizedData = {
        ...normalizedData,
        satellites: filtered,
        count: filtered.length,
      };
    }

    return NextResponse.json(normalizedData, {
      headers: {
        'Cache-Control': 'public, max-age=600, s-maxage=600',
      },
    });

  } catch (err) {
    console.error('[Satellites API] Error:', err);

    if (typeof err === 'object' && err !== null && 'code' in err) {
      const celestrakError = err as CelesTrakError;
      
      return NextResponse.json({
        ...getMockData(group),
        warning: `API error: ${celestrakError.message}. Using mock data.`,
        error_code: celestrakError.code,
      });
    }

    return NextResponse.json({
      ...getMockData(group),
      warning: 'API unavailable. Using mock data.',
    });
  }
}
