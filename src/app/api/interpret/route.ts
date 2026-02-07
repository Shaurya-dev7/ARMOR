/**
 * Risk Interpretation API
 * 
 * POST /api/interpret
 * 
 * This endpoint runs the interpretation layer on space events.
 * Returns Decision Objects with relevance, confidence, and explanations.
 * 
 * Most events should be suppressed. This is correct behavior.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  interpret,
  filterForAudience,
  getInterpretationStats,
  formatDecisionsForAudience,
  InterpretationRequest,
} from '@/lib/interpretation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request
    if (!body.context) {
      return NextResponse.json(
        { error: 'Missing required field: context' },
        { status: 400 }
      );
    }
    
    // Build interpretation request
    const interpretationRequest: InterpretationRequest = {
      asteroids: body.asteroids || [],
      conjunctions: body.conjunctions || [],
      debris: body.debris || [],
      context: {
        current_time: body.context.current_time || new Date().toISOString(),
        prediction_horizon_hours: body.context.prediction_horizon_hours || 168,
        data_age_hours: body.context.data_age_hours || 1,
        dry_run: body.context.dry_run || false,
      },
      requesting_audience: body.audience || 'all',
    };
    
    // Run interpretation
    const response = interpret(interpretationRequest);
    
    // Get health stats
    const stats = getInterpretationStats(response.decisions);
    
    // Filter for audience if specified
    let decisions = response.decisions;
    let formattedOutput = null;
    
    if (body.audience && body.audience !== 'all') {
      decisions = filterForAudience(response.decisions, body.audience);
      formattedOutput = formatDecisionsForAudience(decisions, body.audience);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        decisions: body.audience === 'all' ? decisions : undefined,
        formatted: formattedOutput,
        total_events: response.decisions.length,
        suppressed_count: response.suppressed_count,
        relevant_count: response.relevant_count,
        stats,
      },
      interpreted_at: response.interpreted_at,
      processing_time_ms: response.processing_time_ms,
    });
    
  } catch (error) {
    console.error('[Interpret API Error]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/interpret
 * 
 * Returns API documentation.
 */
export async function GET() {
  return NextResponse.json({
    name: 'Risk Interpretation API',
    description: 'Interprets space events with a meaning-first, suppression-default approach.',
    endpoints: {
      'POST /api/interpret': {
        description: 'Interpret asteroid and conjunction events',
        body: {
          asteroids: 'Array of AsteroidInput objects (optional)',
          conjunctions: 'Array of ConjunctionInput objects (optional)',
          debris: 'Array of DebrisInput objects (optional)',
          context: {
            current_time: 'ISO timestamp (optional, defaults to now)',
            prediction_horizon_hours: 'Number (optional, defaults to 168)',
            data_age_hours: 'Number (optional, defaults to 1)',
          },
          audience: 'civilian | operator | researcher | all (optional, defaults to all)',
        },
        response: {
          decisions: 'Array of DecisionObject (when audience=all)',
          formatted: 'Role-formatted output (when specific audience)',
          stats: 'Interpretation health statistics',
        },
      },
    },
    principles: [
      'Most events should result in suppression (no alert)',
      'Silence is a valid and often correct outcome',
      'Different audiences see different interpretations',
      'Uncertainty lowers visibility, not increases it',
    ],
    health_check: {
      healthy: 'suppression_rate >= 80%, civilian_rate <= 10%',
      warning: 'suppression_rate >= 50%, civilian_rate <= 25%',
      failing: 'Too many alerts reaching users',
    },
  });
}
