/**
 * Horizons Ephemeris API Route
 * 
 * Server-side endpoint for fetching precision ephemeris from JPL Horizons.
 * This keeps Horizons queries server-side and enables caching.
 * 
 * Query Parameters:
 * - target: Target body ID (e.g., '399' for Earth, asteroid SPK-ID)
 * - center: Reference center (default: '@0' for SSB)
 * - start: Start time (ISO format)
 * - stop: Stop time (ISO format)
 * - step: Step size (default: '1d')
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchHorizonsEphemeris, type HorizonsError } from '@/lib/horizons';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const target = searchParams.get('target');
  const center = searchParams.get('center') || '@0';
  const start = searchParams.get('start');
  const stop = searchParams.get('stop');
  const step = searchParams.get('step') || '1d';
  
  // Validate required parameters
  if (!target) {
    return NextResponse.json(
      { error: 'Missing required parameter: target' },
      { status: 400 }
    );
  }
  
  if (!start || !stop) {
    return NextResponse.json(
      { error: 'Missing required parameters: start and stop times' },
      { status: 400 }
    );
  }
  
  try {
    const data = await fetchHorizonsEphemeris({
      command: target,
      center,
      startTime: start,
      stopTime: stop,
      stepSize: step,
    });
    
    // Add cache headers - cache by query params for 1 hour
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
    
  } catch (err) {
    // Handle HorizonsError
    if (typeof err === 'object' && err !== null && 'code' in err) {
      const horizonsError = err as HorizonsError;
      console.error('[Horizons API]', horizonsError.code, horizonsError.message);
      
      return NextResponse.json(
        { 
          error: horizonsError.message,
          code: horizonsError.code,
        },
        { status: 500 }
      );
    }
    
    // Generic error
    console.error('[Horizons API] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
