/**
 * Space-Track SATCAT Normalization Layer
 * 
 * Converts raw SATCAT records into normalized SpaceObject models.
 * Classifies orbit type based on altitude/period.
 * 
 * Does NOT:
 * - Perform orbital propagation
 * - Calculate collision probabilities
 * - Assign risk levels
 */

import type {
  RawSatcatRecord,
  SpaceObject,
  NormalizedSatcatData,
  ObjectType,
  OrbitClass,
  ObjectStatus,
} from './types';

/**
 * Normalize object type from raw SATCAT format.
 */
function normalizeObjectType(raw: string): ObjectType {
  switch (raw.toUpperCase()) {
    case 'PAYLOAD':
      return 'PAYLOAD';
    case 'ROCKET BODY':
      return 'ROCKET_BODY';
    case 'DEBRIS':
      return 'DEBRIS';
    default:
      return 'UNKNOWN';
  }
}

/**
 * Classify orbit based on altitude (apogee/perigee).
 * 
 * LEO: < 2,000 km
 * MEO: 2,000 - 35,786 km
 * GEO: ~35,786 km (geosynchronous)
 * HEO: Highly elliptical (large apogee/perigee difference)
 */
function classifyOrbit(
  apogee: number | null,
  perigee: number | null,
  period: number | null
): OrbitClass {
  if (apogee === null || perigee === null) {
    return 'UNKNOWN';
  }

  // HEO detection: eccentricity > 0.25 equivalent
  const avgAlt = (apogee + perigee) / 2;
  const altDiff = apogee - perigee;
  if (altDiff > avgAlt * 0.5) {
    return 'HEO';
  }

  // GEO: period ~1436 minutes (1 sidereal day) or altitude ~35,786 km
  if (period && period > 1400 && period < 1500) {
    return 'GEO';
  }
  if (apogee > 35000 && apogee < 36500 && perigee > 35000) {
    return 'GEO';
  }

  // LEO: apogee < 2000 km
  if (apogee < 2000) {
    return 'LEO';
  }

  // MEO: between LEO and GEO
  if (apogee >= 2000 && apogee < 35000) {
    return 'MEO';
  }

  return 'UNKNOWN';
}

/**
 * Determine object status from SATCAT fields.
 */
function determineStatus(
  decayDate: string | null,
  currentStatus: string | null
): ObjectStatus {
  // Decayed objects
  if (decayDate) {
    return 'DECAYED';
  }

  // Check current status field
  if (currentStatus) {
    const status = currentStatus.toUpperCase();
    if (status.includes('ACTIVE') || status.includes('OPERATIONAL')) {
      return 'ACTIVE';
    }
    if (status.includes('INACTIVE') || status.includes('DEFUNCT')) {
      return 'INACTIVE';
    }
  }

  // Default to unknown for payloads without status
  return 'UNKNOWN';
}

/**
 * Parse numeric value from string, returning null if invalid.
 */
function parseNumeric(value: string | null): number | null {
  if (!value) return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

/**
 * Normalize a single SATCAT record to SpaceObject.
 */
function normalizeRecord(raw: RawSatcatRecord): SpaceObject {
  const inclination = parseNumeric(raw.INCLINATION);
  const period = parseNumeric(raw.PERIOD);
  const apogee = parseNumeric(raw.APOGEE);
  const perigee = parseNumeric(raw.PERIGEE);

  return {
    norad_id: parseInt(raw.NORAD_CAT_ID, 10),
    name: raw.OBJECT_NAME,
    object_id: raw.OBJECT_ID,
    object_type: normalizeObjectType(raw.OBJECT_TYPE),
    country: raw.COUNTRY,
    launch_date: raw.LAUNCH_DATE,
    decay_date: raw.DECAY_DATE,
    inclination_deg: inclination,
    period_minutes: period,
    apogee_km: apogee,
    perigee_km: perigee,
    orbit_class: classifyOrbit(apogee, perigee, period),
    status: determineStatus(raw.DECAY_DATE, raw.CURRENT_STATUS),
    rcs_size: raw.RCS_SIZE,
    source: 'Space-Track SATCAT',
  };
}

/**
 * Normalize an array of SATCAT records.
 */
export function normalizeSatcatData(
  records: RawSatcatRecord[]
): NormalizedSatcatData {
  const objects = records.map(normalizeRecord);

  // Count by type
  const countsByType = {
    payload: 0,
    rocket_body: 0,
    debris: 0,
    unknown: 0,
  };

  // Count by orbit
  const countsByOrbit = {
    leo: 0,
    meo: 0,
    geo: 0,
    heo: 0,
    unknown: 0,
  };

  for (const obj of objects) {
    // Type counts
    switch (obj.object_type) {
      case 'PAYLOAD': countsByType.payload++; break;
      case 'ROCKET_BODY': countsByType.rocket_body++; break;
      case 'DEBRIS': countsByType.debris++; break;
      default: countsByType.unknown++; break;
    }

    // Orbit counts
    switch (obj.orbit_class) {
      case 'LEO': countsByOrbit.leo++; break;
      case 'MEO': countsByOrbit.meo++; break;
      case 'GEO': countsByOrbit.geo++; break;
      case 'HEO': countsByOrbit.heo++; break;
      default: countsByOrbit.unknown++; break;
    }
  }

  return {
    objects,
    count: objects.length,
    counts_by_type: countsByType,
    counts_by_orbit: countsByOrbit,
    fetched_at: Date.now(),
  };
}

/**
 * Validate normalized data.
 */
export function validateNormalizedData(data: NormalizedSatcatData): boolean {
  if (data.objects.length === 0) {
    console.warn('[SpaceTrack] Validation: no objects');
    return false;
  }

  for (const obj of data.objects) {
    if (!obj.norad_id || obj.norad_id <= 0) {
      console.warn(`[SpaceTrack] Invalid NORAD ID: ${obj.norad_id}`);
      return false;
    }
    if (!obj.name) {
      console.warn(`[SpaceTrack] Missing name for NORAD ${obj.norad_id}`);
      return false;
    }
  }

  return true;
}

/**
 * Filter objects by type.
 */
export function filterByType(
  data: NormalizedSatcatData,
  type: ObjectType
): SpaceObject[] {
  return data.objects.filter(obj => obj.object_type === type);
}

/**
 * Filter objects by orbit class.
 */
export function filterByOrbitClass(
  data: NormalizedSatcatData,
  orbitClass: OrbitClass
): SpaceObject[] {
  return data.objects.filter(obj => obj.orbit_class === orbitClass);
}

/**
 * Filter to active (non-decayed) objects only.
 */
export function filterActive(data: NormalizedSatcatData): SpaceObject[] {
  return data.objects.filter(obj => obj.status !== 'DECAYED');
}
