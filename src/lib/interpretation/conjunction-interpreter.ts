/**
 * Conjunction Risk Interpreter
 * 
 * Interprets satellite/ISS conjunction events with a RESTRAINT-FIRST approach.
 * Default interpretation: "Routine orbital avoidance possible"
 * 
 * Earth impact risk and space-asset risk are INDEPENDENT dimensions.
 * 
 * @module interpretation/conjunction-interpreter
 */

import {
  ConjunctionInput,
  DecisionObject,
  RelevanceMatrix,
  ConfidenceModel,
  ConfidenceLevel,
  RiskExplanation,
  SystemContext,
  CONJUNCTION_THRESHOLDS,
} from './types';

// =============================================================================
// MAIN INTERPRETER
// =============================================================================

/**
 * Interpret a conjunction event between space assets.
 * 
 * DEFAULT INTERPRETATION: "Routine orbital avoidance possible"
 * This is NOT an emergency unless:
 * - Lead time is extremely short
 * - Confidence is high
 * - Maneuver windows are constrained
 * 
 * @param conjunction - The conjunction input data
 * @param context - System context
 * @returns Decision object with interpretation
 */
export function interpretConjunction(
  conjunction: ConjunctionInput,
  context: SystemContext
): DecisionObject {
  const interpretedAt = new Date().toISOString();
  const decisionId = `conj-${conjunction.primary_object.norad_id}-${conjunction.secondary_object.norad_id}-${Date.now()}`;
  
  // Calculate confidence
  const confidence = calculateConfidence(conjunction, context);
  
  // Calculate relevance matrix
  const relevance = calculateRelevance(conjunction, confidence);
  
  // Determine suppression
  const { suppressed, suppressionReason } = determineSuppression(
    conjunction,
    confidence,
    relevance
  );
  
  // Generate explanations
  const explanation = generateExplanation(conjunction, confidence);
  
  // Build summary
  const summary = buildSummary(conjunction, suppressed, relevance);
  
  return {
    decision_id: decisionId,
    event_id: `${conjunction.primary_object.norad_id}-${conjunction.secondary_object.norad_id}`,
    event_type: 'conjunction',
    interpreted_at: interpretedAt,
    relevance,
    confidence,
    explanation,
    suppressed,
    suppression_reason: suppressionReason,
    summary,
    technical_summary: buildTechnicalSummary(conjunction, confidence),
    source_snapshot: { conjunction },
  };
}

// =============================================================================
// CONFIDENCE CALCULATION
// =============================================================================

function calculateConfidence(
  conjunction: ConjunctionInput,
  context: SystemContext
): ConfidenceModel {
  const reasons: string[] = [];
  let confidenceLevel: ConfidenceLevel = 'medium'; // Default for conjunctions
  
  // Lead time affects confidence (more time = more refinement possible)
  if (conjunction.lead_time_hours > 72) {
    reasons.push('Sufficient lead time for trajectory refinement');
    confidenceLevel = 'medium';
  } else if (conjunction.lead_time_hours > 24) {
    reasons.push('Moderate lead time - predictions may refine');
    confidenceLevel = 'medium';
  } else if (conjunction.lead_time_hours > 4) {
    reasons.push('Limited lead time - predictions becoming stable');
    confidenceLevel = 'high';
  } else {
    reasons.push('Short lead time - high confidence in prediction');
    confidenceLevel = 'high';
  }
  
  // Collision probability provides confidence indicator
  if (conjunction.probability_of_collision !== undefined) {
    if (conjunction.probability_of_collision < 1e-7) {
      reasons.push('Collision probability is negligible');
    } else if (conjunction.probability_of_collision < 1e-4) {
      reasons.push('Collision probability is very low');
    } else {
      reasons.push('Elevated collision probability detected');
    }
  } else {
    reasons.push('Collision probability not calculated');
    if (confidenceLevel === 'high') confidenceLevel = 'medium';
  }
  
  // Data age
  if (context.data_age_hours > 24) {
    reasons.push('TLE data may be stale');
    confidenceLevel = 'low';
  }
  
  return {
    confidence_level: confidenceLevel,
    confidence_reason: reasons.join('. '),
    observation_age_hours: context.data_age_hours,
    error_margin_km: conjunction.miss_distance_km * 0.1, // Approximate 10% uncertainty
    orbit_stability: 'stable', // Satellites generally have stable orbits
  };
}

// =============================================================================
// RELEVANCE CALCULATION
// =============================================================================

function calculateRelevance(
  conjunction: ConjunctionInput,
  confidence: ConfidenceModel
): RelevanceMatrix {
  const relevance: RelevanceMatrix = {
    civilian_relevance: 'none', // ALWAYS none for conjunctions
    satellite_operator_relevance: 'none',
    iss_relevance: 'none',
    research_relevance: 'none',
  };
  
  const isIss = conjunction.primary_object.object_type === 'iss';
  const isClose = conjunction.miss_distance_km < CONJUNCTION_THRESHOLDS.MONITOR_DISTANCE_KM;
  const isEmergency = conjunction.lead_time_hours < CONJUNCTION_THRESHOLDS.EMERGENCY_LEAD_TIME_HOURS;
  const canManeuver = conjunction.maneuver_possible;
  const hasHighPc = conjunction.probability_of_collision !== undefined && 
    conjunction.probability_of_collision > CONJUNCTION_THRESHOLDS.COLLISION_PROBABILITY_THRESHOLD;
  
  // ==========================================================================
  // CIVILIAN RELEVANCE: ALWAYS NONE
  // ==========================================================================
  // Satellite conjunctions are NOT civilian-relevant
  // Even ISS events are handled by professionals, not civilians
  relevance.civilian_relevance = 'none';
  
  // ==========================================================================
  // ISS RELEVANCE
  // ==========================================================================
  if (isIss) {
    if (isClose && confidence.confidence_level !== 'low') {
      if (isEmergency && !canManeuver) {
        // Rare: Emergency with no maneuver option
        relevance.iss_relevance = 'actionable';
      } else if (isEmergency || hasHighPc) {
        relevance.iss_relevance = 'monitor';
      } else {
        // Default: Routine avoidance possible
        relevance.iss_relevance = 'low';
      }
    }
  }
  
  // ==========================================================================
  // SATELLITE OPERATOR RELEVANCE
  // ==========================================================================
  if (!isIss && conjunction.primary_object.object_type === 'satellite') {
    if (isClose && confidence.confidence_level !== 'low') {
      if (isEmergency && hasHighPc && !canManeuver) {
        relevance.satellite_operator_relevance = 'actionable';
      } else if (isEmergency || hasHighPc) {
        relevance.satellite_operator_relevance = 'monitor';
      } else if (conjunction.miss_distance_km < 10) {
        relevance.satellite_operator_relevance = 'low';
      }
    }
  }
  
  // ==========================================================================
  // RESEARCH RELEVANCE
  // ==========================================================================
  // Researchers may want to track close approaches for study
  if (isClose || hasHighPc) {
    relevance.research_relevance = 'low';
  }
  if (hasHighPc && conjunction.probability_of_collision! > 1e-3) {
    relevance.research_relevance = 'monitor';
  }
  
  return relevance;
}

// =============================================================================
// SUPPRESSION LOGIC
// =============================================================================

function determineSuppression(
  conjunction: ConjunctionInput,
  confidence: ConfidenceModel,
  relevance: RelevanceMatrix
): { suppressed: boolean; suppressionReason?: string } {
  // All 'none' → suppress
  if (
    relevance.civilian_relevance === 'none' &&
    relevance.satellite_operator_relevance === 'none' &&
    relevance.iss_relevance === 'none' &&
    relevance.research_relevance === 'none'
  ) {
    return {
      suppressed: true,
      suppressionReason: 'Conjunction does not meet relevance thresholds',
    };
  }
  
  // Low confidence + only 'low' relevance → suppress for non-researchers
  if (confidence.confidence_level === 'low') {
    const onlyResearch = 
      relevance.research_relevance !== 'none' &&
      relevance.iss_relevance === 'none' &&
      relevance.satellite_operator_relevance === 'none';
    
    if (!onlyResearch && 
        relevance.iss_relevance === 'low' && 
        relevance.satellite_operator_relevance === 'low') {
      return {
        suppressed: true,
        suppressionReason: 'Low confidence data - insufficient for operational use',
      };
    }
  }
  
  // Routine conjunction with maneuver capability → suppress civilian visibility
  if (conjunction.maneuver_possible && 
      conjunction.lead_time_hours > CONJUNCTION_THRESHOLDS.ROUTINE_AVOIDANCE_LEAD_TIME_HOURS) {
    // Don't suppress, but civilian is already 'none'
    // Event is only visible to operators
  }
  
  return { suppressed: false };
}

// =============================================================================
// EXPLANATION GENERATION
// =============================================================================

function generateExplanation(
  conjunction: ConjunctionInput,
  confidence: ConfidenceModel
): RiskExplanation {
  const isIss = conjunction.primary_object.object_type === 'iss';
  const primaryName = conjunction.primary_object.name;
  const secondaryName = conjunction.secondary_object.name;
  const leadTimeStr = formatLeadTime(conjunction.lead_time_hours);
  
  // Why this might matter
  let whyMatter: string;
  if (isIss) {
    whyMatter = `The ISS has a predicted close approach with ${secondaryName} in ${leadTimeStr}. ` +
      `Space agencies routinely track thousands of such events.`;
  } else {
    whyMatter = `${primaryName} has a predicted close approach with ${secondaryName} in ${leadTimeStr}. ` +
      `Satellite operators routinely manage such conjunctions.`;
  }
  
  // Why probably NOT dangerous
  let whyNotDangerous: string;
  if (conjunction.maneuver_possible && 
      conjunction.lead_time_hours > CONJUNCTION_THRESHOLDS.ROUTINE_AVOIDANCE_LEAD_TIME_HOURS) {
    whyNotDangerous = `Routine orbital avoidance is possible. ` +
      `With ${leadTimeStr} lead time, operators can plan and execute maneuvers if necessary. ` +
      `This is a normal part of space operations.`;
  } else if (conjunction.maneuver_possible) {
    whyNotDangerous = `Maneuver capability exists, though timeline is compressed. ` +
      `Operators are experienced in managing such situations.`;
  } else if (conjunction.miss_distance_km > 5) {
    whyNotDangerous = `The predicted miss distance of ${conjunction.miss_distance_km.toFixed(1)} km ` +
      `is sufficient to avoid collision. Space objects pass at these distances regularly.`;
  } else {
    whyNotDangerous = `While this is a close approach, space agencies have procedures for such events. ` +
      `Trajectory predictions continue to be refined.`;
  }
  
  // What would change assessment
  let whatWouldChange: string;
  if (conjunction.probability_of_collision !== undefined) {
    whatWouldChange = `Current collision probability: ${(conjunction.probability_of_collision * 100).toExponential(2)}%. ` +
      `Assessment would change if probability exceeds ${(CONJUNCTION_THRESHOLDS.COLLISION_PROBABILITY_THRESHOLD * 100).toFixed(2)}% ` +
      `with reduced lead time.`;
  } else {
    whatWouldChange = `Assessment would change with: (1) Updated tracking data showing closer approach, ` +
      `(2) Loss of maneuver capability, or (3) Calculated collision probability exceeding thresholds.`;
  }
  
  return {
    why_this_might_matter: whyMatter,
    why_probably_not_dangerous: whyNotDangerous,
    what_would_change_assessment: whatWouldChange,
  };
}

// =============================================================================
// SUMMARY BUILDERS
// =============================================================================

function buildSummary(
  conjunction: ConjunctionInput,
  suppressed: boolean,
  relevance: RelevanceMatrix
): string {
  if (suppressed) {
    return `${conjunction.primary_object.name}: No action required`;
  }
  
  const isIss = conjunction.primary_object.object_type === 'iss';
  const leadTime = formatLeadTime(conjunction.lead_time_hours);
  
  if (isIss) {
    if (relevance.iss_relevance === 'actionable') {
      return `ISS: Close approach with ${conjunction.secondary_object.name} in ${leadTime} - Elevated attention`;
    } else if (relevance.iss_relevance === 'monitor') {
      return `ISS: Tracking conjunction with ${conjunction.secondary_object.name} (${leadTime})`;
    } else {
      return `ISS: Routine tracking - ${conjunction.secondary_object.name} (${leadTime})`;
    }
  } else {
    return `${conjunction.primary_object.name}: Conjunction tracking (${conjunction.miss_distance_km.toFixed(1)} km)`;
  }
}

function buildTechnicalSummary(
  conjunction: ConjunctionInput,
  confidence: ConfidenceModel
): string {
  const pc = conjunction.probability_of_collision !== undefined
    ? `Pc: ${conjunction.probability_of_collision.toExponential(2)}`
    : 'Pc: N/A';
  
  return [
    `Primary: ${conjunction.primary_object.name} (${conjunction.primary_object.norad_id})`,
    `Secondary: ${conjunction.secondary_object.name} (${conjunction.secondary_object.norad_id})`,
    `TCA: ${conjunction.tca}`,
    `Miss Distance: ${conjunction.miss_distance_km.toFixed(2)} km`,
    `Rel Velocity: ${conjunction.relative_velocity_km_s.toFixed(2)} km/s`,
    `Lead Time: ${conjunction.lead_time_hours.toFixed(1)} hrs`,
    pc,
    `Maneuver: ${conjunction.maneuver_possible ? 'Yes' : 'No'}`,
    `Confidence: ${confidence.confidence_level}`,
  ].join(' | ');
}

// =============================================================================
// HELPERS
// =============================================================================

function formatLeadTime(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)} minutes`;
  } else if (hours < 24) {
    return `${hours.toFixed(1)} hours`;
  } else {
    return `${(hours / 24).toFixed(1)} days`;
  }
}

// =============================================================================
// BATCH PROCESSING
// =============================================================================

/**
 * Interpret multiple conjunctions.
 */
export function interpretConjunctions(
  conjunctions: ConjunctionInput[],
  context: SystemContext
): {
  decisions: DecisionObject[];
  stats: {
    total: number;
    suppressed: number;
    iss_relevant: number;
    operator_relevant: number;
  };
} {
  const decisions = conjunctions.map(c => interpretConjunction(c, context));
  
  return {
    decisions,
    stats: {
      total: decisions.length,
      suppressed: decisions.filter(d => d.suppressed).length,
      iss_relevant: decisions.filter(d => d.relevance.iss_relevance !== 'none').length,
      operator_relevant: decisions.filter(
        d => d.relevance.satellite_operator_relevance !== 'none'
      ).length,
    },
  };
}
