/**
 * NASA NeoWs API Client
 * 
 * Fetches data from the NASA Near Earth Object Web Service.
 * Server-side only - never expose API key to client.
 */

import type { RawNeoWsFeedResponse, NeoWsError } from './types';

const NEOWS_BASE_URL = 'https://api.nasa.gov/neo/rest/v1';
const MAX_DATE_RANGE_DAYS = 7;

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
