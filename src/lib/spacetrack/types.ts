/**
 * Space-Track SATCAT Types
 * 
 * Type definitions for:
 * 1. Raw SATCAT catalog records from Space-Track
 * 2. Normalized SpaceObject internal model
 * 3. Error types
 * 
 * Reference: https://www.space-track.org/documentation
 */

// =============================================================================
// RAW API TYPES (Space-Track SATCAT format)
// =============================================================================

/**
 * Object type classification from SATCAT.
 */
export type RawObjectType = 
  | 'PAYLOAD'
  | 'ROCKET BODY'
  | 'DEBRIS'
  | 'TBA'
  | 'UNKNOWN';

/**
 * Radar Cross Section size category.
 */
export type RawRcsSize = 'SMALL' | 'MEDIUM' | 'LARGE' | null;

/**
 * Raw SATCAT record from Space-Track API.
 * Contains catalog-level metadata for a single space object.
 */
export interface RawSatcatRecord {
  /** NORAD Catalog Number - Primary identifier */
  NORAD_CAT_ID: string;
  /** Object name */
  OBJECT_NAME: string;
  /** Object type classification */
  OBJECT_TYPE: RawObjectType;
  /** International designator (COSPAR ID) */
  OBJECT_ID: string | null;
  /** Country/organization code */
  COUNTRY: string | null;
  /** Launch date (YYYY-MM-DD) */
  LAUNCH_DATE: string | null;
  /** Decay date if no longer in orbit (YYYY-MM-DD) */
  DECAY_DATE: string | null;
  /** Orbital inclination (degrees) */
  INCLINATION: string | null;
  /** Orbital period (minutes) */
  PERIOD: string | null;
  /** Apogee altitude (km) */
  APOGEE: string | null;
  /** Perigee altitude (km) */
  PERIGEE: string | null;
  /** Radar Cross Section size */
  RCS_SIZE: RawRcsSize;
  /** Launch site */
  SITE: string | null;
  /** Current status */
  CURRENT_STATUS: string | null;
}

// =============================================================================
// NORMALIZED INTERNAL MODEL
// =============================================================================

/**
 * Normalized object type.
 */
export type ObjectType = 'PAYLOAD' | 'ROCKET_BODY' | 'DEBRIS' | 'UNKNOWN';

/**
 * Orbit class based on altitude/period.
 */
export type OrbitClass = 'LEO' | 'MEO' | 'GEO' | 'HEO' | 'UNKNOWN';

/**
 * Operational status of the object.
 */
export type ObjectStatus = 'ACTIVE' | 'INACTIVE' | 'DECAYED' | 'UNKNOWN';

/**
 * Normalized SpaceObject model.
 * 
 * Represents a single cataloged Earth-orbiting object.
 * Used for situational awareness and object context.
 * 
 * Does NOT contain:
 * - Trajectory predictions
 * - Collision probabilities
 * - Risk assessments
 */
export interface SpaceObject {
  /** NORAD Catalog ID - Primary key */
  norad_id: number;
  /** Display name */
  name: string;
  /** International designator (COSPAR ID) */
  object_id: string | null;
  /** Object type classification */
  object_type: ObjectType;
  /** Country/organization code */
  country: string | null;
  /** Launch date (ISO string) */
  launch_date: string | null;
  /** Decay date if decayed (ISO string) */
  decay_date: string | null;
  /** Orbital inclination (degrees) */
  inclination_deg: number | null;
  /** Orbital period (minutes) */
  period_minutes: number | null;
  /** Apogee altitude (km) */
  apogee_km: number | null;
  /** Perigee altitude (km) */
  perigee_km: number | null;
  /** Computed orbit class */
  orbit_class: OrbitClass;
  /** Object status */
  status: ObjectStatus;
  /** Radar Cross Section size */
  rcs_size: 'SMALL' | 'MEDIUM' | 'LARGE' | null;
  /** Data source identifier */
  source: 'Space-Track SATCAT';
}

/**
 * Complete normalized response from SATCAT processing.
 */
export interface NormalizedSatcatData {
  /** Array of space objects */
  objects: SpaceObject[];
  /** Total count */
  count: number;
  /** Counts by object type */
  counts_by_type: {
    payload: number;
    rocket_body: number;
    debris: number;
    unknown: number;
  };
  /** Counts by orbit class */
  counts_by_orbit: {
    leo: number;
    meo: number;
    geo: number;
    heo: number;
    unknown: number;
  };
  /** Timestamp when data was fetched */
  fetched_at: number;
}

// =============================================================================
// QUERY OPTIONS
// =============================================================================

/**
 * Query options for filtering SATCAT results.
 */
export interface SatcatQueryOptions {
  /** Filter by object type */
  objectType?: ObjectType;
  /** Filter by country code */
  country?: string;
  /** Include only active (non-decayed) objects */
  activeOnly?: boolean;
  /** Filter by orbit class */
  orbitClass?: OrbitClass;
  /** Maximum number of results */
  limit?: number;
}

// =============================================================================
// ERROR TYPES
// =============================================================================

export type SpaceTrackErrorCode = 
  | 'AUTH_FAILED'
  | 'NETWORK_ERROR'
  | 'PARSE_ERROR'
  | 'RATE_LIMITED'
  | 'EMPTY_RESPONSE'
  | 'CREDENTIALS_MISSING'
  | 'TIMEOUT';

export interface SpaceTrackError {
  code: SpaceTrackErrorCode;
  message: string;
  details?: string;
}
