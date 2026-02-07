
import { interpretDebris } from './debris-interpreter';
import { DebrisInput, SystemContext } from './types';

// Mock Context
const context: SystemContext = {
    current_time: new Date().toISOString(),
    prediction_horizon_hours: 24,
    data_age_hours: 0,
};

function runTest(name: string, debris: DebrisInput, expectations: (result: any) => void) {
    console.log(`\nTEST: ${name}`);
    try {
        const result = interpretDebris(debris, context);
        expectations(result);
        console.log('✅ PASS');
    } catch (e: any) {
        console.error('❌ FAIL:', e.message);
        console.error(e); // Print full error for debugging
    }
}

// 1. Small Debris (<10kg) -> Suppressed
runTest('Small Debris (<10kg)', {
    id: 'test-1',
    mass_kg: 5,
    predicted_reentry_time: new Date(Date.now() + 3600*1000).toISOString(), // 1h
    uncertainty_minutes: 10,
    data_age_hours: 1
}, (result) => {
    if (!result.suppressed) throw new Error('Expected suppression');
});

// 2. Large Rocket (>20t), 1h -> Civilian: monitor
runTest('Large Rocket (>20t), 1h, High Conf', {
    id: 'test-2',
    mass_kg: 22000,
    predicted_reentry_time: new Date(Date.now() + 3600*1000).toISOString(), // 1h
    uncertainty_minutes: 10,
    data_age_hours: 1
}, (result) => {
    if (result.suppressed) throw new Error('Expected NOT suppressed');
    if (result.relevance.civilian_relevance !== 'monitor') 
        throw new Error(`Expected civilian 'monitor', got '${result.relevance.civilian_relevance}'`);
    if (result.confidence.confidence_level !== 'high')
        throw new Error(`Expected confidence 'high', got '${result.confidence.confidence_level}'`);
});

// 3. Same + Low Confidence -> Civilian: none/monitor?
// Logic says: escalate to monitor ONLY IF confidence != low.
// So this should be 'none'.
runTest('Large Rocket, 1h, Low Conf (High Uncertainty)', {
    id: 'test-3',
    mass_kg: 22000,
    predicted_reentry_time: new Date(Date.now() + 3600*1000).toISOString(), // 1h
    uncertainty_minutes: 200, // > 180 -> low
    data_age_hours: 1
}, (result) => {
    if (result.confidence.confidence_level !== 'low')
        throw new Error(`Expected confidence 'low', got '${result.confidence.confidence_level}'`);
    
    // Strict logic check: Logic says "escalate to monitor only if confidence != low"
    // So here it should be 'none'.
    if (result.relevance.civilian_relevance !== 'none')
        throw new Error(`Expected civilian 'none' (due to low conf), got '${result.relevance.civilian_relevance}'`);
});

// 4. Controlled Re-entry -> Suppressed
runTest('Controlled Re-entry', {
    id: 'test-4',
    mass_kg: 22000,
    predicted_reentry_time: new Date(Date.now() + 3600*1000).toISOString(), 
    uncertainty_minutes: 10,
    data_age_hours: 1,
    is_controlled_reentry: true
}, (result) => {
    if (!result.suppressed) throw new Error('Expected suppression for controlled re-entry');
});

// 5. Far Future (>7d) -> Suppressed
runTest('Far Future (>7d)', {
    id: 'test-5',
    mass_kg: 22000,
    predicted_reentry_time: new Date(Date.now() + 8 * 24 * 3600 * 1000).toISOString(), // 8 days
    uncertainty_minutes: 10,
    data_age_hours: 1
}, (result) => {
    if (!result.suppressed) throw new Error('Expected suppression for >7d');
});

// 6. High Uncertainty -> Confidence Low
runTest('High Uncertainty', {
    id: 'test-6',
    mass_kg: 500,
    predicted_reentry_time: new Date(Date.now() + 3600*1000).toISOString(),
    uncertainty_minutes: 181, // > 180
    data_age_hours: 1
}, (result) => {
    if (result.confidence.confidence_level !== 'low')
        throw new Error(`Expected confidence 'low', got '${result.confidence.confidence_level}'`);
});
