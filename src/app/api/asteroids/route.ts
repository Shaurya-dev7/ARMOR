/**
 * Asteroids API Route
 * 
 * Server-side endpoint for fetching NASA NeoWs asteroid data.
 * Protects API key and returns normalized data with risk scores.
 * 
 * Query Parameters:
 * - start: Start date (YYYY-MM-DD, default: today)
 * - end: End date (YYYY-MM-DD, default: today)
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchNeoWsFeed } from '@/lib/neows/client';
import { normalizeNeoWsFeed } from '@/lib/neows/normalize';
import { calculateRiskScore, assessRiskFromDecision } from '@/lib/alerts/risk-score';
import { interpretAsteroid } from '@/lib/interpretation/asteroid-interpreter';
import { AsteroidInput } from '@/lib/interpretation/types';
import { MOCK_ASTEROIDS } from '@/lib/data';

interface FlatAsteroid {
  id: string;
  name: string;
  size_km: number;
  velocity_kph: number;
  miss_distance_km: number;
  approach_date: string;
  is_potentially_hazardous: boolean;
  risk_score: number;
  severity: string;
  severity_label: string;
  severity_color: string;
  // Interpretation fields
  is_suppressed: boolean;
  civilian_relevance: string;
  confidence: string;
}

/**
 * Convert mock data to normalized format for fallback.
 */
function getMockData() {
  const asteroids: FlatAsteroid[] = MOCK_ASTEROIDS.map(a => {
    const risk = calculateRiskScore({
      size_km: a.size_km,
      velocity_kph: a.velocity_kph,
      miss_distance_km: a.miss_distance_km,
      is_potentially_hazardous: a.risk_earth !== 'None',
    });

    return {
      id: a.id,
      name: a.name,
      size_km: a.size_km,
      velocity_kph: a.velocity_kph,
      miss_distance_km: a.miss_distance_km,
      approach_date: a.approach_date,
      is_potentially_hazardous: a.risk_earth !== 'None',
      risk_score: risk.score,
      severity: risk.severity,
      severity_label: risk.label,
      severity_color: risk.color,
      is_suppressed: false,
      civilian_relevance: 'low',
      confidence: 'medium',
    };
  });

  return {
    asteroids,
    count: asteroids.length,
    date_range: {
      start: new Date().toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
    fetched_at: Date.now(),
    is_mock: true,
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const today = new Date().toISOString().split('T')[0];
  const startDate = searchParams.get('start') || today;
  const endDate = searchParams.get('end') || today;

  // Validate API key exists
  if (!process.env.NASA_API_KEY) {
    console.error('[Asteroids API] NASA_API_KEY not configured');
    return NextResponse.json({
      ...getMockData(),
      warning: 'Using mock data - NASA API key not configured',
    });
  }

  try {
    const rawData = await fetchNeoWsFeed({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });

    const normalizedData = normalizeNeoWsFeed(rawData);

    // Flatten and enrich with risk scores
    const asteroids: FlatAsteroid[] = normalizedData.events.map(event => {
      const asteroid = normalizedData.asteroids.find(a => a.id === event.asteroid_id);
      const size_km = asteroid 
        ? (asteroid.diameter_min_km + asteroid.diameter_max_km) / 2 
        : 0.1;
      const velocity_kph = event.relative_velocity_km_s * 3600;
      
      // 1. Run Interpretation (Meaning-First)
      const input: AsteroidInput = {
        object_id: event.asteroid_id,
        name: event.asteroid_name,
        diameter_min_km: asteroid?.diameter_min_km || 0.1,
        diameter_max_km: asteroid?.diameter_max_km || 0.1,
        velocity_km_s: event.relative_velocity_km_s,
        miss_distance_km: event.miss_distance_km,
        approach_time: event.approach_date,
        potentially_hazardous_flag: asteroid?.hazardous_flag || false,
        sentry_flag: asteroid?.sentry_flag || false,
      };

      const decision = interpretAsteroid(input, {
        current_time: new Date().toISOString(),
        prediction_horizon_hours: 168,
        data_age_hours: 1, // Fresh data
      });

      // 2. Map Decision to Risk Assessment
      const risk = assessRiskFromDecision(decision);

      return {
        id: event.asteroid_id,
        name: event.asteroid_name,
        size_km,
        velocity_kph,
        miss_distance_km: event.miss_distance_km,
        approach_date: event.approach_date,
        is_potentially_hazardous: asteroid?.hazardous_flag || false,
        risk_score: risk.score,
        severity: risk.severity,
        severity_label: risk.label,
        severity_color: risk.color,
        is_suppressed: decision.suppressed,
        civilian_relevance: decision.relevance.civilian_relevance,
        confidence: decision.confidence.confidence_level,
      };
    });

    // Sort by risk score (highest first)
    asteroids.sort((a, b) => b.risk_score - a.risk_score);

    return NextResponse.json({
      asteroids,
      count: asteroids.length,
      date_range: normalizedData.date_range,
      fetched_at: normalizedData.fetched_at,
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    });

  } catch (err) {
    console.error('[Asteroids API] Error:', err);

    if (typeof err === 'object' && err !== null && 'code' in err) {
      const neoWsError = err as { code: string; message: string };
      return NextResponse.json({
        ...getMockData(),
        warning: `API error: ${neoWsError.message}. Using mock data.`,
        error_code: neoWsError.code,
      });
    }

    return NextResponse.json({
      ...getMockData(),
      warning: 'API unavailable. Using mock data.',
    });
  }
}

