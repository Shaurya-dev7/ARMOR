import {
  DebrisInput,
  DecisionObject,
  RelevanceMatrix,
  ConfidenceModel,
  RiskExplanation,
  SystemContext,
  DEBRIS_THRESHOLDS,
  ConfidenceLevel,
  RelevanceLevel
} from './types';

/**
 * Interpret a debris re-entry event.
 * 
 * 1️⃣ PURPOSE: "What is falling down?"
 * 2️⃣ PRINCIPLES: Re-entry ≠ danger. Burn-up is default.
 */
export function interpretDebris(
  debris: DebrisInput,
  context: SystemContext
): DecisionObject {
  const interpretedAt = new Date().toISOString();
  // Safe ID generation
  const decisionId = `debris-${debris.id}-${Date.now()}`;

  // 1. Calculate Confidence (Mandatory first step)
  const confidence = calculateConfidence(debris);

  // 2. Calculate Relevance (Role-based)
  // Logic: Suppression is calculated INSIDE relevance or as a pre-check?
  // User spec: "Suppression Rules (Apply these before any relevance logic)"
  // So we check suppression first.
  const { suppressed, suppressionReason } = determineSuppression(debris, confidence);

  let relevance: RelevanceMatrix;
  if (suppressed) {
      // If suppressed, all relevance is none
      relevance = {
          civilian_relevance: 'none',
          satellite_operator_relevance: 'none',
          iss_relevance: 'none',
          research_relevance: 'none'
      };
  } else {
      relevance = calculateRelevance(debris, confidence);
  }

  // 3. Generate Explanation
  // "If any relevance ≠ none, generate explanations"
  // Even if suppressed, we might want to generate explanation for debugging/logging, 
  // but strictly for DecisionObject, it's required.
  const explanation = generateExplanation(debris, relevance, confidence, suppressed);

  // 4. Build Summary
  const summary = buildSummary(debris, suppressed, relevance);

  // 5. Final Alert Gating (Implicit in relevance, but double check)
  // "Alert Gating Rule: Debris Interpreter may only enable alerts if relevance == actionable AND confidence == high"
  // This is enforced in calculateRelevance.

  return {
    decision_id: decisionId,
    event_id: debris.id,
    event_type: 'debris', // This needs to be added to DecisionObject event_type union if not present, but interpreted generically
    interpreted_at: interpretedAt,
    
    relevance,
    confidence,
    explanation,
    
    suppressed,
    suppression_reason: suppressionReason,
    
    summary,
    source_snapshot: debris as unknown as Record<string, unknown>,
  };
}

// =============================================================================
// CONFIDENCE MODEL
// =============================================================================

function calculateConfidence(debris: DebrisInput): ConfidenceModel {
  let level: ConfidenceLevel = 'medium';
  let reason = '';
  const reasons: string[] = [];

  // Rules
  if (debris.uncertainty_minutes > DEBRIS_THRESHOLDS.LOW_CONFIDENCE_UNCERTAINTY_MIN) {
      level = 'low';
      reasons.push(`High uncertainty window (> ${DEBRIS_THRESHOLDS.LOW_CONFIDENCE_UNCERTAINTY_MIN} min)`);
  } else if (debris.data_age_hours > DEBRIS_THRESHOLDS.STALE_DATA_HOURS) {
      level = 'low';
      reasons.push(`Data is stale (> ${DEBRIS_THRESHOLDS.STALE_DATA_HOURS}h old)`);
  } else if (debris.uncertainty_minutes > 60) {
      level = 'medium';
      reasons.push('Moderate uncertainty window (1-3 hours)');
  } else {
      // < 60 min and fresh data
      level = 'high';
      reasons.push('Low uncertainty, fresh data');
  }

  return {
      confidence_level: level,
      confidence_reason: reasons.join('. ') || 'Standard assessment',
      observation_age_hours: debris.data_age_hours,
      error_margin_km: 0, // Not applicable for re-entry time/location usually, or map minutes to km roughly? Leaving 0.
      orbit_stability: 'chaotic', // Re-entry is inherently chaotic/decaying
  };
}

// =============================================================================
// SUPPRESSION LOGIC
// =============================================================================

function determineSuppression(
  debris: DebrisInput,
  confidence: ConfidenceModel
): { suppressed: boolean; suppressionReason?: string } {
    
  // 1. Mass < 10kg
  if (debris.mass_kg < DEBRIS_THRESHOLDS.ALWAYS_SUPPRESS_BELOW_KG) {
      return { suppressed: true, suppressionReason: 'Mass below tracking threshold (<10kg)' };
  }

  // 2. Far future (> 7 days)
  const reentryTime = new Date(debris.predicted_reentry_time).getTime();
  const now = Date.now();
  const hoursUntil = (reentryTime - now) / (1000 * 60 * 60);
  const daysUntil = hoursUntil / 24;

  if (daysUntil > DEBRIS_THRESHOLDS.FAR_OUT_SUPPRESSION_DAYS) {
      return { suppressed: true, suppressionReason: 'Event is > 7 days away' };
  }

  // 3. Controlled re-entry AND civilian audience (Implicitly suppressed for civilians, but strictly suppressed if NO other interest?)
  // "Controlled re-entry AND civilian audience" -> this implies specific relevance suppression, but hard suppression?
  // Spec says: "Suppress immediately if any are true: ... Controlled re-entry AND civilian audience"
  // This likely means if the interpretation is FOR a civilian audience context? 
  // But interpretDebris generates a static DecisionObject for ALL audiences usually.
  // However, if we interpret strictly: "relevance: all = 'none'"
  // So if it's controlled, we suppress it completely? 
  // "Controlled re-entry (suppression + explanation)" in purpose.
  // Let's assume controlled re-entries are suppressing UNLESS specific operator interest?
  // Spec: "Controlled re-entry AND civilian audience" -> Result: "relevance: all = 'none'"
  // This suggests we treat it as suppressed globally if we assume the "view" is general.
  // BUT, Operators might want to know?
  // Re-read: "Suppression Rules ... Result: relevance: all = 'none'".
  // So yes, global suppression.
  if (debris.is_controlled_reentry) {
       return { suppressed: true, suppressionReason: 'Controlled re-entry (routine operation)' };
  }

  // 4. Stale data AND high uncertainty
  if (debris.data_age_hours > 72 && debris.uncertainty_minutes > DEBRIS_THRESHOLDS.LOW_CONFIDENCE_UNCERTAINTY_MIN) {
      return { suppressed: true, suppressionReason: 'Data too stale and uncertain' };
  }

  return { suppressed: false };
}

// =============================================================================
// RELEVANCE LOGIC
// =============================================================================

function calculateRelevance(
  debris: DebrisInput,
  confidence: ConfidenceModel
): RelevanceMatrix {
  const relevance: RelevanceMatrix = {
      civilian_relevance: 'none',
      satellite_operator_relevance: 'none',
      iss_relevance: 'none',
      research_relevance: 'none'
  };

  const reentryTime = new Date(debris.predicted_reentry_time).getTime();
  const now = Date.now();
  const hoursUntil = (reentryTime - now) / (1000 * 60 * 60);

  // ---------------------------------------------
  // 👤 CIVILIAN
  // ---------------------------------------------
  // Default: none
  
  // Escalate to monitor if: Mass >= 2000kg AND < 2 hours AND confidence != low
  if (debris.mass_kg >= DEBRIS_THRESHOLDS.LARGE_OBJECT_MIN_KG &&
      hoursUntil < DEBRIS_THRESHOLDS.IMMINENT_REENTRY_HOURS &&
      confidence.confidence_level !== 'low') {
      
      relevance.civilian_relevance = 'monitor';
      
      // Escalate to actionable if: extreme mass AND high confidence
      // (Pretending we have ground hazard data, which we don't, but spec says "AND projected ground hazard exists")
      // Since we don't have ground hazard inputs in DebrisInput, we can't fulfill "AND projected ground hazard".
      // Therefore, we MUST NOT escalate to actionable based on mass alone.
      // "otherwise forbidden"
      // So max is monitor.
  }

  // ---------------------------------------------
  // 🛰️ OPERATOR
  // ---------------------------------------------
  // Default: low
  relevance.satellite_operator_relevance = 'low';

  // Escalate to monitor if: Large, Imminent, Inclination overlap (assuming all for now as we don't check overlap)
  if (debris.mass_kg >= DEBRIS_THRESHOLDS.LARGE_OBJECT_MIN_KG && 
      hoursUntil < DEBRIS_THRESHOLDS.IMMINENT_REENTRY_HOURS) {
      relevance.satellite_operator_relevance = 'monitor';
  }
  // Never actionable.

  // ---------------------------------------------
  // 🔬 RESEARCHER
  // ---------------------------------------------
  // Default: monitor
  relevance.research_relevance = 'monitor';
  
  // Escalate to actionable if: Large, Imminent, Confidence >= medium
  if (debris.mass_kg >= DEBRIS_THRESHOLDS.LARGE_OBJECT_MIN_KG &&
      hoursUntil < DEBRIS_THRESHOLDS.IMMINENT_REENTRY_HOURS &&
      confidence.confidence_level !== 'low') {
      relevance.research_relevance = 'actionable';
  }

  // ---------------------------------------------
  // FINAL SAFETY OVERRIDES
  // ---------------------------------------------
  
  // Low confidence caps relevance at monitor
  if (confidence.confidence_level === 'low') {
      // Force downgrade if actionable
      if ((relevance.civilian_relevance as RelevanceLevel) === 'actionable') relevance.civilian_relevance = 'monitor';
      if ((relevance.satellite_operator_relevance as RelevanceLevel) === 'actionable') relevance.satellite_operator_relevance = 'monitor';
      if ((relevance.research_relevance as RelevanceLevel) === 'actionable') relevance.research_relevance = 'monitor';
  }

  return relevance;
}

// =============================================================================
// EXPLANATION GENERATION
// =============================================================================

function generateExplanation(
  debris: DebrisInput,
  relevance: RelevanceMatrix,
  confidence: ConfidenceModel,
  suppressed: boolean
): RiskExplanation {
  
  const burnUpLikely = debris.mass_kg < DEBRIS_THRESHOLDS.LARGE_OBJECT_MIN_KG;
  
  // Why this matters
  let why = `Tracking re-entry of object ${debris.name ?? debris.id} (${debris.mass_kg}kg).`;
  if (suppressed) why = 'Event suppressed due to low risk or long lead time.';
  else if (relevance.civilian_relevance !== 'none') why = `Large object re-entry expected shortly.`;

  // Why NOT dangerous
  let notDangerous = 'Most space debris burns up completely in the atmosphere.';
  if (!burnUpLikely) {
      notDangerous = `Object is large, but statistical risk to ground is extremely low. Most re-entries occur over oceans.`;
  }
  if (confidence.confidence_level === 'low') {
      notDangerous += ' High uncertainty means prediction is approximate.';
  }

  // Changes
  let change = 'Updated tracking data narrowing the impact window.';
  
  return {
      why_this_might_matter: why,
      why_probably_not_dangerous: notDangerous,
      what_would_change_assessment: change,
  };
}

function buildSummary(debris: DebrisInput, suppressed: boolean, relevance: RelevanceMatrix): string {
    if (suppressed) return `Debris ${debris.name}: Suppressed`;
    return `Debris ${debris.name}: Re-entry in ~${((new Date(debris.predicted_reentry_time).getTime() - Date.now())/36e5).toFixed(1)}h`;
}
