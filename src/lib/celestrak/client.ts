/**
 * CelesTrak API Client
 * 
 * Fetches satellite catalog data from CelesTrak.
 * Uses JSON format OMM (Orbital Mean-Elements Message) data.
 * 
 * No authentication required.
 * Server-side only to enable caching.
 */

import type {
  RawOmmRecord,
  CelesTrakGroup,
  CelesTrakError,
} from './types';

const CELESTRAK_BASE_URL = 'https://celestrak.org/NORAD/elements/gp.php';
const DEFAULT_TIMEOUT = 15000;

/**
 * Build CelesTrak API URL for a catalog group.
 */
function buildUrl(group: CelesTrakGroup): string {
  const url = new URL(CELESTRAK_BASE_URL);
  url.searchParams.set('GROUP', group);
  url.searchParams.set('FORMAT', 'json');
  return url.toString();
}

export interface FetchCelesTrakOptions {
  /** Request timeout in milliseconds (default: 15000) */
  timeout?: number;
}

/**
 * Fetch satellite catalog data from CelesTrak.
 * 
 * @param group - Catalog group to fetch
 * @param options - Optional fetch configuration
 * @returns Array of raw OMM records
 * @throws CelesTrakError on failure
 */
export async function fetchCelesTrakCatalog(
  group: CelesTrakGroup,
  options: FetchCelesTrakOptions = {}
): Promise<RawOmmRecord[]> {
  const timeout = options.timeout ?? DEFAULT_TIMEOUT;
  const url = buildUrl(group);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error: CelesTrakError = {
        code: 'NETWORK_ERROR',
        message: `CelesTrak API returned status ${response.status}`,
      };
      throw error;
    }

    const data: RawOmmRecord[] = await response.json();

    if (!Array.isArray(data)) {
      const error: CelesTrakError = {
        code: 'PARSE_ERROR',
        message: 'CelesTrak response is not an array.',
      };
      throw error;
    }

    if (data.length === 0) {
      const error: CelesTrakError = {
        code: 'EMPTY_RESPONSE',
        message: `No satellites found in group: ${group}`,
      };
      throw error;
    }

    return data;

  } catch (err) {
    // Re-throw CelesTrakError as-is
    if (typeof err === 'object' && err !== null && 'code' in err) {
      throw err;
    }

    // Handle abort/timeout
    if (err instanceof Error && err.name === 'AbortError') {
      const error: CelesTrakError = {
        code: 'TIMEOUT',
        message: 'Request timed out while fetching CelesTrak data.',
      };
      throw error;
    }

    // Generic network error
    const error: CelesTrakError = {
      code: 'NETWORK_ERROR',
      message: err instanceof Error ? err.message : 'Unknown network error',
    };
    throw error;
  }
}

/**
 * Fetch active satellites.
 */
export async function fetchActiveSatellites(): Promise<RawOmmRecord[]> {
  return fetchCelesTrakCatalog('active');
}

/**
 * Fetch space stations (ISS, Tiangong, etc.).
 */
export async function fetchSpaceStations(): Promise<RawOmmRecord[]> {
  return fetchCelesTrakCatalog('stations');
}

/**
 * Fetch Starlink constellation.
 */
export async function fetchStarlink(): Promise<RawOmmRecord[]> {
  return fetchCelesTrakCatalog('starlink');
}

/**
 * Fetch tracked debris.
 */
export async function fetchDebris(): Promise<RawOmmRecord[]> {
  return fetchCelesTrakCatalog('debris');
}

/**
 * Fetch GEO satellites.
 */
export async function fetchGeoSatellites(): Promise<RawOmmRecord[]> {
  return fetchCelesTrakCatalog('geo');
}
