/**
 * Relevance Logic (Who Cares?)
 * 
 * Scores events based on audience needs.
 * A civilian doesn't care about a GEO belt crossing.
 * A satellite operator definitely does.
 */

import { AsteroidInput, RelevanceLevel, RelevanceMatrix } from './types';

// Constants
const LUNAR_DISTANCE_KM = 384400;
const GEO_BELT_KM = 35786;
const LEO_ALTITUDE_KM = 2000;

/**
 * Calculate relevance for all audiences.
 */
export function calculateRelevance(asteroid: AsteroidInput): RelevanceMatrix {
  return {
    civilian_relevance: getCivilianRelevance(asteroid),
    satellite_operator_relevance: getOperatorRelevance(asteroid),
    iss_relevance: getIssRelevance(asteroid),
    research_relevance: 'low', // Researchers always want data unless suppressed
  };
}

/**
 * Civilian Relevance
 * - Actionable: Impact probability > 0 (Panic mode prevention: only if validated)
 * - Monitor: Large object (>100m) coming very close (< 1 Lunar Distance)
 * - Low: Everything else visible on dashboard
 * - None: Suppressed (handled by filters.ts)
 */
function getCivilianRelevance(asteroid: AsteroidInput): RelevanceLevel {
  // If explicitly flagged as hazardous by NASA *AND* close
  // Note: NASA "hazardous" flag is very broad (includes distant passes).
  // We refine it: Must be < Lunar Distance to be visually "Monitor" for public.
  if (asteroid.potentially_hazardous_flag && asteroid.miss_distance_km < LUNAR_DISTANCE_KM) {
    return 'monitor';
  }

  // Impact probability > 0 is the only "Actionable" trigger for civilians
  if (asteroid.impact_probability && asteroid.impact_probability > 0) {
    return 'actionable';
  }

  // Large objects (>1km) visible with binoculars/telescopes might generate buzz
  if (asteroid.diameter_max_km > 1.0 && asteroid.miss_distance_km < (10 * LUNAR_DISTANCE_KM)) {
    return 'low'; // Worth showing on dashboard
  }

  // Default for non-suppressed events
  return 'low';
}

/**
 * Operator Relevance
 * - Actionable: Collision course with specific asset (requires Conjunction Data, not just Asteroid Data)
 * - Monitor: Crossing orbital shells (GEO/LEO)
 * - Low: Distant pass
 */
function getOperatorRelevance(asteroid: AsteroidInput): RelevanceLevel {
  // Check Geostationary Belt crossing (approx 36,000 km)
  // We add a buffer of +/- 5000 km for "Monitor"
  if (Math.abs(asteroid.miss_distance_km - GEO_BELT_KM) < 5000) {
    return 'monitor';
  }

  // Check LEO crossing (< 2000 km)
  // This is extremely close for an asteroid
  if (asteroid.miss_distance_km < LEO_ALTITUDE_KM + 2000) {
    return 'monitor';
  }

  return 'low';
}

/**
 * ISS Relevance
 * - Actionable: Conjunction with ISS box (requires precise ephemeris)
 * - Monitor: < 1000 km miss distance
 * - Low: < 50,000 km miss distance
 */
function getIssRelevance(asteroid: AsteroidInput): RelevanceLevel {
  if (asteroid.miss_distance_km < 1000) {
    return 'monitor';
  }
  if (asteroid.miss_distance_km < 50000) {
    return 'low';
  }
  return 'none';
}
