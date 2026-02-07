/**
 * NASA JPL Horizons API Types
 * 
 * Type definitions for:
 * 1. Request parameters
 * 2. Raw API response structure
 * 3. Normalized internal OrbitSample model
 * 4. Error types
 * 
 * Reference: https://ssd.jpl.nasa.gov/api/horizons.api
 */

// =============================================================================
// REQUEST TYPES
// =============================================================================

/**
 * Required parameters for a Horizons VECTORS ephemeris request.
 */
export interface HorizonsRequestParams {
  /** Target body identifier (e.g., '399' for Earth, asteroid SPK-ID) */
  command: string;
  /** Reference center (e.g., '@0' for Solar System Barycenter) */
  center: string;
  /** Start time in ISO format or JD */
  startTime: string;
  /** Stop time in ISO format or JD */
  stopTime: string;
  /** Step size (e.g., '1d', '1h', '10m') */
  stepSize: string;
}

/**
 * Full query parameters sent to Horizons API.
 * These are the exact parameter names expected by the API.
 */
export interface HorizonsQueryParams {
  format: 'json';
  COMMAND: string;
  EPHEM_TYPE: 'VECTORS';
  CENTER: string;
  START_TIME: string;
  STOP_TIME: string;
  STEP_SIZE: string;
  /** Use geometric state vectors (no aberration corrections) */
  CAL_FORMAT: 'CAL';
  /** Output in kilometers and km/s */
  OUT_UNITS: 'KM-S';
  /** Time type: TDB */
  TIME_TYPE: 'TDB';
  /** Reference plane: Ecliptic */
  REF_PLANE: 'ECLIPTIC';
  /** Reference system: J2000 */
  REF_SYSTEM: 'J2000';
  /** Vector table: position + velocity only (type 2) */
  VEC_TABLE: '2';
}

// =============================================================================
// RAW RESPONSE TYPES
// =============================================================================

/**
 * Raw response from the Horizons API.
 * The `result` field contains all ephemeris data as a multiline string.
 */
export interface RawHorizonsResponse {
  /** API signature metadata */
  signature: {
    source: string;
    version: string;
  };
  /** 
   * The main result - a multiline string containing:
   * - Headers and metadata
   * - Ephemeris data between $$SOE and $$EOE markers
   */
  result: string;
}

// =============================================================================
// PARSED INTERMEDIATE TYPES
// =============================================================================

/**
 * A single parsed ephemeris entry extracted from the result string.
 * This is an intermediate format before full normalization.
 */
export interface ParsedEphemerisEntry {
  /** Julian Date (TDB) */
  julianDate: number;
  /** Human-readable UTC timestamp string */
  utcString: string;
  /** Position X in kilometers */
  x: number;
  /** Position Y in kilometers */
  y: number;
  /** Position Z in kilometers */
  z: number;
  /** Velocity X in km/s */
  vx: number;
  /** Velocity Y in km/s */
  vy: number;
  /** Velocity Z in km/s */
  vz: number;
}

// =============================================================================
// NORMALIZED INTERNAL MODEL
// =============================================================================

/**
 * Normalized OrbitSample.
 * 
 * This is the authoritative internal model used by downstream systems.
 * One OrbitSample per Horizons time step.
 * 
 * Rules:
 * - No derived quantities
 * - No smoothing or interpolation
 * - No interpretation
 * - Units preserved exactly as received
 */
export interface OrbitSample {
  /** Julian Date in TDB time scale */
  time_jd_tdb: number;
  /** Human-readable UTC timestamp string (exactly as reported) */
  time_utc_string: string;
  /** Position vector [X, Y, Z] in kilometers */
  position_km: [number, number, number];
  /** Velocity vector [VX, VY, VZ] in km/s */
  velocity_km_s: [number, number, number];
  /** Reference frame identifier */
  reference_frame: 'Ecliptic J2000';
  /** Data source identifier */
  source: 'NASA JPL Horizons';
}

/**
 * Complete normalized response from Horizons processing.
 */
export interface NormalizedHorizonsData {
  /** Target body identifier that was queried */
  target: string;
  /** Reference center used */
  center: string;
  /** Array of orbit samples in chronological order */
  samples: OrbitSample[];
  /** Number of samples */
  sample_count: number;
  /** Time range of the data */
  time_range: {
    start_jd: number;
    end_jd: number;
    start_utc: string;
    end_utc: string;
  };
  /** Timestamp when data was fetched */
  fetched_at: number;
}

// =============================================================================
// ERROR TYPES
// =============================================================================

export type HorizonsErrorCode = 
  | 'NETWORK_ERROR'
  | 'PARSE_ERROR'
  | 'MISSING_RESULT'
  | 'MISSING_SOE_EOE'
  | 'NO_EPHEMERIS_DATA'
  | 'INVALID_NUMERIC_VALUE'
  | 'TIMEOUT';

export interface HorizonsError {
  code: HorizonsErrorCode;
  message: string;
  details?: string;
}
