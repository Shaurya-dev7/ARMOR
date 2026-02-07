/**
 * NASA NeoWs API Client
 * 
 * Fetches data from the NASA Near Earth Object Web Service.
 * Server-side only - never expose API key to client.
 */

import type { RawNeoWsFeedResponse, NeoWsError } from './types';

const NEOWS_BASE_URL = 'https://api.nasa.gov/neo/rest/v1';
const MAX_DATE_RANGE_DAYS = 7;

// Curated list of famous asteroids for "Smart Search"
// Maps common names (lowercase) to NEO Reference IDs
export const FAMOUS_ASTEROIDS = new Map<string, string>([
  ['apophis', '2099942'],
  ['bennu', '2101955'],
  ['ryugu', '2162173'],
  ['eros', '2000433'],
  ['didymos', '2065803'],
  ['dimorphos', '2065803'], // Same system
  ['psyche', '2000016'],
  ['ceres', '2000001'],
  ['vesta', '2000004'],
  ['pallas', '2000002'],
  ['juno', '2000003'],
  ['florence', '2312233'],
  ['halley', '1000036'], // Halley's Comet (might need comet API, but keeping for ID ref)
  ['oumuamua', '3781865'],
  ['2023 dz2', '54351582'],
  ['2029', '2099942'], // Apophis year
]);

/**
 * Format a Date object to YYYY-MM-DD string
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Validate date range does not exceed NeoWs maximum of 7 days
 */
function validateDateRange(startDate: Date, endDate: Date): void {
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays > MAX_DATE_RANGE_DAYS) {
    throw new Error(`Date range exceeds maximum of ${MAX_DATE_RANGE_DAYS} days. Got ${diffDays} days.`);
  }
  
  if (diffDays < 0) {
    throw new Error('End date must be after start date.');
  }
}

/**
 * Get API key from environment.
 * Throws if not configured.
 */
function getApiKey(): string {
  const apiKey = process.env.NASA_API_KEY;
  
  if (!apiKey) {
    const error: NeoWsError = {
      code: 'API_KEY_MISSING',
      message: 'NASA_API_KEY environment variable is not configured.',
    };
    throw error;
  }
  
  return apiKey;
}

export interface FetchNeoWsOptions {
  /** Start date for the feed (default: today) */
  startDate?: Date;
  /** End date for the feed (default: today) */
  endDate?: Date;
  /** Request timeout in milliseconds (default: 10000) */
  timeout?: number;
}

/**
 * Fetch asteroid close-approach data from NASA NeoWs /feed endpoint.
 * 
 * @param options - Fetch options
 * @returns Raw NeoWs feed response
 * @throws NeoWsError on failure
 */
export async function fetchNeoWsFeed(options: FetchNeoWsOptions = {}): Promise<RawNeoWsFeedResponse> {
  const apiKey = getApiKey();
  
  const today = new Date();
  const startDate = options.startDate ?? today;
  const endDate = options.endDate ?? today;
  const timeout = options.timeout ?? 10000;
  
  // Validate date range
  validateDateRange(startDate, endDate);
  
  const url = new URL(`${NEOWS_BASE_URL}/feed`);
  url.searchParams.set('start_date', formatDate(startDate));
  url.searchParams.set('end_date', formatDate(endDate));
  url.searchParams.set('api_key', apiKey);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      let errorCode: NeoWsError['code'] = 'NETWORK_ERROR';
      let errorMessage = `NeoWs API returned status ${response.status}`;
      
      if (response.status === 403) {
        errorCode = 'API_KEY_INVALID';
        errorMessage = 'NASA API key is invalid or unauthorized.';
      } else if (response.status === 429) {
        errorCode = 'RATE_LIMITED';
        errorMessage = 'NASA API rate limit exceeded. Please try again later.';
      }
      
      const error: NeoWsError = {
        code: errorCode,
        message: errorMessage,
        status: response.status,
      };
      throw error;
    }
    
    const data: RawNeoWsFeedResponse = await response.json();
    return data;
    
  } catch (err) {
    // Re-throw NeoWsError as-is
    if (typeof err === 'object' && err !== null && 'code' in err) {
      throw err;
    }
    
    // Handle abort/timeout
    if (err instanceof Error && err.name === 'AbortError') {
      const error: NeoWsError = {
        code: 'NETWORK_ERROR',
        message: 'Request timed out while fetching NeoWs data.',
      };
      throw error;
    }
    
    // Generic network error
    const error: NeoWsError = {
      code: 'NETWORK_ERROR',
      message: err instanceof Error ? err.message : 'Unknown network error',
    };
    throw error;
  }
}

/**
 * Fetch today's asteroid data (convenience method).
 */
export async function fetchTodaysAsteroids(): Promise<RawNeoWsFeedResponse> {
  const today = new Date();
  return fetchNeoWsFeed({ startDate: today, endDate: today });
}

/**
 * Fetch a week's worth of asteroid data.
 */
export async function fetchWeekAsteroids(): Promise<RawNeoWsFeedResponse> {
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 6); // 7 days total including today
  
  return fetchNeoWsFeed({ startDate: today, endDate: nextWeek });
}

/**
 * Fetch details for a specific Asteroid by ID.
 */
export async function fetchAsteroidById(id: string): Promise<any> {
  const apiKey = getApiKey();
  const url = `${NEOWS_BASE_URL}/neo/${id}?api_key=${apiKey}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
       if (response.status === 404) return null;
       throw new Error(`NeoWs API returned status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching asteroid ${id}:`, error);
    throw error;
  }
}

/**
 * Search for an asteroid by Name (Smart Lookup) or ID.
 * Returns null if not found.
 */
export async function searchAsteroids(query: string): Promise<any | null> {
  const normalizedQuery = query.toLowerCase().trim();
  
  // 1. Check Famous Asteroids Dictionary
  if (FAMOUS_ASTEROIDS.has(normalizedQuery)) {
    const id = FAMOUS_ASTEROIDS.get(normalizedQuery)!;
    return await fetchAsteroidById(id);
  }

  // 2. Check if query is a numeric ID (SPK-ID)
  // SPK-IDs are typically 7 digits, but can vary.
  if (/^\d{6,8}$/.test(normalizedQuery)) {
    return await fetchAsteroidById(normalizedQuery);
  }

  // 3. (Optional) Could try NeoWs Lookup API if supported, 
  // but standard NeoWs feed doesn't support partial name search clearly 
  // without downloading the full database.
  // For now, we rely on ID or Famous Name.
  
  return null;
}
