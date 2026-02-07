/**
 * CelesTrak Satellite Catalog Types
 * 
 * Type definitions for:
 * 1. Raw TLE/OMM data from CelesTrak
 * 2. Normalized internal satellite model
 * 3. Error types
 * 
 * Reference: https://celestrak.org/NORAD/elements/
 */

// =============================================================================
// RAW API TYPES (CelesTrak OMM format)
// =============================================================================

/**
 * Raw Orbital Mean-Elements Message (OMM) from CelesTrak GP data.
 * JSON format from: https://celestrak.org/NORAD/elements/gp.php?GROUP=...&FORMAT=json
 */
export interface RawOmmRecord {
  OBJECT_NAME: string;
  OBJECT_ID: string;
  EPOCH: string;
  MEAN_MOTION: number;
  ECCENTRICITY: number;
  INCLINATION: number;
  RA_OF_ASC_NODE: number;
  ARG_OF_PERICENTER: number;
  MEAN_ANOMALY: number;
  EPHEMERIS_TYPE: number;
  CLASSIFICATION_TYPE: string;
  NORAD_CAT_ID: number;
  ELEMENT_SET_NO: number;
  REV_AT_EPOCH: number;
  BSTAR: number;
  MEAN_MOTION_DOT: number;
  MEAN_MOTION_DDOT: number;
}

// =============================================================================
// NORMALIZED INTERNAL MODEL
// =============================================================================

/**
 * Orbit regime classification based on altitude/period.
 */
export type OrbitRegime = 'LEO' | 'MEO' | 'GEO' | 'HEO' | 'UNKNOWN';

/**
 * Object type classification.
 */
export type SpaceObjectType = 
  | 'PAYLOAD'      // Active satellite
  | 'ROCKET_BODY'  // Spent rocket stage
  | 'DEBRIS'       // Fragmentation debris
  | 'UNKNOWN';

/**
 * Normalized satellite/debris object.
 * Used by downstream UI and analysis components.
 */
export interface Satellite {
  /** NORAD Catalog ID (unique identifier) */
  norad_id: number;
  /** Object name */
  name: string;
  /** International designator (COSPAR ID) */
  object_id: string;
  /** Epoch of orbital elements (ISO timestamp) */
  epoch: string;
  /** Epoch as Unix timestamp (ms) */
  epoch_timestamp: number;
  /** Orbital inclination (degrees) */
  inclination_deg: number;
  /** Orbital eccentricity */
  eccentricity: number;
  /** Mean motion (revolutions per day) */
  mean_motion: number;
  /** Right ascension of ascending node (degrees) */
  raan_deg: number;
  /** Argument of perigee (degrees) */
  arg_perigee_deg: number;
  /** Mean anomaly (degrees) */
  mean_anomaly_deg: number;
  /** B* drag term */
  bstar: number;
  /** Orbit regime classification */
  orbit_regime: OrbitRegime;
  /** Approximate altitude (km) - derived */
  approx_altitude_km: number;
  /** Data source */
  source: 'CelesTrak';
}

/**
 * Complete normalized response from CelesTrak processing.
 */
export interface NormalizedCelesTrakData {
  /** Catalog group that was queried */
  catalog_group: string;
  /** Array of satellite objects */
  satellites: Satellite[];
  /** Total count */
  count: number;
  /** Timestamp when data was fetched */
  fetched_at: number;
}

// =============================================================================
// CATALOG GROUPS
// =============================================================================

/**
 * Common CelesTrak catalog group identifiers.
 */
export type CelesTrakGroup = 
  | 'active'           // All active satellites
  | 'stations'         // Space stations (ISS, Tiangong)
  | 'visual'           // Brightest observable satellites
  | 'starlink'         // Starlink constellation
  | 'oneweb'           // OneWeb constellation
  | 'iridium'          // Iridium NEXT
  | 'geo'              // Geostationary satellites
  | 'gps-ops'          // GPS operational
  | 'galileo'          // Galileo navigation
  | 'debris'           // Tracked debris
  | 'cosmos-2251-debris'  // Iridium-Cosmos collision debris
  | 'fengyun-1c-debris';  // Fengyun-1C ASAT debris

// =============================================================================
// ERROR TYPES
// =============================================================================

export type CelesTrakErrorCode = 
  | 'NETWORK_ERROR'
  | 'PARSE_ERROR'
  | 'EMPTY_RESPONSE'
  | 'TIMEOUT';

export interface CelesTrakError {
  code: CelesTrakErrorCode;
  message: string;
  details?: string;
}
