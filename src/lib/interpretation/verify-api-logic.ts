
import { interpret } from './main';
import { InterpretationRequest, DebrisInput } from './types';

// Mock Request
const debris: DebrisInput = {
    id: 'api-test-debris',
    mass_kg: 5000,
    predicted_reentry_time: new Date(Date.now() + 3600*1000).toISOString(),
    uncertainty_minutes: 10,
    data_age_hours: 1
};

const request: InterpretationRequest = {
    context: {
        current_time: new Date().toISOString(),
        prediction_horizon_hours: 24,
        data_age_hours: 1
    },
    asteroids: [],
    conjunctions: [],
    debris: [debris]
};

console.log('TEST: API Logic Logic (Debris Integration)');

try {
    const response = interpret(request);
    console.log('Executed interpret() successfully.');
    
    // Check results
    if (response.decisions.length !== 1) {
        throw new Error(`Expected 1 decision, got ${response.decisions.length}`);
    }
    
    const decision = response.decisions[0];
    if (decision.event_type !== 'debris') {
        throw new Error(`Expected event_type 'debris', got '${decision.event_type}'`);
    }
    
    if (decision.relevance.civilian_relevance !== 'monitor') {
        // Based on logic: >2000kg, <2h, High Conf -> Monitor
        throw new Error(`Expected civilian 'monitor', got '${decision.relevance.civilian_relevance}'`);
    }

    console.log('✅ PASS: Debris correctly processed through main orchestrator.');

} catch (e: any) {
    console.error('❌ FAIL:', e.message);
    process.exit(1);
}
