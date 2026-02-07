/**
 * Space-Track SATCAT API Route
 * 
 * Server-side endpoint for fetching Space-Track catalog data.
 * Protects credentials and returns normalized SpaceObject data.
 * 
 * Query Parameters:
 * - type: Object type filter (PAYLOAD, ROCKET_BODY, DEBRIS)
 * - country: Country code filter
 * - active: Set to 'true' to filter active objects only
 * - orbit: Orbit class filter (LEO, MEO, GEO, HEO)
 * - limit: Maximum results (default: 1000)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  fetchSatcat,
  normalizeSatcatData,
  filterByType,
  filterByOrbitClass,
  filterActive,
  type ObjectType,
  type OrbitClass,
  type SpaceTrackError,
} from '@/lib/spacetrack';

// Mock data for fallback
const MOCK_OBJECTS = [
  {
    norad_id: 25544,
    name: 'ISS (ZARYA)',
    object_id: '1998-067A',
    object_type: 'PAYLOAD' as const,
    country: 'ISS',
    launch_date: '1998-11-20',
    decay_date: null,
    inclination_deg: 51.6,
    period_minutes: 92.9,
    apogee_km: 422,
    perigee_km: 418,
    orbit_class: 'LEO' as const,
    status: 'ACTIVE' as const,
    rcs_size: 'LARGE' as const,
    source: 'Mock Data' as const,
  },
  {
    norad_id: 48274,
    name: 'CSS (TIANHE)',
    object_id: '2021-035A',
    object_type: 'PAYLOAD' as const,
    country: 'PRC',
    launch_date: '2021-04-29',
    decay_date: null,
    inclination_deg: 41.5,
    period_minutes: 91.5,
    apogee_km: 389,
    perigee_km: 382,
    orbit_class: 'LEO' as const,
    status: 'ACTIVE' as const,
    rcs_size: 'LARGE' as const,
    source: 'Mock Data' as const,
  },
];

function getMockData() {
  return {
    objects: MOCK_OBJECTS,
    count: MOCK_OBJECTS.length,
    counts_by_type: { payload: 2, rocket_body: 0, debris: 0, unknown: 0 },
    counts_by_orbit: { leo: 2, meo: 0, geo: 0, heo: 0, unknown: 0 },
    fetched_at: Date.now(),
    is_mock: true,
  };
}

const VALID_TYPES: ObjectType[] = ['PAYLOAD', 'ROCKET_BODY', 'DEBRIS', 'UNKNOWN'];
const VALID_ORBITS: OrbitClass[] = ['LEO', 'MEO', 'GEO', 'HEO', 'UNKNOWN'];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const typeParam = searchParams.get('type');
  const countryParam = searchParams.get('country');
  const activeParam = searchParams.get('active');
  const orbitParam = searchParams.get('orbit');
  const limitParam = searchParams.get('limit');

  // Validate type if provided
  if (typeParam && !VALID_TYPES.includes(typeParam as ObjectType)) {
    return NextResponse.json(
      { error: `Invalid type. Valid options: ${VALID_TYPES.join(', ')}` },
      { status: 400 }
    );
  }

  // Validate orbit if provided
  if (orbitParam && !VALID_ORBITS.includes(orbitParam as OrbitClass)) {
    return NextResponse.json(
      { error: `Invalid orbit. Valid options: ${VALID_ORBITS.join(', ')}` },
      { status: 400 }
    );
  }

  // Check credentials exist
  if (!process.env.SPACETRACK_USERNAME || !process.env.SPACETRACK_PASSWORD) {
    console.warn('[SpaceTrack API] Credentials not configured, using mock data');
    return NextResponse.json({
      ...getMockData(),
      warning: 'Space-Track credentials not configured. Using mock data.',
    });
  }

  try {
    const rawData = await fetchSatcat({
      query: {
        objectType: typeParam as ObjectType | undefined,
        country: countryParam || undefined,
        activeOnly: activeParam === 'true',
        limit: limitParam ? parseInt(limitParam, 10) : 1000,
      },
    });

    let normalized = normalizeSatcatData(rawData);

    // Apply additional filters if needed
    if (orbitParam) {
      const filtered = filterByOrbitClass(normalized, orbitParam as OrbitClass);
      normalized = {
        ...normalized,
        objects: filtered,
        count: filtered.length,
      };
    }

    return NextResponse.json(normalized, {
      headers: {
        // Cache for 1 hour - SATCAT doesn't change frequently
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });

  } catch (err) {
    console.error('[SpaceTrack API] Error:', err);

    if (typeof err === 'object' && err !== null && 'code' in err) {
      const stError = err as SpaceTrackError;

      return NextResponse.json({
        ...getMockData(),
        warning: `API error: ${stError.message}. Using mock data.`,
        error_code: stError.code,
      });
    }

    return NextResponse.json({
      ...getMockData(),
      warning: 'API unavailable. Using mock data.',
    });
  }
}
