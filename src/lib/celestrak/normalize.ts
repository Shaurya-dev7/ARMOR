/**
 * CelesTrak Data Normalization Layer
 * 
 * Converts raw OMM records into normalized Satellite models.
 * Computes derived values like orbit regime and approximate altitude.
 */

import type {
  RawOmmRecord,
  Satellite,
  NormalizedCelesTrakData,
  OrbitRegime,
  CelesTrakGroup,
} from './types';

/** Earth's gravitational parameter (km³/s²) */
const GM_EARTH = 398600.4418;
/** Earth's equatorial radius (km) */
const EARTH_RADIUS_KM = 6378.137;
/** Seconds per day */
const SECONDS_PER_DAY = 86400;

/**
 * Calculate semi-major axis from mean motion.
 * mean_motion is in revolutions per day.
 * 
 * a = (GM / (2πn/86400)²)^(1/3)
 */
function calculateSemiMajorAxis(meanMotion: number): number {
  if (meanMotion <= 0) return 0;
  
  // Convert rev/day to rad/s
  const n = (meanMotion * 2 * Math.PI) / SECONDS_PER_DAY;
  
  // a³ = GM / n²
  const a = Math.pow(GM_EARTH / (n * n), 1 / 3);
  
  return a;
}

/**
 * Estimate orbit regime based on mean motion and inclination.
 */
function classifyOrbitRegime(
  meanMotion: number,
  inclination: number,
  eccentricity: number
): OrbitRegime {
  // GEO: ~1 rev/day, low inclination
  if (meanMotion >= 0.9 && meanMotion <= 1.1 && inclination < 20) {
    return 'GEO';
  }
  
  // HEO: high eccentricity (Molniya-like)
  if (eccentricity > 0.5) {
    return 'HEO';
  }
  
  // LEO: > 11 rev/day (period < 128 min, altitude < ~2000 km)
  if (meanMotion > 11) {
    return 'LEO';
  }
  
  // MEO: between LEO and GEO
  if (meanMotion > 1.1 && meanMotion <= 11) {
    return 'MEO';
  }
  
  return 'UNKNOWN';
}

/**
 * Parse epoch string to timestamp.
 * Format: "2026-02-07T12:00:00.000000"
 */
function parseEpoch(epochStr: string): number {
  const date = new Date(epochStr);
  return isNaN(date.getTime()) ? Date.now() : date.getTime();
}

/**
 * Normalize a single OMM record to Satellite model.
 */
function normalizeRecord(raw: RawOmmRecord): Satellite {
  const semiMajorAxis = calculateSemiMajorAxis(raw.MEAN_MOTION);
  const approxAltitude = Math.max(0, semiMajorAxis - EARTH_RADIUS_KM);
  const orbitRegime = classifyOrbitRegime(
    raw.MEAN_MOTION,
    raw.INCLINATION,
    raw.ECCENTRICITY
  );

  return {
    norad_id: raw.NORAD_CAT_ID,
    name: raw.OBJECT_NAME,
    object_id: raw.OBJECT_ID,
    epoch: raw.EPOCH,
    epoch_timestamp: parseEpoch(raw.EPOCH),
    inclination_deg: raw.INCLINATION,
    eccentricity: raw.ECCENTRICITY,
    mean_motion: raw.MEAN_MOTION,
    raan_deg: raw.RA_OF_ASC_NODE,
    arg_perigee_deg: raw.ARG_OF_PERICENTER,
    mean_anomaly_deg: raw.MEAN_ANOMALY,
    bstar: raw.BSTAR,
    orbit_regime: orbitRegime,
    approx_altitude_km: Math.round(approxAltitude),
    source: 'CelesTrak',
  };
}

/**
 * Normalize an array of OMM records.
 */
export function normalizeCelesTrakData(
  records: RawOmmRecord[],
  group: CelesTrakGroup
): NormalizedCelesTrakData {
  const satellites = records.map(normalizeRecord);

  return {
    catalog_group: group,
    satellites,
    count: satellites.length,
    fetched_at: Date.now(),
  };
}

/**
 * Validate normalized data.
 */
export function validateNormalizedData(data: NormalizedCelesTrakData): boolean {
  if (data.satellites.length === 0) {
    console.warn('[CelesTrak] Validation: no satellites');
    return false;
  }

  for (const sat of data.satellites) {
    if (!sat.norad_id || sat.norad_id <= 0) {
      console.warn(`[CelesTrak] Invalid NORAD ID: ${sat.norad_id}`);
      return false;
    }
    if (!sat.name) {
      console.warn(`[CelesTrak] Missing name for NORAD ${sat.norad_id}`);
      return false;
    }
  }

  return true;
}

/**
 * Filter satellites by orbit regime.
 */
export function filterByOrbitRegime(
  data: NormalizedCelesTrakData,
  regime: OrbitRegime
): Satellite[] {
  return data.satellites.filter(sat => sat.orbit_regime === regime);
}

/**
 * Filter satellites by altitude range.
 */
export function filterByAltitude(
  data: NormalizedCelesTrakData,
  minAltitude: number,
  maxAltitude: number
): Satellite[] {
  return data.satellites.filter(
    sat => sat.approx_altitude_km >= minAltitude && sat.approx_altitude_km <= maxAltitude
  );
}
