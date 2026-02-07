/**
 * NASA NeoWs Data Normalization Layer
 * 
 * Transforms raw NeoWs API responses into clean, internal models.
 * Follows strict extraction rules - no interpretation, no speculation.
 */

import type {
  RawNeoWsFeedResponse,
  RawNeoWsAsteroid,
  RawCloseApproachData,
  Asteroid,
  CloseApproachEvent,
  NormalizedNeoWsData,
} from './types';

/**
 * Extract normalized Asteroid from raw NeoWs asteroid object.
 * 
 * Extracts only:
 * - neo_reference_id (as id)
 * - name
 * - designation (if present)
 * - diameter min/max in kilometers only
 * - hazardous flag
 * - sentry flag
 * 
 * Ignores: links, alternate units, magnitude, URLs
 */
function normalizeAsteroid(raw: RawNeoWsAsteroid): Asteroid {
  return {
    id: raw.neo_reference_id,
    name: raw.name,
    designation: raw.designation,
    diameter_min_km: raw.estimated_diameter.kilometers.estimated_diameter_min,
    diameter_max_km: raw.estimated_diameter.kilometers.estimated_diameter_max,
    hazardous_flag: raw.is_potentially_hazardous_asteroid,
    sentry_flag: raw.is_sentry_object ?? false,
  };
}

/**
 * Filter and normalize close approach events.
 * 
 * STRICT RULES:
 * - Only includes events where orbiting_body === "Earth"
 * - Uses kilometers and km/s only
 * - Preserves NASA-reported values exactly (no rounding)
 * - Converts epoch to milliseconds
 */
function normalizeCloseApproaches(
  raw: RawNeoWsAsteroid
): CloseApproachEvent[] {
  return raw.close_approach_data
    .filter((approach): approach is RawCloseApproachData => 
      approach.orbiting_body === 'Earth'
    )
    .map((approach): CloseApproachEvent => ({
      asteroid_id: raw.neo_reference_id,
      asteroid_name: raw.name,
      approach_date: approach.close_approach_date,
      approach_timestamp: approach.epoch_date_close_approach,
      miss_distance_km: parseFloat(approach.miss_distance.kilometers),
      relative_velocity_km_s: parseFloat(approach.relative_velocity.kilometers_per_second),
      source: 'NASA NeoWs',
    }));
}

/**
 * Extract date range from near_earth_objects keys.
 */
function extractDateRange(nearEarthObjects: Record<string, unknown>): { start: string; end: string } {
  const dates = Object.keys(nearEarthObjects).sort();
  
  if (dates.length === 0) {
    const today = new Date().toISOString().split('T')[0];
    return { start: today, end: today };
  }
  
  return {
    start: dates[0],
    end: dates[dates.length - 1],
  };
}

/**
 * Normalize entire NeoWs feed response.
 * 
 * Produces:
 * - Unique asteroid list (deduplicated by neo_reference_id)
 * - All Earth close approach events
 * - Metadata (count, date range, fetch timestamp)
 * 
 * DOES NOT:
 * - Compute probabilities
 * - Rank threats
 * - Generate alerts
 * - Infer danger levels
 */
export function normalizeNeoWsFeed(raw: RawNeoWsFeedResponse): NormalizedNeoWsData {
  const asteroidMap = new Map<string, Asteroid>();
  const events: CloseApproachEvent[] = [];
  
  // Process each date's asteroid list
  for (const dateKey of Object.keys(raw.near_earth_objects)) {
    const asteroidsForDate = raw.near_earth_objects[dateKey];
    
    for (const rawAsteroid of asteroidsForDate) {
      // Deduplicate asteroids by neo_reference_id
      if (!asteroidMap.has(rawAsteroid.neo_reference_id)) {
        asteroidMap.set(rawAsteroid.neo_reference_id, normalizeAsteroid(rawAsteroid));
      }
      
      // Extract all Earth close approaches
      const approachEvents = normalizeCloseApproaches(rawAsteroid);
      events.push(...approachEvents);
    }
  }
  
  // Sort events by approach timestamp (chronological order)
  events.sort((a, b) => a.approach_timestamp - b.approach_timestamp);
  
  return {
    asteroids: Array.from(asteroidMap.values()),
    events,
    element_count: raw.element_count,
    date_range: extractDateRange(raw.near_earth_objects),
    fetched_at: Date.now(),
  };
}

/**
 * Validate normalized data for basic sanity checks.
 * Returns true if data appears valid.
 */
export function validateNormalizedData(data: NormalizedNeoWsData): boolean {
  // Must have consistent counts
  if (data.events.length === 0 && data.element_count > 0) {
    // Possible if all approaches are non-Earth (unlikely but valid)
    return true;
  }
  
  // All events must reference existing asteroids
  const asteroidIds = new Set(data.asteroids.map(a => a.id));
  for (const event of data.events) {
    if (!asteroidIds.has(event.asteroid_id)) {
      console.warn(`Event references unknown asteroid: ${event.asteroid_id}`);
      return false;
    }
  }
  
  // All distances and velocities must be positive
  for (const event of data.events) {
    if (event.miss_distance_km <= 0 || event.relative_velocity_km_s <= 0) {
      console.warn(`Invalid event values for asteroid ${event.asteroid_id}`);
      return false;
    }
  }
  
  return true;
}
