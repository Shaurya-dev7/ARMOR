/**
 * Space-Track API Client
 * 
 * Fetches SATCAT (Satellite Catalog) data from Space-Track.org.
 * Requires authentication via username/password.
 * 
 * Server-side only - credentials must not be exposed to client.
 * 
 * Reference: https://www.space-track.org/documentation
 */

import type {
  RawSatcatRecord,
  SatcatQueryOptions,
  SpaceTrackError,
} from './types';

const SPACETRACK_BASE_URL = 'https://www.space-track.org';
const AUTH_URL = `${SPACETRACK_BASE_URL}/ajaxauth/login`;
const SATCAT_URL = `${SPACETRACK_BASE_URL}/basicspacedata/query/class/satcat`;
const DEFAULT_TIMEOUT = 30000;

/**
 * Get credentials from environment.
 * @throws SpaceTrackError if not configured
 */
function getCredentials(): { username: string; password: string } {
  const username = process.env.SPACETRACK_USERNAME;
  const password = process.env.SPACETRACK_PASSWORD;

  if (!username || !password) {
    const error: SpaceTrackError = {
      code: 'CREDENTIALS_MISSING',
      message: 'SPACETRACK_USERNAME and/or SPACETRACK_PASSWORD not configured.',
    };
    throw error;
  }

  return { username, password };
}

/**
 * Authenticate with Space-Track and fetch data using cookies.
 * 1. POST to /ajaxauth/login to get session cookies
 * 2. GET the query URL using those cookies
 */
async function authenticatedFetch(
  queryUrl: string,
  timeout: number
): Promise<Response> {
  const { username, password } = getCredentials();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Step 1: Login to get cookies
    const authBody = new URLSearchParams({
      identity: username,
      password: password,
    });

    const loginResponse = await fetch(AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: authBody.toString(),
      signal: controller.signal,
    });

    /* 
      Space-Track returns 200 OK on successful login.
      We need to extract the 'set-cookie' header to use in the subsequent request.
      Note: In Next.js/Node fetch, headers.get('set-cookie') returns all cookies combined.
    */
    const cookies = loginResponse.headers.get('set-cookie');

    if (!loginResponse.ok || !cookies) {
      clearTimeout(timeoutId);
      const error: SpaceTrackError = {
        code: 'AUTH_FAILED',
        message: 'Space-Track login failed or no cookies returned.',
        details: `Status: ${loginResponse.status}`,
      };
      throw error;
    }

    // Step 2: Perform the actual query with cookies
    const dataResponse = await fetch(queryUrl, {
      method: 'GET',
      headers: {
        'Cookie': cookies,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return dataResponse;

  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Build SATCAT query URL with optional filters.
 */
function buildQueryUrl(options: SatcatQueryOptions = {}): string {
  let url = SATCAT_URL;
  const predicates: string[] = [];

  // Object type filter
  if (options.objectType) {
    const typeMap: Record<string, string> = {
      'PAYLOAD': 'PAYLOAD',
      'ROCKET_BODY': 'ROCKET BODY',
      'DEBRIS': 'DEBRIS',
    };
    const rawType = typeMap[options.objectType];
    if (rawType) {
      predicates.push(`OBJECT_TYPE/${rawType}`);
    }
  }

  // Country filter
  if (options.country) {
    predicates.push(`COUNTRY/${options.country}`);
  }

  // Active only (no decay date)
  if (options.activeOnly) {
    predicates.push('DECAY_DATE/null-val');
  }

  // Build URL
  if (predicates.length > 0) {
    url += '/' + predicates.join('/');
  }

  // Limit results
  if (options.limit) {
    url += `/limit/${options.limit}`;
  }

  // Request JSON format
  url += '/format/json';

  return url;
}

export interface FetchSatcatOptions {
  /** Query filters */
  query?: SatcatQueryOptions;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
}

/**
 * Fetch SATCAT data from Space-Track.
 * 
 * @param options - Query options and configuration
 * @returns Array of raw SATCAT records
 * @throws SpaceTrackError on failure
 */
export async function fetchSatcat(
  options: FetchSatcatOptions = {}
): Promise<RawSatcatRecord[]> {
  const timeout = options.timeout ?? DEFAULT_TIMEOUT;
  const queryUrl = buildQueryUrl(options.query);

  try {
    const response = await authenticatedFetch(queryUrl, timeout);

    if (!response.ok) {
      // Check for auth failure
      if (response.status === 401) {
        const error: SpaceTrackError = {
          code: 'AUTH_FAILED',
          message: 'Space-Track authentication failed. Check credentials.',
        };
        throw error;
      }

      // Check for rate limiting
      if (response.status === 429) {
        const error: SpaceTrackError = {
          code: 'RATE_LIMITED',
          message: 'Space-Track rate limit exceeded. Try again later.',
        };
        throw error;
      }

      const error: SpaceTrackError = {
        code: 'NETWORK_ERROR',
        message: `Space-Track API returned status ${response.status}`,
      };
      throw error;
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      const error: SpaceTrackError = {
        code: 'PARSE_ERROR',
        message: 'Space-Track response is not an array.',
      };
      throw error;
    }

    return data as RawSatcatRecord[];

  } catch (err) {
    // Re-throw SpaceTrackError as-is
    if (typeof err === 'object' && err !== null && 'code' in err) {
      throw err;
    }

    // Handle abort/timeout
    if (err instanceof Error && err.name === 'AbortError') {
      const error: SpaceTrackError = {
        code: 'TIMEOUT',
        message: 'Request timed out while fetching Space-Track data.',
      };
      throw error;
    }

    // Generic network error
    const error: SpaceTrackError = {
      code: 'NETWORK_ERROR',
      message: err instanceof Error ? err.message : 'Unknown network error',
    };
    throw error;
  }
}

/**
 * Fetch active payloads only.
 */
export async function fetchActivePayloads(
  limit?: number
): Promise<RawSatcatRecord[]> {
  return fetchSatcat({
    query: {
      objectType: 'PAYLOAD',
      activeOnly: true,
      limit,
    },
  });
}

/**
 * Fetch debris objects.
 */
export async function fetchDebris(limit?: number): Promise<RawSatcatRecord[]> {
  return fetchSatcat({
    query: {
      objectType: 'DEBRIS',
      limit,
    },
  });
}

/**
 * Fetch rocket bodies.
 */
export async function fetchRocketBodies(
  limit?: number
): Promise<RawSatcatRecord[]> {
  return fetchSatcat({
    query: {
      objectType: 'ROCKET_BODY',
      limit,
    },
  });
}

/**
 * Fetch objects by country code.
 */
export async function fetchByCountry(
  country: string,
  limit?: number
): Promise<RawSatcatRecord[]> {
  return fetchSatcat({
    query: {
      country,
      limit,
    },
  });
}
