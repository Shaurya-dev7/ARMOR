/**
 * NASA NeoWs API Types
 * 
 * This file contains:
 * 1. Raw API response types (NASA-exact, used only at ingestion boundary)
 * 2. Normalized internal models (used by all downstream logic)
 */

// =============================================================================
// RAW API TYPES (NASA NeoWs /feed response structure)
// =============================================================================

/** Raw close approach data from NeoWs */
export interface RawCloseApproachData {
  close_approach_date: string;
  close_approach_date_full: string;
  epoch_date_close_approach: number;
  relative_velocity: {
    kilometers_per_second: string;
    kilometers_per_hour: string;
    miles_per_hour: string;
  };
  miss_distance: {
    astronomical: string;
    lunar: string;
    kilometers: string;
    miles: string;
  };
  orbiting_body: string;
}

/** Raw diameter estimate from NeoWs */
export interface RawDiameterEstimate {
  estimated_diameter_min: number;
  estimated_diameter_max: number;
}

/** Raw estimated diameter object with multiple unit systems */
export interface RawEstimatedDiameter {
  kilometers: RawDiameterEstimate;
  meters: RawDiameterEstimate;
  miles: RawDiameterEstimate;
  feet: RawDiameterEstimate;
}

/** Raw asteroid object from NeoWs */
export interface RawNeoWsAsteroid {
  id: string;
  neo_reference_id: string;
  name: string;
  designation?: string;
  nasa_jpl_url: string;
  absolute_magnitude_h: number;
  estimated_diameter: RawEstimatedDiameter;
  is_potentially_hazardous_asteroid: boolean;
  is_sentry_object?: boolean;
  close_approach_data: RawCloseApproachData[];
  links: {
    self: string;
  };
}

/** Raw NeoWs /feed endpoint response */
export interface RawNeoWsFeedResponse {
  links: {
    next?: string;
    previous?: string;
    self: string;
  };
  element_count: number;
  near_earth_objects: {
    [date: string]: RawNeoWsAsteroid[];
  };
}

// =============================================================================
// NORMALIZED INTERNAL MODELS (used by UI and downstream logic)
// =============================================================================

/**
 * Normalized Asteroid model.
 * Contains only the data needed for display and analysis.
 * No alternate units, no discovery metadata, no links.
 */
export interface Asteroid {
  /** Primary key: neo_reference_id from NeoWs */
  id: string;
  /** Display name */
  name: string;
  /** Official designation if available */
  designation?: string;
  /** Minimum estimated diameter in kilometers */
  diameter_min_km: number;
  /** Maximum estimated diameter in kilometers */
  diameter_max_km: number;
  /** Is this asteroid flagged as potentially hazardous? */
  hazardous_flag: boolean;
  /** Is this asteroid monitored by JPL Sentry? */
  sentry_flag: boolean;
}

/**
 * Normalized Close Approach Event.
 * Represents a single Earth flyby event for an asteroid.
 */
export interface CloseApproachEvent {
  /** Reference to parent asteroid's ID */
  asteroid_id: string;
  /** Asteroid name (for convenience) */
  asteroid_name: string;
  /** Approach date as ISO string (YYYY-MM-DD) */
  approach_date: string;
  /** Epoch timestamp in milliseconds */
  approach_timestamp: number;
  /** Miss distance in kilometers */
  miss_distance_km: number;
  /** Relative velocity in km/s */
  relative_velocity_km_s: number;
  /** Data source identifier */
  source: 'NASA NeoWs';
}

/**
 * Combined normalized response from NeoWs processing.
 */
export interface NormalizedNeoWsData {
  /** All unique asteroids in the response */
  asteroids: Asteroid[];
  /** All Earth close approach events */
  events: CloseApproachEvent[];
  /** Total count of events */
  element_count: number;
  /** Date range of the data */
  date_range: {
    start: string;
    end: string;
  };
  /** Timestamp when data was fetched */
  fetched_at: number;
}

// =============================================================================
// ERROR TYPES
// =============================================================================

export interface NeoWsError {
  code: 'API_KEY_MISSING' | 'API_KEY_INVALID' | 'RATE_LIMITED' | 'NETWORK_ERROR' | 'PARSE_ERROR';
  message: string;
  status?: number;
}
