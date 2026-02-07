/**
 * Risk Interpretation Layer - Type Definitions
 * 
 * This layer produces meaning, not alarms.
 * Most events should result in suppression (no alert).
 * 
 * @module interpretation/types
 */

// =============================================================================
// RELEVANCE LEVELS
// =============================================================================

/**
 * Relevance level for a specific audience.
 * 
 * - `none`: No relevance - event should be suppressed for this audience
 * - `low`: Dashboard only, collapsed/hidden by default
 * - `monitor`: Silent tracking, no notification
 * - `actionable`: Alert allowed (rare - should be exceptional)
 */
export type RelevanceLevel = 'none' | 'low' | 'monitor' | 'actionable';

/**
 * Relevance matrix - different audiences see different interpretations.
 * If all fields are 'none', the event MUST be suppressed.
 */
export interface RelevanceMatrix {
  /** General public - default to reassurance, rarely show alerts */
  civilian_relevance: RelevanceLevel;
  /** Satellite operators - focus on orbital shells and conjunction windows */
  satellite_operator_relevance: RelevanceLevel;
  /** ISS operations - specific to station proximity events */
  iss_relevance: RelevanceLevel;
  /** Researchers - show uncertainty, raw confidence, no simplification */
  research_relevance: RelevanceLevel;
}

// =============================================================================
// CONFIDENCE MODEL
// =============================================================================

/**
 * Orbit stability classification.
 * Affects confidence and interpretation weight.
 */
export type OrbitStability = 'stable' | 'uncertain' | 'chaotic';

/**
 * Confidence level - uncertainty MUST lower visibility, not increase it.
 */
export type ConfidenceLevel = 'low' | 'medium' | 'high';

/**
 * Explicit confidence signaling - mandatory for all interpretations.
 * Hidden or omitted confidence is a system failure.
 */
export interface ConfidenceModel {
  /** Overall confidence in the interpretation */
  confidence_level: ConfidenceLevel;
  /** Human-readable explanation of confidence factors */
  confidence_reason: string;
  /** How old is the observation data (hours) */
  observation_age_hours: number;
  /** Error margin in kilometers */
  error_margin_km: number;
  /** Orbit stability assessment */
  orbit_stability: OrbitStability;
  /** Number of observations used */
  observation_count?: number;
  /** Last observation timestamp */
  last_observation?: string;
}

// =============================================================================
// RISK EXPLANATION
// =============================================================================

/**
 * Human-readable risk explanation - required for ALL non-suppressed events.
 * The goal is to neutralize fear, not amplify it.
 */
export interface RiskExplanation {
  /** Why this event might be worth noting */
  why_this_might_matter: string;
  /** Why this is probably NOT dangerous - default framing */
  why_probably_not_dangerous: string;
  /** What conditions would change this assessment */
  what_would_change_assessment: string;
}

// =============================================================================
// DECISION OBJECT (PRIMARY OUTPUT)
// =============================================================================

/**
 * The Decision Object is the sole output of the interpretation layer.
 * This object determines what downstream systems can do.
 * 
 * Downstream systems (UI, notifications) are NOT allowed to:
 * - Escalate severity
 * - Add alarmist framing
 * - Remove confidence language
 */
export interface DecisionObject {
  /** Unique identifier for this interpretation */
  decision_id: string;
  /** Reference to the source event */
  event_id: string;
  /** Event type for routing */
  event_type: 'asteroid' | 'conjunction' | 'debris';
  /** Timestamp when interpretation was made */
  interpreted_at: string;
  
  // Core interpretation
  
  /** Audience-specific relevance levels */
  relevance: RelevanceMatrix;
  /** Confidence model with explicit uncertainty */
  confidence: ConfidenceModel;
  /** Human-readable explanations */
  explanation: RiskExplanation;
  
  // Gating
  
  /** If true, event should not appear in any UI or notification */
  suppressed: boolean;
  /** Why the event was suppressed (for logging/debugging) */
  suppression_reason?: string;
  
  // Metadata
  
  /** Summary suitable for dashboard display */
  summary: string;
  /** Technical details for operators/researchers */
  technical_summary?: string;
  /** Source data snapshot for audit */
  source_snapshot?: Record<string, unknown>;
}

// =============================================================================
// INPUT TYPES (What this layer receives)
// =============================================================================

/**
 * Asteroid close approach input for interpretation.
 * Matches normalized NeoWs data structure.
 */
export interface AsteroidInput {
  /** Object ID from NeoWs */
  object_id: string;
  /** Object name */
  name: string;
  /** Minimum estimated diameter (km) */
  diameter_min_km: number;
  /** Maximum estimated diameter (km) */
  diameter_max_km: number;
  /** Relative velocity (km/s) */
  velocity_km_s: number;
  /** Miss distance (km) */
  miss_distance_km: number;
  /** Close approach timestamp (ISO) */
  approach_time: string;
  /** Orbital uncertainty (if available) */
  orbital_uncertainty?: number;
  /** Observation age (hours) */
  observation_age_hours?: number;
  /** Raw potentially hazardous flag (NOT trusted) */
  potentially_hazardous_flag: boolean;
  /** Is this monitored by JPL Sentry? */
  sentry_flag?: boolean;
  /** Impact probability (0-1) */
  impact_probability?: number;
}

/**
 * Space asset conjunction input for interpretation.
 */
export interface ConjunctionInput {
  /** Primary object (e.g., satellite, ISS) */
  primary_object: {
    norad_id: number;
    name: string;
    object_type: 'iss' | 'satellite' | 'debris';
    orbit_regime: 'LEO' | 'MEO' | 'GEO' | 'HEO';
  };
  /** Secondary object (potential collision) */
  secondary_object: {
    norad_id: number;
    name: string;
    object_type: 'satellite' | 'debris' | 'unknown';
  };
  /** Time of closest approach (ISO) */
  tca: string;
  /** Miss distance at TCA (km) */
  miss_distance_km: number;
  /** Relative velocity (km/s) */
  relative_velocity_km_s: number;
  /** Probability of collision (if calculated) */
  probability_of_collision?: number;
  /** Time until TCA (hours) */
  lead_time_hours: number;
  /** Is maneuver possible? */
  maneuver_possible: boolean;
}

/**
 * Debris re-entry input for interpretation.
 */
export interface DebrisInput {
  /** Unique object identifier */
  id: string;
  /** Common name (e.g., "CZ-5B R/B") */
  name?: string;
  /** Mass in kilograms */
  mass_kg: number;
  /** Predicted re-entry time (ISO) */
  predicted_reentry_time: string;
  /** Uncertainty window in minutes */
  uncertainty_minutes: number;
  /** Data age in hours */
  data_age_hours: number;
  /** Orbital inclination (degrees) */
  inclination_deg?: number;
  /** Is this a controlled re-entry? */
  is_controlled_reentry?: boolean;
}

/**
 * System context for interpretation.
 */
export interface SystemContext {
  /** Current timestamp */
  current_time: string;
  /** Prediction horizon (hours) */
  prediction_horizon_hours: number;
  /** Data freshness indicator */
  data_age_hours: number;
  /** Is this a dry run / test mode? */
  dry_run?: boolean;
}

// =============================================================================
// INTERPRETATION REQUEST/RESPONSE
// =============================================================================

/**
 * Request to the interpretation layer.
 */
export interface InterpretationRequest {
  /** Asteroid events to interpret */
  asteroids?: AsteroidInput[];
  /** Conjunction events to interpret */
  conjunctions?: ConjunctionInput[];
  /** Debris events to interpret */
  debris?: DebrisInput[];
  /** System context */
  context: SystemContext;
  /** Requesting audience (for pre-filtering) */
  requesting_audience?: 'civilian' | 'operator' | 'researcher' | 'all';
}

/**
 * Response from the interpretation layer.
 */
export interface InterpretationResponse {
  /** All decision objects (including suppressed) */
  decisions: DecisionObject[];
  /** Number of events suppressed */
  suppressed_count: number;
  /** Number of events with any relevance */
  relevant_count: number;
  /** Interpretation timestamp */
  interpreted_at: string;
  /** Processing time (ms) */
  processing_time_ms: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Thresholds for asteroid interpretation.
 * Distance alone NEVER triggers relevance.
 */
export const ASTEROID_THRESHOLDS = {
  /** Minimum diameter (km) for civilian concern */
  MIN_DIAMETER_CIVILIAN_KM: 0.1, // 100 meters
  /** Minimum diameter (km) for any tracking */
  MIN_DIAMETER_TRACKING_KM: 0.01, // 10 meters
  /** High uncertainty threshold */
  HIGH_UNCERTAINTY_MARGIN_KM: 100000,
  /** Maximum observation age (hours) for high confidence */
  MAX_OBSERVATION_AGE_HIGH_CONFIDENCE: 48,
  /** Maximum observation age (hours) for medium confidence */
  MAX_OBSERVATION_AGE_MEDIUM_CONFIDENCE: 168, // 7 days
  /** Lunar distance in km for comparison */
  LUNAR_DISTANCE_KM: 384400,
} as const;

/**
 * Thresholds for conjunction interpretation.
 */
export const CONJUNCTION_THRESHOLDS = {
  /** Close approach distance (km) that triggers monitoring */
  MONITOR_DISTANCE_KM: 50,
  /** Minimum lead time (hours) for routine avoidance */
  ROUTINE_AVOIDANCE_LEAD_TIME_HOURS: 24,
  /** Emergency threshold (hours) */
  EMERGENCY_LEAD_TIME_HOURS: 4,
  /** Collision probability threshold for escalation */
  COLLISION_PROBABILITY_THRESHOLD: 1e-4,
} as const;

/**
 * Thresholds for debris interpretation.
 */
export const DEBRIS_THRESHOLDS = {
  /** Mass (kg) below which we always suppress */
  ALWAYS_SUPPRESS_BELOW_KG: 10,
  /** Mass (kg) likely to burn up completely */
  LIKELY_BURNUP_MAX_KG: 500,
  /** Mass (kg) considered large/significant */
  LARGE_OBJECT_MIN_KG: 2000,
  /** Suppression horizon (days) */
  FAR_OUT_SUPPRESSION_DAYS: 7,
  /** Imminent re-entry window (hours) */
  IMMINENT_REENTRY_HOURS: 2,
  /** Minimum uncertainty (min) for low confidence */
  LOW_CONFIDENCE_UNCERTAINTY_MIN: 180,
  /** Maximum data age (hours) before considered stale */
  STALE_DATA_HOURS: 72,
} as const;
