/**
 * Public Alert Message Generator
 * 
 * Converts verified asteroid monitoring data into calm, factual,
 * and non-alarming alert messages for the general public.
 * 
 * BEHAVIOR RULES:
 * - Never use alarming, sensational, or emotional language.
 * - Never exaggerate risk or imply danger unless explicitly stated in the data.
 * - BANNED WORDS: impact, collision, disaster, dangerous, catastrophic, threat.
 * - Do not speculate, predict, or assume outcomes.
 * - Do not mention internal formulas, calculations, or scoring logic.
 * - Always emphasize monitoring, observation, and scientific tracking.
 * - Maintain a reassuring, neutral, and educational tone.
 * 
 * @module interpretation/public-alert-generator
 */

import { AsteroidInput, ASTEROID_THRESHOLDS } from './types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Input structure for public alert generation.
 * Maps to the user's template format.
 */
export interface PublicAlertData {
  /** Name of the asteroid */
  asteroid_name: string;
  /** Close approach distance in Astronomical Units */
  distance_au: number;
  /** Estimated diameter in meters */
  diameter_meters: number;
  /** Relative velocity in km/s */
  velocity_km_s: number;
  /** Internal risk score (not exposed to public) */
  risk_score?: number;
  /** Planetary Exposure Index (not exposed to public) */
  pei_value?: number;
  /** Whether this is a Sentry-monitored object */
  is_sentry_monitored?: boolean;
  /** Whether marked as potentially hazardous by NASA */
  is_potentially_hazardous?: boolean;
}

/**
 * Alert levels for public-facing messages.
 * Never use urgent or warning-style language for any level.
 */
export type AlertLevel = 'LEVEL 1' | 'LEVEL 2' | 'LEVEL 3';

/**
 * Structured output for public alerts.
 */
export interface PublicAlertOutput {
  /** Alert level (LEVEL 1, 2, or 3) */
  alert_level: AlertLevel;
  /** Language of the message */
  language: string;
  /** The public-facing alert message */
  message: string;
}

/**
 * Determines the appropriate alert level based on asteroid data.
 * 
 * - LEVEL 1 — INFORMATIONAL: Routine close approaches
 * - LEVEL 2 — MONITORING WATCH: Elevated size/speed/proximity
 * - LEVEL 3 — SCIENTIFIC INTEREST: Large, fast, or well-tracked objects
 */
export function determineAlertLevel(data: PublicAlertData): AlertLevel {
  const lunarDistances = data.distance_au / LUNAR_DISTANCE_AU;
  
  // LEVEL 3: Scientific Interest
  // Large objects (>500m), or Sentry-monitored, or very fast (>30 km/s)
  if (
    data.diameter_meters >= 500 ||
    data.is_sentry_monitored ||
    data.velocity_km_s >= 30 ||
    (data.is_potentially_hazardous && data.diameter_meters >= 200)
  ) {
    return 'LEVEL 3';
  }
  
  // LEVEL 2: Monitoring Watch
  // Medium objects (100-500m), close approaches (<5 lunar distances), or elevated PEI
  if (
    data.diameter_meters >= 100 ||
    lunarDistances <= 5 ||
    (data.pei_value && data.pei_value >= 50) ||
    data.velocity_km_s >= 20
  ) {
    return 'LEVEL 2';
  }
  
  // LEVEL 1: Informational
  // Everything else - routine close approaches
  return 'LEVEL 1';
}


// =============================================================================
// CONSTANTS
// =============================================================================

/** 1 AU in kilometers */
const AU_IN_KM = 149_597_870.7;

/** Lunar distance in AU for comparison */
const LUNAR_DISTANCE_AU = ASTEROID_THRESHOLDS.LUNAR_DISTANCE_KM / AU_IN_KM;

/**
 * Words that must NEVER appear in public alerts.
 * Used for validation.
 */
const BANNED_WORDS = [
  'impact',
  'collision',
  'disaster',
  'dangerous',
  'catastrophic',
  'threat',
  'hit',
  'strike',
  'destroy',
  'extinction',
  'apocalypse',
  'doom',
  'terror',
  'panic',
];

// =============================================================================
// MAIN FUNCTION
// =============================================================================

/**
 * Generates a calm, factual public-facing alert message.
 * 
 * @param data - Verified asteroid data
 * @returns A 2-4 sentence public alert message
 */
export function generatePublicAlert(data: PublicAlertData): string {
  const lunarDistances = (data.distance_au / LUNAR_DISTANCE_AU).toFixed(1);
  const distanceDescription = getDistanceDescription(data.distance_au);
  const sizeDescription = getSizeDescription(data.diameter_meters);
  
  // Build the message
  let message = `Asteroid ${data.asteroid_name} is being tracked by global monitoring networks. `;
  
  // Distance context
  if (parseFloat(lunarDistances) <= 10) {
    message += `It will pass at approximately ${lunarDistances} times the Earth-Moon distance${distanceDescription}. `;
  } else {
    message += `It will pass at a ${distanceDescription} distance from Earth. `;
  }
  
  // Size context
  message += `${sizeDescription} `;
  
  // Reassurance
  message += getReassuranceStatement(data);
  
  // Validate no banned words slipped through
  validateNoBannedWords(message);
  
  return message.trim();
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Converts AsteroidInput from the interpretation layer to PublicAlertData.
 */
export function convertAsteroidInputToPublicAlertData(
  asteroid: AsteroidInput
): PublicAlertData {
  const avgDiameter = (asteroid.diameter_min_km + asteroid.diameter_max_km) / 2;
  
  return {
    asteroid_name: asteroid.name,
    distance_au: asteroid.miss_distance_km / AU_IN_KM,
    diameter_meters: avgDiameter * 1000, // km to meters
    velocity_km_s: asteroid.velocity_km_s,
    is_sentry_monitored: asteroid.sentry_flag,
    is_potentially_hazardous: asteroid.potentially_hazardous_flag,
  };
}

/**
 * Returns a human-readable distance description.
 */
function getDistanceDescription(distanceAu: number): string {
  if (distanceAu < 0.01) {
    return ', which is relatively close in astronomical terms';
  } else if (distanceAu < 0.05) {
    return ', a distance well within our monitoring range';
  } else if (distanceAu < 0.2) {
    return ', a comfortable distance for observation';
  } else {
    return ', far beyond any area of concern';
  }
}

/**
 * Returns a human-readable size description.
 */
function getSizeDescription(diameterMeters: number): string {
  if (diameterMeters < 10) {
    return 'This is a small object that would burn up entirely in the atmosphere if it ever approached.';
  } else if (diameterMeters < 50) {
    return 'This object is comparable in size to a large building.';
  } else if (diameterMeters < 150) {
    return 'This object is stadium-sized, of interest to researchers worldwide.';
  } else if (diameterMeters < 500) {
    return 'This is a significant object under continuous scientific observation.';
  } else {
    return 'This is a large asteroid that space agencies monitor closely as part of routine planetary defense activities.';
  }
}

/**
 * Returns a reassurance statement based on the data.
 */
function getReassuranceStatement(data: PublicAlertData): string {
  if (data.is_sentry_monitored) {
    return 'This object is catalogued in NASA\'s Sentry system, which continuously tracks all known near-Earth objects for scientific study.';
  } else if (data.is_potentially_hazardous) {
    return 'While classified as "potentially hazardous" due to its size and orbital path, this is a precautionary label used by astronomers; there is no confirmed close approach of concern.';
  } else {
    return 'No action is required. Scientists continue to observe and refine orbital data as part of ongoing space awareness efforts.';
  }
}

/**
 * Validates that no banned words appear in the message.
 * Throws an error if found (should never happen with proper implementation).
 */
function validateNoBannedWords(message: string): void {
  const lowerMessage = message.toLowerCase();
  for (const word of BANNED_WORDS) {
    if (lowerMessage.includes(word)) {
      console.error(`[PUBLIC ALERT ERROR] Banned word detected: "${word}"`);
      // In production, this should alert monitoring systems
      throw new Error(`Alert validation failed: contains banned word "${word}"`);
    }
  }
}
