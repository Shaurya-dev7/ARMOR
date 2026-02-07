import { 
  InterpretationRequest, 
  InterpretationResponse,
  DecisionObject,
  SystemContext
} from './types';
import { interpretAsteroid } from './asteroid-interpreter';
import { interpretConjunction } from './conjunction-interpreter';
import { interpretDebris } from './debris-interpreter';

/**
 * Main Interpretation Orchestrator
 * 
 * Processes a mixed batch of space events and returns decision objects.
 */
export function interpret(request: InterpretationRequest): InterpretationResponse {
  const decisions: DecisionObject[] = [];
  const start = performance.now();
  const context = request.context;

  // 1. Process Asteroids
  if (request.asteroids) {
    for (const asteroid of request.asteroids) {
      try {
        decisions.push(interpretAsteroid(asteroid, context));
      } catch (e) {
        console.error(`Failed to interpret asteroid ${asteroid.object_id}`, e);
      }
    }
  }

  // 2. Process Conjunctions
  if (request.conjunctions) {
    for (const conjunction of request.conjunctions) {
      try {
        decisions.push(interpretConjunction(conjunction, context));
      } catch (e) {
        console.error(`Failed to interpret conjunction ${conjunction.primary_object.name}-${conjunction.secondary_object.name}`, e);
      }
    }
  }

  // 3. Process Debris (New!)
  if (request.debris) {
    for (const debrisItem of request.debris) {
      try {
        decisions.push(interpretDebris(debrisItem, context));
      } catch (e) {
        console.error(`Failed to interpret debris ${debrisItem.id}`, e);
      }
    }
  }

  const end = performance.now();

  return {
    decisions,
    suppressed_count: decisions.filter(d => d.suppressed).length,
    relevant_count: decisions.filter(d => !d.suppressed).length, // technically relevant usually means checks specific audience, but here simple count
    interpreted_at: new Date().toISOString(),
    processing_time_ms: end - start,
  };
}
