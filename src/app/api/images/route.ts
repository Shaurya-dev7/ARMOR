/**
 * NASA Image Search API Route
 * 
 * Searches NASA's image library for space-related visuals.
 * GET /api/images?q=asteroid&limit=5
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchNasaImages, getAsteroidImage } from '@/lib/nasa-images';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const asteroidName = searchParams.get('asteroid');
  const limit = parseInt(searchParams.get('limit') || '5', 10);

  try {
    // If specific asteroid name provided, get targeted image
    if (asteroidName) {
      const imageUrl = await getAsteroidImage(asteroidName);
      return NextResponse.json({ 
        image_url: imageUrl,
        source: 'NASA Image Library'
      });
    }

    // General search
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" or "asteroid" is required' },
        { status: 400 }
      );
    }

    const results = await searchNasaImages({ query, limit });

    return NextResponse.json({
      results,
      count: results.length,
      query,
    });

  } catch (error) {
    console.error('Image API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
}
