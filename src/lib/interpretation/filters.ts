/**
 * Suppression Logic (The Gating Layer)
 * 
 * CORE PHILOSOPHY:
 * - Most space events are noise.
 * - Suppressed events do not exist for the end user.
 * - This layer protects the user from fatigue.
 */

import { AsteroidInput, SystemContext } from './types';

export interface SuppressionResult {
  should_suppress: boolean;
  reason?: string;
}

/**
 * Determine if an asteroid event should be suppressed.
 * 
 * Rules:
 * 1. Ignore small rocks (<10m) unless Earth impact is non-zero.
 * 2. Ignore distant rocks (>5M km) unless massive (>1km).
 * 3. Ignore stale data (>30 days old).
 * 4. Ignore "routine" passes (no hazardous flag + >1M km distance).
 */
export function shouldSuppressEvent(
  asteroid: AsteroidInput,
  context: SystemContext
): SuppressionResult {
  // 1. DATA FRESHNESS CHECK
  // If observation age is > 30 days (720 hours), data is stale.
  if (asteroid.observation_age_hours && asteroid.observation_age_hours > 720) {
    return { should_suppress: true, reason: 'Data stale (>30 days old)' };
  }

  // 2. SMALL OBJECT FILTER (<10m typically burns up)
  // ESTIMATE: 0.01 km = 10 meters
  // EXCEPTION: If it is flagged "potentially hazardous," we do NOT suppress even if small (rare edge case)
  if (asteroid.diameter_max_km < 0.01 && !asteroid.potentially_hazardous_flag) {
    return { should_suppress: true, reason: 'Object too small (<10m) to pose threat' };
  }

  // 3. DISTANCE FILTER (The "Space is Big" Rule)
  // Distance > 5 million km (approx 13 Lunar Distances)
  // EXCEPTION: If object is huge (>1km), we track it for scientific interest
  if (asteroid.miss_distance_km > 5000000 && asteroid.diameter_max_km < 1.0) {
    return { should_suppress: true, reason: 'Pass distance > 5M km (insignificant)' };
  }

  // 4. ROUTINE PASS FILTER
  // If distance > 2 million km AND not hazardous AND sentry not flagged
  // 2M km is ~5 Earth-Moon distances. That is very far.
  if (asteroid.miss_distance_km > 2000000 && !asteroid.potentially_hazardous_flag && !asteroid.sentry_flag) {
    return { should_suppress: true, reason: 'Routine distant pass (>2M km)' };
  }

  // If none of the above, DO NOT SUPPRESS.
  // This event is relevant enough to be interpreted (though maybe still low relevance).
  return { should_suppress: false };
}
