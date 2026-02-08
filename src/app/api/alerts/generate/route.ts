import { NextRequest, NextResponse } from 'next/server';
import {
  generateGeminiAlert,
  SUPPORTED_LANGUAGES,
} from '@/lib/interpretation/gemini-alert-generator';
import type { PublicAlertData } from '@/lib/interpretation/public-alert-generator';

/**
 * POST /api/alerts/generate
 * 
 * Generates a public-facing asteroid alert message.
 * Supports multiple languages via Gemini API.
 * 
 * Request body:
 * {
 *   "asteroid_name": "2026 AB12",
 *   "distance_au": 0.02,
 *   "diameter_meters": 150,
 *   "velocity_km_s": 15.5,
 *   "language": "English"
 * }
 * 
 * Response:
 * {
 *   "alert_level": "LEVEL 2",
 *   "language": "English",
 *   "message": "..."
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['asteroid_name', 'distance_au', 'diameter_meters', 'velocity_km_s'];
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Build alert data
    const alertData: PublicAlertData = {
      asteroid_name: body.asteroid_name,
      distance_au: Number(body.distance_au),
      diameter_meters: Number(body.diameter_meters),
      velocity_km_s: Number(body.velocity_km_s),
      risk_score: body.risk_score ? Number(body.risk_score) : undefined,
      pei_value: body.pei_value ? Number(body.pei_value) : undefined,
      is_sentry_monitored: body.is_sentry_monitored ?? false,
      is_potentially_hazardous: body.is_potentially_hazardous ?? false,
    };

    // Validate language
    const language = body.language || 'English';

    // Generate alert
    const alert = await generateGeminiAlert(alertData, language);

    return NextResponse.json(alert);

  } catch (error) {
    console.error('[API /alerts/generate] Error:', error);
    
    return NextResponse.json(
      { error: 'Failed to generate alert' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/alerts/generate
 * 
 * Returns supported languages and API info.
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/alerts/generate',
    method: 'POST',
    description: 'Generate a public-facing asteroid alert message',
    supported_languages: SUPPORTED_LANGUAGES,
    required_fields: [
      'asteroid_name',
      'distance_au',
      'diameter_meters',
      'velocity_km_s',
    ],
    optional_fields: [
      'language',
      'risk_score',
      'pei_value',
      'is_sentry_monitored',
      'is_potentially_hazardous',
    ],
  });
}
