/**
 * Risk Scoring Module
 * 
 * Calculates risk scores (0-100) for asteroids based on:
 * - Size (diameter)
 * - Velocity
 * - Miss distance from Earth
 * - Hazardous flag
 */

export type Severity = 'info' | 'warning' | 'alert' | 'critical';

export interface RiskAssessment {
  score: number;           // 0-100
  severity: Severity;
  factors: {
    size: number;          // 0-30
    velocity: number;      // 0-30
    distance: number;      // 0-40
  };
  label: string;
  color: string;
}

// Thresholds for normalization
const THRESHOLDS = {
  // Size in km
  size: {
    min: 0.01,    // 10m - small
    max: 1.0,     // 1km - extinction-level
  },
  // Velocity in km/h
  velocity: {
    min: 10000,   // ~3 km/s - slow
    max: 150000,  // ~42 km/s - very fast
  },
  // Miss distance in km
  distance: {
    min: 10000,        // 10,000 km - extremely close (below LEO)
    max: 50000000,     // 50M km - far (about 1/3 AU)
  },
};

/**
 * Normalize value to 0-1 range
 */
function normalize(value: number, min: number, max: number, inverse: boolean = false): number {
  const clamped = Math.max(min, Math.min(max, value));
  const normalized = (clamped - min) / (max - min);
  return inverse ? 1 - normalized : normalized;
}

/**
 * Map score to severity level
 */
function getSeverity(score: number): Severity {
  if (score >= 76) return 'critical';
  if (score >= 51) return 'alert';
  if (score >= 26) return 'warning';
  return 'info';
}

/**
 * Get color for severity
 */
function getSeverityColor(severity: Severity): string {
  const colors: Record<Severity, string> = {
    info: '#3b82f6',      // blue
    warning: '#eab308',   // yellow
    alert: '#f97316',     // orange
    critical: '#ef4444',  // red
  };
  return colors[severity];
}

/**
 * Get human-readable label for severity
 */
function getSeverityLabel(severity: Severity): string {
  const labels: Record<Severity, string> = {
    info: 'Safe Passage',
    warning: 'Monitoring',
    alert: 'Close Approach',
    critical: 'High Priority',
  };
  return labels[severity];
}

/**
 * Calculate risk score for an asteroid
 */
export function calculateRiskScore(asteroid: {
  size_km: number;
  velocity_kph: number;
  miss_distance_km: number;
  is_potentially_hazardous?: boolean;
}): RiskAssessment {
  // Calculate individual factors
  const sizeFactor = normalize(
    asteroid.size_km,
    THRESHOLDS.size.min,
    THRESHOLDS.size.max
  ) * 30;

  const velocityFactor = normalize(
    asteroid.velocity_kph,
    THRESHOLDS.velocity.min,
    THRESHOLDS.velocity.max
  ) * 30;

  const distanceFactor = normalize(
    asteroid.miss_distance_km,
    THRESHOLDS.distance.min,
    THRESHOLDS.distance.max,
    true  // Inverse: closer = higher risk
  ) * 40;

  // Base score
  let score = sizeFactor + velocityFactor + distanceFactor;

  // Boost score if flagged as hazardous
  if (asteroid.is_potentially_hazardous) {
    score = Math.min(100, score * 1.2);
  }

  // Round to integer
  score = Math.round(score);

  const severity = getSeverity(score);

  return {
    score,
    severity,
    factors: {
      size: Math.round(sizeFactor),
      velocity: Math.round(velocityFactor),
      distance: Math.round(distanceFactor),
    },
    label: getSeverityLabel(severity),
    color: getSeverityColor(severity),
  };
}

/**
 * Batch calculate risk scores
 */
export function calculateBatchRiskScores(asteroids: Array<{
  id: string;
  size_km: number;
  velocity_kph: number;
  miss_distance_km: number;
  is_potentially_hazardous?: boolean;
}>): Map<string, RiskAssessment> {
  const results = new Map<string, RiskAssessment>();
  
  for (const asteroid of asteroids) {
    results.set(asteroid.id, calculateRiskScore(asteroid));
  }
  
  return results;
}

/**
 * Decision-based Risk Assessment
 * Maps the Interpretation Layer's DecisionObject to a UI-compatible RiskAssessment.
 * 
 * This ensures that the UI reflects the "meaning-first" interpretation:
 * - Suppressed events -> Score 0, Info severity
 * - Low relevance -> Score < 30, Info severity
 * - Monitor relevance -> Score 30-70, Warning severity
 * - Actionable relevance -> Score > 70, Alert/Critical severity
 */
export function assessRiskFromDecision(decision: import('../interpretation/types').DecisionObject): RiskAssessment {
  // 1. SUPPRESSED EVENTS
  if (decision.suppressed) {
    return {
      score: 0,
      severity: 'info',
      factors: { size: 0, velocity: 0, distance: 0 },
      label: 'Routine',
      color: '#94a3b8', // slate-400 (gray)
    };
  }

  // 2. DETERMINE BASE SEVERITY FROM RELEVANCE
  // We prioritize civilian relevance for the public dashboard
  const relevance = decision.relevance.civilian_relevance;
  let baseScore = 0;
  let severity: Severity = 'info';

  if (relevance === 'actionable') {
    baseScore = 80;
    severity = 'alert';
  } else if (relevance === 'monitor') {
    baseScore = 50;
    severity = 'warning';
  } else if (relevance === 'low') {
    baseScore = 20;
    severity = 'info';
  } else {
    // If no civilian relevance but relevant to others (e.g. research), show as info
    baseScore = 10;
    severity = 'info';
  }

  // 3. ADJUST BY CONFIDENCE
  // Low confidence penalizes the score
  if (decision.confidence.confidence_level === 'low') {
    baseScore *= 0.5; // Halve the score
  } else if (decision.confidence.confidence_level === 'medium') {
    baseScore *= 0.8; // Slight reduction
  }
  // High confidence keeps raw score

  // 4. GENERATE OUTPUT
  const score = Math.round(baseScore);
  
  return {
    score,
    severity: getSeverity(score), // Map final score to severity
    factors: {
      // We don't break down factors for decision-based risks as they are holistic
      size: 0, 
      velocity: 0, 
      distance: 0 
    },
    label: decision.explanation.why_probably_not_dangerous, // Use explanation as label if safe
    color: getSeverityColor(getSeverity(score)),
  };
}
