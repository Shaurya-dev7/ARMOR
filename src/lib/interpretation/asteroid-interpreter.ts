/**
 * Asteroid Interpreter (The "Brain")
 * 
 * Orchestrates the interpretation pipeline:
 * Input -> Confidence -> Relevance -> Suppression -> Reference -> Decision
 */

import { 
  AsteroidInput, 
  DecisionObject, 
  SystemContext,
  RelevanceMatrix,
  ConfidenceModel,
  ASTEROID_THRESHOLDS,
} from './types';


// =============================================================================
// THRESHOLDS
// =============================================================================

// ASTEROID_THRESHOLDS imported from types


// =============================================================================
// MAIN INTERPRETER
// =============================================================================

import { 
  generatePublicAlert, 
  determineAlertLevel, 
  convertAsteroidInputToPublicAlertData,
  PublicAlertOutput 
} from './public-alert-generator';

export function interpretAsteroid(
  asteroid: AsteroidInput,
  context: SystemContext
): DecisionObject {
  const decisionId = `asteroid-${asteroid.object_id}-${Date.now()}`;
  const timestamp = new Date().toISOString();

  // 1. Calculate Confidence
  const confidence = calculateConfidence(asteroid, context);

  // 2. Calculate Relevance (Role-based interest)
  const relevance = calculateRelevance(asteroid, confidence);

  // 3. Determine Suppression (Should anyone be bothered?)
  const { suppressed, suppressionReason } = determineSuppression(
    asteroid,
    confidence,
    relevance
  );

  // 4. Generate Core Explanation Text
  const explanation = generateExplanationText(asteroid, relevance, confidence);

  // 4b. Generate Public Alert (if meant for public)
  let publicAlert: PublicAlertOutput | undefined;
  if (!suppressed && relevance.civilian_relevance !== 'none') {
    const alertData = convertAsteroidInputToPublicAlertData(asteroid);
    publicAlert = {
      alert_level: determineAlertLevel(alertData),
      language: 'en',
      message: generatePublicAlert(alertData)
    };
  }

  // 5. Assemble Decision
  const decision: DecisionObject = {
    decision_id: decisionId,
    event_id: asteroid.object_id,
    event_type: 'asteroid',
    interpreted_at: timestamp,
    
    suppressed,
    suppression_reason: suppressionReason,
    
    relevance,
    confidence,
    explanation,
    summary: explanation.why_probably_not_dangerous,
    
    source_snapshot: asteroid as unknown as Record<string, unknown>,
    public_alert: publicAlert,
  };


  return decision;
}

// =============================================================================
// LOGIC MODULES
// =============================================================================

function calculateConfidence(
  asteroid: AsteroidInput,
  context: SystemContext
): ConfidenceModel {
  const observationAge = asteroid.observation_age_hours ?? 0;
  const errorMargin = asteroid.orbital_uncertainty ?? 10000; // Default 10k km if unknown

  let confidenceLevel: 'high' | 'medium' | 'low' = 'high';
  let reason = 'Data is recent and precise.';

  // Age Checks
  if (observationAge > ASTEROID_THRESHOLDS.MAX_OBSERVATION_AGE_MEDIUM_CONFIDENCE) {
    confidenceLevel = 'low';
    reason = 'Observation data is stale (> 7 days).';
  } else if (observationAge > ASTEROID_THRESHOLDS.MAX_OBSERVATION_AGE_HIGH_CONFIDENCE) {
    confidenceLevel = 'medium';
    reason = 'Data is > 48 hours old.';
  }

  // Uncertainty Checks
  if (errorMargin > ASTEROID_THRESHOLDS.HIGH_UNCERTAINTY_MARGIN_KM) {
    confidenceLevel = 'low';
    reason = 'Orbital uncertainty is very high.';
  } else if (errorMargin > 10000) {
    if (confidenceLevel === 'high') confidenceLevel = 'medium';
    reason += ' Moderate orbital uncertainty.';
  }

  return {
    confidence_level: confidenceLevel,
    confidence_reason: reason,
    observation_age_hours: observationAge,
    error_margin_km: errorMargin,
    orbit_stability: 'stable', // simplified
  };
}

function calculateRelevance(
  asteroid: AsteroidInput,
  confidence: ConfidenceModel
): RelevanceMatrix {
  const relevance: RelevanceMatrix = {
    civilian_relevance: 'none',
    satellite_operator_relevance: 'none',
    iss_relevance: 'none',
    research_relevance: 'none',
  };

  const avgDiameter = (asteroid.diameter_min_km + asteroid.diameter_max_km) / 2;
  const isClose = asteroid.miss_distance_km < ASTEROID_THRESHOLDS.LUNAR_DISTANCE_KM;
  
  // --- RESEARCH RELEVANCE ---
  if (avgDiameter >= ASTEROID_THRESHOLDS.MIN_DIAMETER_TRACKING_KM) {
    // Only set base relevance if somewhat interesting (close OR large OR flagged)
    // Filter out small (10m) rocks at huge distances (>2M km) unless flagged
    if (asteroid.miss_distance_km < 2000000 || avgDiameter >= 0.1 || asteroid.sentry_flag || asteroid.potentially_hazardous_flag) {
      relevance.research_relevance = 'low';
    }
    
    // Sentry objects are always of research interest
    if (asteroid.sentry_flag) {
      relevance.research_relevance = 'monitor';
    }

    // Hazardous + Size
    if (asteroid.potentially_hazardous_flag && avgDiameter >= 0.1) {
      relevance.research_relevance = 'monitor';
    }
  }

  // If confidence is low, strictly limit higher relevance
  if (confidence.confidence_level === 'low') {
    // Researchers might still want to see it to improve orbit
    if (relevance.research_relevance !== 'none') {
        relevance.research_relevance = 'low';
    }
    return relevance; // Abort other roles
  }

  // --- CIVILIAN RELEVANCE ---
  // Only if truly hazardous AND verified close approach
  if (asteroid.potentially_hazardous_flag && isClose) {
    relevance.civilian_relevance = 'monitor';
  }
  // Impact probability > 0 (And filtered by high confidence ideal, but assuming distinct flag)
  if (asteroid.impact_probability && asteroid.impact_probability > 0.01) {
      relevance.civilian_relevance = 'actionable'; // Panic prevention: threshold > 0.01%
  }
  
  // Check for "Actionable" triggers (unlikely for asteroids)
  // ...

  return relevance;
}

function determineSuppression(
  asteroid: AsteroidInput,
  confidence: ConfidenceModel,
  relevance: RelevanceMatrix
): { suppressed: boolean; suppressionReason?: string } {
    
  // Rule 1: All relevance is 'none' → SUPPRESS
  if (relevance.civilian_relevance === 'none' && 
      relevance.satellite_operator_relevance === 'none' &&
      relevance.iss_relevance === 'none' &&
      relevance.research_relevance === 'none') {
    return {
      suppressed: true,
      suppressionReason: 'No audience-relevant factors identified',
    };
  }

  // Rule 2: Low confidence limits visibility to researchers only
  // If only research relevance exists, and confidence is low, we might suppress depending on how "bad" it is.
  // But generally researchers want to handle low confidence data.
  
  // Rule 3: Routine Flyby Suppression
  // 10m rock at 5M km.
  // calculateRelevance likely set research='none' for this case due to filters.
  // But if it slipped through:
  const avgDiameter = (asteroid.diameter_min_km + asteroid.diameter_max_km) / 2;
  if (asteroid.miss_distance_km > 2000000 && avgDiameter < 0.1 && !asteroid.sentry_flag) {
      // It's a small, distant rock.
      // Even if research marked it 'low', we might want to suppress it to reduce noise?
      // No, let research see it if calculateRelevance said so.
  }
  
  // Rule 4: Tiny close objects (Fireballs)
  // 1m object at 10,000 km.
  // avgDiameter 0.001. MIN_DIAMETER 0.01.
  // calculateRelevance ignores avgDiameter < 0.01.
  // checking... logic says `if (avgDiameter >= MIN...)`
  // So tiny objects get 'none' research relevance.
  // Result: Suppressed.
  
  return { suppressed: false };
}

function generateExplanationText(
    asteroid: AsteroidInput,
    relevance: RelevanceMatrix,
    confidence: ConfidenceModel
) {
    const lunarDist = (asteroid.miss_distance_km / ASTEROID_THRESHOLDS.LUNAR_DISTANCE_KM).toFixed(1);
    
    let matter = 'Routine orbital pass.';
    if (relevance.research_relevance === 'monitor') matter = 'Object of interest for orbital monitoring.';
    if (asteroid.sentry_flag) matter = 'Listed on Sentry Risk Table.';
    
    let safe = `Passes at ${lunarDist}x Lunar Distance.`;
    if (asteroid.miss_distance_km > 5000000) safe = 'Extremely distant pass.';
    
    let change = 'Significant gravitational perturbation.';
    if (confidence.confidence_level === 'low') change = 'New observations reducing uncertainty.';
    
    return {
        why_this_might_matter: matter,
        why_probably_not_dangerous: safe,
        what_would_change_assessment: change,
    };
}
