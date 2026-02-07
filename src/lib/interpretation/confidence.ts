/**
 * Confidence Logic
 * 
 * Determines how much we trust the data.
 * Low confidence events are penalized in relevance scoring.
 */

import { AsteroidInput, ConfidenceLevel, ConfidenceModel } from './types';

/**
 * Calculate confidence for an asteroid observation.
 */
export function calculateConfidence(asteroid: AsteroidInput): ConfidenceModel {
  const factors: string[] = [];
  let score = 3; // Start at max confidence (3 = High, 2 = Medium, 1 = Low)

  // 1. Observation Arc (Age of data)
  // If we don't have age, assume fresh for now (or penalize if strict mode)
  if (asteroid.observation_age_hours) {
    if (asteroid.observation_age_hours > 48) {
      score -= 1;
      factors.push('Data > 48h old');
    }
    if (asteroid.observation_age_hours > 168) { // 7 days
      score -= 1;
      factors.push('Data > 7 days old');
    }
  }

  // 2. Orbital Uncertainty (MPC "U" Parameter 0-9, where 0 is best)
  if (asteroid.orbital_uncertainty !== undefined) {
    if (asteroid.orbital_uncertainty > 5) {
      score -= 1;
      factors.push('High orbital uncertainty');
    }
    if (asteroid.orbital_uncertainty > 7) {
      score -= 1;
      factors.push('Very high orbital uncertainty');
    }
  }

  // 3. Number of Observations (if available in future)
  // (Placeholder)

  // Clamp score
  const finalScore = Math.max(1, Math.min(3, score));
  
  let level: ConfidenceLevel = 'high';
  if (finalScore === 2) level = 'medium';
  if (finalScore === 1) level = 'low';

  return {
    confidence_level: level,
    confidence_reason: factors.length > 0 ? factors.join(', ') : 'High quality orbit data',
    observation_age_hours: asteroid.observation_age_hours || 0,
    error_margin_km: 0, // Placeholder
    orbit_stability: 'stable', // Placeholder
  };
}
