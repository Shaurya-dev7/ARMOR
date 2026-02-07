/**
 * NASA JPL Horizons Data Normalization Layer
 * 
 * Converts parsed ephemeris entries into normalized OrbitSample models.
 * 
 * NORMALIZATION RULES:
 * - One OrbitSample per Horizons time step
 * - No derived quantities
 * - No smoothing or interpolation
 * - No interpretation
 * - Units preserved exactly: km, km/s, TDB
 * - Reference frame: Ecliptic J2000
 */

import type {
  ParsedEphemerisEntry,
  OrbitSample,
  NormalizedHorizonsData,
  HorizonsRequestParams,
} from './types';

/**
 * Convert a single parsed ephemeris entry to normalized OrbitSample.
 * 
 * Preserves all values exactly as received from the parser.
 * Only adds metadata fields (reference_frame, source).
 */
function normalizeEntry(entry: ParsedEphemerisEntry): OrbitSample {
  return {
    time_jd_tdb: entry.julianDate,
    time_utc_string: entry.utcString,
    position_km: [entry.x, entry.y, entry.z],
    velocity_km_s: [entry.vx, entry.vy, entry.vz],
    reference_frame: 'Ecliptic J2000',
    source: 'NASA JPL Horizons',
  };
}

/**
 * Normalize an array of parsed ephemeris entries into OrbitSamples.
 * 
 * @param entries - Parsed ephemeris entries from the parser
 * @param params - Original request parameters for metadata
 * @returns Complete normalized Horizons data structure
 */
export function normalizeHorizonsData(
  entries: ParsedEphemerisEntry[],
  params: HorizonsRequestParams
): NormalizedHorizonsData {
  // Convert all entries to OrbitSamples
  const samples = entries.map(normalizeEntry);

  // Extract time range from first and last samples
  const firstSample = samples[0];
  const lastSample = samples[samples.length - 1];

  return {
    target: params.command,
    center: params.center,
    samples,
    sample_count: samples.length,
    time_range: {
      start_jd: firstSample.time_jd_tdb,
      end_jd: lastSample.time_jd_tdb,
      start_utc: firstSample.time_utc_string,
      end_utc: lastSample.time_utc_string,
    },
    fetched_at: Date.now(),
  };
}

/**
 * Validate normalized data for basic sanity checks.
 * Returns true if data appears valid.
 * 
 * Checks:
 * - At least one sample exists
 * - All samples have valid position/velocity vectors
 * - Timestamps are in ascending order
 */
export function validateNormalizedData(data: NormalizedHorizonsData): boolean {
  if (data.samples.length === 0) {
    console.warn('[Horizons] Validation failed: no samples');
    return false;
  }

  // Check all samples have valid vectors
  for (let i = 0; i < data.samples.length; i++) {
    const sample = data.samples[i];

    // Check position vector
    for (const val of sample.position_km) {
      if (!isFinite(val)) {
        console.warn(`[Horizons] Validation failed: invalid position at sample ${i}`);
        return false;
      }
    }

    // Check velocity vector
    for (const val of sample.velocity_km_s) {
      if (!isFinite(val)) {
        console.warn(`[Horizons] Validation failed: invalid velocity at sample ${i}`);
        return false;
      }
    }

    // Check timestamp is valid
    if (!isFinite(sample.time_jd_tdb) || sample.time_jd_tdb <= 0) {
      console.warn(`[Horizons] Validation failed: invalid timestamp at sample ${i}`);
      return false;
    }
  }

  // Check timestamps are in ascending order
  for (let i = 1; i < data.samples.length; i++) {
    if (data.samples[i].time_jd_tdb <= data.samples[i - 1].time_jd_tdb) {
      console.warn(`[Horizons] Validation failed: timestamps not ascending at sample ${i}`);
      return false;
    }
  }

  return true;
}
