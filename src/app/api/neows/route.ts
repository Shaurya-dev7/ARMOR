/**
 * NASA NeoWs API Route
 * 
 * Server-side endpoint that fetches and normalizes NeoWs data.
 * API key is never exposed to the client.
 */

import { NextResponse } from 'next/server';
import { fetchWeekAsteroids } from '@/lib/neows/client';
import { normalizeNeoWsFeed, validateNormalizedData } from '@/lib/neows/normalize';
import type { NeoWsError, NormalizedNeoWsData } from '@/lib/neows/types';

// Cache control: allow caching for 1 hour (data updates are not real-time critical)
const CACHE_MAX_AGE = 3600;

export async function GET() {
  try {
    // Fetch raw data from NASA NeoWs
    const rawData = await fetchWeekAsteroids();
    
    // Normalize according to strict extraction rules
    const normalizedData = normalizeNeoWsFeed(rawData);
    
    // Validate the normalized data
    const isValid = validateNormalizedData(normalizedData);
    if (!isValid) {
      console.warn('[NeoWs API] Normalized data validation failed, returning anyway');
    }
    
    // Return clean JSON with cache headers
    return NextResponse.json<NormalizedNeoWsData>(normalizedData, {
      status: 200,
      headers: {
        'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_MAX_AGE}`,
        'X-Data-Source': 'NASA NeoWs',
        'X-Fetched-At': new Date().toISOString(),
      },
    });
    
  } catch (err) {
    // Handle typed NeoWs errors
    if (typeof err === 'object' && err !== null && 'code' in err) {
      const neoWsError = err as NeoWsError;
      
      switch (neoWsError.code) {
        case 'API_KEY_MISSING':
          return NextResponse.json(
            { error: 'Server configuration error. NASA API key not set.' },
            { status: 500 }
          );
          
        case 'API_KEY_INVALID':
          return NextResponse.json(
            { error: 'NASA API key is invalid.' },
            { status: 500 }
          );
          
        case 'RATE_LIMITED':
          return NextResponse.json(
            { error: 'NASA API rate limit exceeded. Please try again later.' },
            { status: 429 }
          );
          
        case 'NETWORK_ERROR':
          return NextResponse.json(
            { error: 'Unable to reach NASA servers. Please try again.' },
            { status: 503 }
          );
          
        default:
          return NextResponse.json(
            { error: 'An unexpected error occurred.' },
            { status: 500 }
          );
      }
    }
    
    // Generic error handling
    console.error('[NeoWs API] Unexpected error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
