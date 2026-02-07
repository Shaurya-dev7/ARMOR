/**
 * NASA Image & Video Library API Client
 * 
 * Fetches real asteroid images and space visuals from NASA's public media library.
 * Reference: https://images.nasa.gov/docs/images.nasa.gov_api_docs.pdf
 */

const NASA_IMAGES_BASE_URL = 'https://images-api.nasa.gov';

export interface NasaImageResult {
  nasa_id: string;
  title: string;
  description: string;
  href: string;
  thumb_url: string;
  preview_url: string;
  date_created: string;
  media_type: string;
}

export interface ImageSearchOptions {
  query: string;
  mediaType?: 'image' | 'video' | 'audio';
  limit?: number;
}

/**
 * Search NASA Image Library for asteroid/space images
 */
export async function searchNasaImages(options: ImageSearchOptions): Promise<NasaImageResult[]> {
  const { query, mediaType = 'image', limit = 5 } = options;
  
  const params = new URLSearchParams({
    q: query,
    media_type: mediaType,
  });

  try {
    const response = await fetch(`${NASA_IMAGES_BASE_URL}/search?${params}`);
    
    if (!response.ok) {
      console.error(`NASA Images API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const items = data.collection?.items || [];
    
    return items.slice(0, limit).map((item: any) => {
      const metadata = item.data?.[0] || {};
      const links = item.links || [];
      const thumbLink = links.find((l: any) => l.rel === 'preview');
      
      return {
        nasa_id: metadata.nasa_id || '',
        title: metadata.title || '',
        description: metadata.description || '',
        href: item.href || '',
        thumb_url: thumbLink?.href || '',
        preview_url: thumbLink?.href || '',
        date_created: metadata.date_created || '',
        media_type: metadata.media_type || 'image',
      };
    });
  } catch (error) {
    console.error('NASA Images API fetch error:', error);
    return [];
  }
}

/**
 * Get image URL for a specific asteroid by name
 */
export async function getAsteroidImage(asteroidName: string): Promise<string | null> {
  // Clean asteroid name for search
  const cleanName = asteroidName
    .replace(/\(|\)/g, '')
    .replace(/^\d+\s*/, '')
    .trim();
  
  // Search strategies in order of preference
  const searchTerms = [
    cleanName,
    `asteroid ${cleanName}`,
    'asteroid',
    'near earth object',
  ];

  for (const term of searchTerms) {
    const results = await searchNasaImages({ query: term, limit: 1 });
    if (results.length > 0 && results[0].thumb_url) {
      return results[0].thumb_url;
    }
  }

  // Fallback to a known generic asteroid image
  return 'https://images-assets.nasa.gov/image/PIA22946/PIA22946~small.jpg';
}

/**
 * Get multiple space-related images for gallery/backgrounds
 */
export async function getSpaceImages(count: number = 10): Promise<NasaImageResult[]> {
  const queries = ['asteroid', 'near earth object', 'comet', 'meteor'];
  const results: NasaImageResult[] = [];
  
  for (const query of queries) {
    if (results.length >= count) break;
    const images = await searchNasaImages({ query, limit: Math.ceil(count / queries.length) });
    results.push(...images);
  }
  
  return results.slice(0, count);
}
