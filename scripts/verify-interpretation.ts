/**
 * Manual Verification Script for Risk Interpretation Layer
 * 
 * Run with: npx tsx scripts/verify-interpretation.ts
 */

import { interpretAsteroid } from '../src/lib/interpretation/asteroid-interpreter';
import { interpretConjunction } from '../src/lib/interpretation/conjunction-interpreter';
import { AsteroidInput, ConjunctionInput, SystemContext } from '../src/lib/interpretation/types';

// Chalk-like coloring helper
const green = (text: string) => `\x1b[32m${text}\x1b[0m`;
const red = (text: string) => `\x1b[31m${text}\x1b[0m`;
const bold = (text: string) => `\x1b[1m${text}\x1b[0m`;

console.log(bold('\n=== Risk Interpretation Layer Verification ===\n'));

const context: SystemContext = {
  current_time: new Date().toISOString(),
  prediction_horizon_hours: 168,
  data_age_hours: 1,
};

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string) {
  if (condition) {
    console.log(`${green('✓')} ${name}`);
    passed++;
  } else {
    console.log(`${red('✗')} ${name}`);
    failed++;
  }
}

// TEST 1: ROUTINE ASTEROID (Should be Suppressed)
const routineAsteroid: AsteroidInput = {
  object_id: '123',
  name: 'Routine Rock',
  diameter_min_km: 0.01,
  diameter_max_km: 0.02,
  velocity_km_s: 15,
  miss_distance_km: 5000000, // 5M km
  approach_time: new Date(Date.now() + 86400000).toISOString(),
  potentially_hazardous_flag: false,
};

const routineDecision = interpretAsteroid(routineAsteroid, context);
assert(routineDecision.suppressed === true, 'Routine asteroid is suppressed');
assert(routineDecision.relevance.civilian_relevance === 'none', 'Routine asteroid has no civilian relevance');

// TEST 2: SENTRY ASTEROID (Should have Research Relevance)
const sentryAsteroid: AsteroidInput = {
  object_id: '999',
  name: 'Scary Rock',
  diameter_min_km: 0.3,
  diameter_max_km: 0.4,
  velocity_km_s: 20,
  miss_distance_km: 100000, // 100k km
  approach_time: new Date(Date.now() + 86400000 * 5).toISOString(),
  potentially_hazardous_flag: true,
  sentry_flag: true,
};

const sentryDecision = interpretAsteroid(sentryAsteroid, context);
assert(sentryDecision.suppressed === false, 'Sentry asteroid is NOT suppressed');
assert(sentryDecision.relevance.research_relevance !== 'none', 'Sentry asteroid has research relevance');

// TEST 3: ISS CONJUNCTION (Role Logic)
const issConjunction: ConjunctionInput = {
  primary_object: { norad_id: 25544, name: 'ISS', object_type: 'iss', orbit_regime: 'LEO' },
  secondary_object: { norad_id: 12345, name: 'DEBRIS', object_type: 'debris' },
  tca: new Date(Date.now() + 3600000 * 24).toISOString(),
  miss_distance_km: 10,
  relative_velocity_km_s: 10,
  lead_time_hours: 24,
  maneuver_possible: true,
};

const issDecision = interpretConjunction(issConjunction, context);
assert(issDecision.relevance.iss_relevance !== 'none', 'ISS event relevant to ISS');
assert(issDecision.relevance.civilian_relevance === 'none', 'ISS event suppressed for civilians');

// SUMMARY
console.log('\n==============================================');
if (failed === 0) {
  console.log(green(`${passed} tests passed. System functioning correctly.`));
} else {
  console.log(red(`${failed} tests failed.`));
  process.exit(1);
}
