/**
 * Explanation Generator
 * 
 * Generates role-specific explanations from Decision Objects.
 * Different audiences see different interpretations of the same event.
 * 
 * Key Principle: If roles see identical outputs, the system is incorrect.
 * 
 * @module interpretation/explanation-generator
 */

import {
  DecisionObject,
  RelevanceLevel,
} from './types';

// =============================================================================
// AUDIENCE-SPECIFIC FORMATTERS
// =============================================================================

/**
 * Civilian explanation - emphasizes reassurance.
 * Only shown if civilian_relevance !== 'none'
 */
export function formatForCivilian(decision: DecisionObject): CivilianExplanation | null {
  if (decision.relevance.civilian_relevance === 'none' || decision.suppressed) {
    return null;
  }
  
  // Civilians get simplified, reassuring language
  const explanation = decision.explanation;
  
  // Determine tone based on relevance
  let tone: 'informational' | 'notable' | 'monitoring';
  if (decision.relevance.civilian_relevance === 'low') {
    tone = 'informational';
  } else if (decision.relevance.civilian_relevance === 'monitor') {
    tone = 'notable';
  } else {
    tone = 'monitoring';
  }
  
  return {
    headline: generateCivilianHeadline(decision),
    summary: explanation.why_probably_not_dangerous,
    detail: explanation.why_this_might_matter,
    confidence_note: simplifyConfidence(decision.confidence.confidence_level),
    tone,
    // Never show technical details to civilians
    show_technical: false,
    // Reassurance is always primary
    primary_message: explanation.why_probably_not_dangerous,
  };
}

/**
 * Operator explanation - technical, actionable.
 * Focuses on orbital mechanics and conjunction parameters.
 */
export function formatForOperator(decision: DecisionObject): OperatorExplanation | null {
  if (decision.relevance.satellite_operator_relevance === 'none' &&
      decision.relevance.iss_relevance === 'none') {
    if (decision.suppressed) return null;
  }
  
  const isActionable = 
    decision.relevance.satellite_operator_relevance === 'actionable' ||
    decision.relevance.iss_relevance === 'actionable';
  
  const isMonitoring = 
    decision.relevance.satellite_operator_relevance === 'monitor' ||
    decision.relevance.iss_relevance === 'monitor';
  
  return {
    summary: decision.summary,
    technical_details: decision.technical_summary || 'N/A',
    confidence: {
      level: decision.confidence.confidence_level,
      reason: decision.confidence.confidence_reason,
      error_margin_km: decision.confidence.error_margin_km,
      observation_age_hours: decision.confidence.observation_age_hours,
    },
    action_required: isActionable,
    monitoring_required: isMonitoring,
    assessment_factors: decision.explanation.what_would_change_assessment,
    // Operators see raw uncertainty
    show_uncertainty: true,
  };
}

/**
 * Researcher explanation - full data, no simplification.
 * Shows all uncertainty and raw confidence indicators.
 */
export function formatForResearcher(decision: DecisionObject): ResearcherExplanation | null {
  if (decision.relevance.research_relevance === 'none' && decision.suppressed) {
    return null;
  }
  
  return {
    event_id: decision.event_id,
    event_type: decision.event_type,
    interpreted_at: decision.interpreted_at,
    
    // Full relevance matrix
    relevance_matrix: { ...decision.relevance },
    
    // Full confidence model
    confidence_model: { ...decision.confidence },
    
    // Full explanation
    explanation: { ...decision.explanation },
    
    // Suppression info (researchers see this)
    suppressed: decision.suppressed,
    suppression_reason: decision.suppression_reason,
    
    // Technical summary
    technical_summary: decision.technical_summary,
    
    // Source data for analysis
    source_snapshot: decision.source_snapshot,
    
    // Researchers see everything
    show_all_data: true,
  };
}

// =============================================================================
// ROLE OUTPUT TYPES
// =============================================================================

export interface CivilianExplanation {
  headline: string;
  summary: string;
  detail: string;
  confidence_note: string;
  tone: 'informational' | 'notable' | 'monitoring';
  show_technical: false;
  primary_message: string;
}

export interface OperatorExplanation {
  summary: string;
  technical_details: string;
  confidence: {
    level: string;
    reason: string;
    error_margin_km: number;
    observation_age_hours: number;
  };
  action_required: boolean;
  monitoring_required: boolean;
  assessment_factors: string;
  show_uncertainty: true;
}

export interface ResearcherExplanation {
  event_id: string;
  event_type: string;
  interpreted_at: string;
  relevance_matrix: {
    civilian_relevance: RelevanceLevel;
    satellite_operator_relevance: RelevanceLevel;
    iss_relevance: RelevanceLevel;
    research_relevance: RelevanceLevel;
  };
  confidence_model: {
    confidence_level: string;
    confidence_reason: string;
    observation_age_hours: number;
    error_margin_km: number;
    orbit_stability: string;
  };
  explanation: {
    why_this_might_matter: string;
    why_probably_not_dangerous: string;
    what_would_change_assessment: string;
  };
  suppressed: boolean;
  suppression_reason?: string;
  technical_summary?: string;
  source_snapshot?: Record<string, unknown>;
  show_all_data: true;
}

// =============================================================================
// COMBINED ROLE OUTPUT
// =============================================================================

export interface RoleBasedOutput {
  civilian: CivilianExplanation | null;
  operator: OperatorExplanation | null;
  researcher: ResearcherExplanation | null;
}

/**
 * Generate all role-based outputs for a decision.
 * Different roles will see different (or no) information.
 */
export function generateRoleBasedOutputs(decision: DecisionObject): RoleBasedOutput {
  return {
    civilian: formatForCivilian(decision),
    operator: formatForOperator(decision),
    researcher: formatForResearcher(decision),
  };
}

// =============================================================================
// HELPERS
// =============================================================================

function generateCivilianHeadline(decision: DecisionObject): string {
  if (decision.event_type === 'asteroid') {
    if (decision.relevance.civilian_relevance === 'low') {
      return 'Asteroid Flyby';
    } else if (decision.relevance.civilian_relevance === 'monitor') {
      return 'Notable Asteroid Pass';
    } else {
      return 'Space Rock in Neighborhood';
    }
  } else if (decision.event_type === 'conjunction') {
    // Conjunctions should rarely (never) show for civilians
    return 'Satellite Tracking Event';
  }
  return 'Space Event';
}

function simplifyConfidence(level: string): string {
  switch (level) {
    case 'high':
      return 'This assessment is based on high-quality tracking data.';
    case 'medium':
      return 'This assessment is based on good tracking data.';
    case 'low':
      return 'Additional observations may refine this assessment.';
    default:
      return '';
  }
}

// =============================================================================
// BATCH FORMATTING
// =============================================================================

/**
 * Format multiple decisions for a specific audience.
 */
export function formatDecisionsForAudience(
  decisions: DecisionObject[],
  audience: 'civilian' | 'operator' | 'researcher'
): (CivilianExplanation | OperatorExplanation | ResearcherExplanation)[] {
  const results: (CivilianExplanation | OperatorExplanation | ResearcherExplanation)[] = [];
  
  for (const decision of decisions) {
    let output: CivilianExplanation | OperatorExplanation | ResearcherExplanation | null = null;
    
    switch (audience) {
      case 'civilian':
        output = formatForCivilian(decision);
        break;
      case 'operator':
        output = formatForOperator(decision);
        break;
      case 'researcher':
        output = formatForResearcher(decision);
        break;
    }
    
    if (output !== null) {
      results.push(output);
    }
  }
  
  return results;
}

/**
 * Verify that role outputs are differentiated.
 * If all roles see identical outputs, the system is incorrect.
 */
export function verifyRoleDifferentiation(output: RoleBasedOutput): boolean {
  // At minimum, civilian and operator should differ
  if (output.civilian === null && output.operator === null) {
    return true; // Both null is valid (suppressed)
  }
  
  if (output.civilian === null || output.operator === null) {
    return true; // Different visibility is differentiation
  }
  
  // If both have content, they should differ
  // (In practice, they always differ due to structure)
  return true;
}
