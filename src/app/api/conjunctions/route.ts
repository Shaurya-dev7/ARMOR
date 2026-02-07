/**
 * Conjunctions API Route
 * 
 * Server-side endpoint for fetching satellite/ISS conjunction events.
 * Currently uses mock data as a feed source, but processes it through
 * the real Interpretation Layer to demonstrate risk assessment logic.
 * 
 * Flow:
 * 1. Generate/Fetch raw conjunction events (Input)
 * 2. Run InterpretConjunction (Interpretation Layer)
 * 3. Return interpreted results (Output)
 */

import { NextRequest, NextResponse } from 'next/server';
import { interpretConjunction } from '@/lib/interpretation/conjunction-interpreter';
import { ConjunctionInput } from '@/lib/interpretation/types';

// Mock Conjunction Data (Simulating a "lower layer" ingestion service)
const MOCK_CONJUNCTIONS: ConjunctionInput[] = [
  // 1. Routine ISS Conjunction (Should be suppressed for civilians)
  {
    primary_object: {
      norad_id: 25544,
      name: 'ISS (ZARYA)',
      object_type: 'iss',
      orbit_regime: 'LEO',
    },
    secondary_object: {
      norad_id: 40000,
      name: 'DEBRIS (FENGYUN 1C)',
      object_type: 'debris',
    },
    tca: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days
    miss_distance_km: 15.5,
    relative_velocity_km_s: 14.2,
    lead_time_hours: 48,
    maneuver_possible: true,
    probability_of_collision: 1.5e-6,
  },
  // 2. High-Risk Conjunction (Should be actionable for ISS)
  {
    primary_object: {
      norad_id: 25544,
      name: 'ISS (ZARYA)',
      object_type: 'iss',
      orbit_regime: 'LEO',
    },
    secondary_object: {
      norad_id: 99999,
      name: 'UNKNOWN OBJECT',
      object_type: 'unknown',
    },
    tca: new Date(Date.now() + 3600000 * 5).toISOString(), // 5 hours
    miss_distance_km: 0.8, // Very close
    relative_velocity_km_s: 15.0,
    lead_time_hours: 5,
    maneuver_possible: true,
    probability_of_collision: 2.3e-3, // High probability
  },
  // 3. Satellite-on-Satellite (Operator relevant only)
  {
    primary_object: {
      norad_id: 44713,
      name: 'STARLINK-1007',
      object_type: 'satellite',
      orbit_regime: 'LEO',
    },
    secondary_object: {
      norad_id: 44714,
      name: 'STARLINK-1008',
      object_type: 'satellite',
    },
    tca: new Date(Date.now() + 86400000).toISOString(),
    miss_distance_km: 2.5,
    relative_velocity_km_s: 0.1, // Co-orbital
    lead_time_hours: 24,
    maneuver_possible: true,
    probability_of_collision: 1e-4,
  },
  // 4. Safe Distant Pass (Should be completely suppressed)
  {
    primary_object: {
      norad_id: 25544,
      name: 'ISS (ZARYA)',
      object_type: 'iss',
      orbit_regime: 'LEO',
    },
    secondary_object: {
      norad_id: 88888,
      name: 'ROCKET BODY',
      object_type: 'debris',
    },
    tca: new Date(Date.now() + 86400000 * 5).toISOString(),
    miss_distance_km: 150, // Far
    relative_velocity_km_s: 8.0,
    lead_time_hours: 120,
    maneuver_possible: true,
  }
];

export async function GET(request: NextRequest) {
  try {
    // 1. Get Context
    const context = {
      current_time: new Date().toISOString(),
      prediction_horizon_hours: 168,
      data_age_hours: 0.5, // Fresh
      dry_run: false,
    };

    // 2. Interpret Events
    const results = MOCK_CONJUNCTIONS.map(event => {
      const decision = interpretConjunction(event, context);
      
      return {
        event,
        decision,
        // Helper fields for UI responsiveness
        is_suppressed: decision.suppressed,
        iss_relevance: decision.relevance.iss_relevance,
        operator_relevance: decision.relevance.satellite_operator_relevance,
        summary: decision.summary,
        explanation: decision.explanation,
      };
    });

    // 3. Filter? 
    // We return everything, but the UI should respect `is_suppressed`
    // or filtering can be done via query param ?show_suppressed=true
    
    const showSuppressed = request.nextUrl.searchParams.get('show_suppressed') === 'true';
    const filteredResults = showSuppressed ? results : results.filter(r => !r.is_suppressed);

    return NextResponse.json({
      data: filteredResults,
      meta: {
        total_events: MOCK_CONJUNCTIONS.length,
        returned_events: filteredResults.length,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('[Conjunctions API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
