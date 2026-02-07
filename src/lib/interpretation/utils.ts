/**
 * Interpretation Utilities
 * 
 * Helper functions for processing and filtering decision objects.
 */

import { DecisionObject } from './types';

export interface InterpretationStats {
  total_events: number;
  suppressed_events: number;
  civilian_relevant: number;
  operator_relevant: number;
  iss_relevant: number;
}

/**
 * Get statistics for a batch of decisions.
 */
export function getInterpretationStats(decisions: DecisionObject[]): InterpretationStats {
  return {
    total_events: decisions.length,
    suppressed_events: decisions.filter(d => d.suppressed).length,
    civilian_relevant: decisions.filter(d => d.relevance.civilian_relevance !== 'none').length,
    operator_relevant: decisions.filter(d => d.relevance.satellite_operator_relevance !== 'none').length,
    iss_relevant: decisions.filter(d => d.relevance.iss_relevance !== 'none').length,
  };
}

/**
 * Filter decisions for a specific audience.
 * Automatically excludes suppressed events.
 */
export function filterForAudience(
  decisions: DecisionObject[], 
  audience: 'civilian' | 'operator' | 'researcher' | 'all'
): DecisionObject[] {
  if (audience === 'all') return decisions;

  return decisions.filter(d => {
    if (d.suppressed) return false;
    
    switch (audience) {
      case 'civilian': return d.relevance.civilian_relevance !== 'none';
      case 'operator': return d.relevance.satellite_operator_relevance !== 'none';
      case 'researcher': return d.relevance.research_relevance !== 'none';
      default: return false;
    }
  });
}




