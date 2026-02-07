/**
 * NASA JPL Horizons API Client
 * 
 * Fetches precision ephemeris data from the Horizons API.
 * Server-side only - for orbital precision refinement.
 * 
 * CONSTRAINTS:
 * - Horizons queries are computationally expensive
 * - Must be server-side only
 * - Should be cached by (object + time window + step size)
 * - Never called per UI interaction
 * 
 * API Reference: https://ssd.jpl.nasa.gov/api/horizons.api
 */

import type {
  HorizonsRequestParams,
  HorizonsQueryParams,
  RawHorizonsResponse,
  NormalizedHorizonsData,
  HorizonsError,
} from './types';
import { parseHorizonsResult } from './parser';
import { normalizeHorizonsData, validateNormalizedData } from './normalize';

const HORIZONS_BASE_URL = 'https://ssd.jpl.nasa.gov/api/horizons.api';
const DEFAULT_TIMEOUT = 30000; // 30 seconds - Horizons can be slow

/**
 * Build Horizons API query parameters from request params.
 */
function buildQueryParams(params: HorizonsRequestParams): HorizonsQueryParams {
  return {
    format: 'json',
    COMMAND: `'${params.command}'`, // Horizons expects quoted command
    EPHEM_TYPE: 'VECTORS',
    CENTER: params.center,
    START_TIME: `'${params.startTime}'`,
    STOP_TIME: `'${params.stopTime}'`,
    STEP_SIZE: `'${params.stepSize}'`,
    CAL_FORMAT: 'CAL',
    OUT_UNITS: 'KM-S',
    TIME_TYPE: 'TDB',
    REF_PLANE: 'ECLIPTIC',
    REF_SYSTEM: 'J2000',
    VEC_TABLE: '2', // Position + velocity only
  };
}

/**
 * Build full URL with query string.
 */
function buildUrl(params: HorizonsRequestParams): string {
  const queryParams = buildQueryParams(params);
  const url = new URL(HORIZONS_BASE_URL);
  
  for (const [key, value] of Object.entries(queryParams)) {
    url.searchParams.set(key, value);
  }
  
  return url.toString();
}

export interface FetchHorizonsOptions {
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
}

/**
 * Fetch ephemeris data from NASA JPL Horizons API.
 * 
 * @param params - Request parameters specifying target, center, time range
 * @param options - Optional fetch configuration
 * @returns Normalized ephemeris data with OrbitSamples
 * @throws HorizonsError on any failure
 */
export async function fetchHorizonsEphemeris(
  params: HorizonsRequestParams,
  options: FetchHorizonsOptions = {}
): Promise<NormalizedHorizonsData> {
  const timeout = options.timeout ?? DEFAULT_TIMEOUT;
  const url = buildUrl(params);

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
      const error: HorizonsError = {
        code: 'NETWORK_ERROR',
        message: `Horizons API returned status ${response.status}`,
        details: await response.text().catch(() => 'Unable to read response body'),
      };
      throw error;
    }

    const data: RawHorizonsResponse = await response.json();

    // Validate response structure
    if (!data.result) {
      const error: HorizonsError = {
        code: 'MISSING_RESULT',
        message: 'Horizons response missing "result" field.',
      };
      throw error;
    }

    // Parse the result string
    const parsedEntries = parseHorizonsResult(data.result);

    // Normalize to internal model
    const normalizedData = normalizeHorizonsData(parsedEntries, params);

    // Validate the normalized data
    if (!validateNormalizedData(normalizedData)) {
      const error: HorizonsError = {
        code: 'PARSE_ERROR',
        message: 'Normalized data failed validation checks.',
      };
      throw error;
    }

    return normalizedData;

  } catch (err) {
    // Re-throw HorizonsError as-is
    if (typeof err === 'object' && err !== null && 'code' in err) {
      throw err;
    }

    // Handle abort/timeout
    if (err instanceof Error && err.name === 'AbortError') {
      const error: HorizonsError = {
        code: 'TIMEOUT',
        message: 'Request timed out while fetching Horizons data.',
      };
      throw error;
    }

    // Generic network error
    const error: HorizonsError = {
      code: 'NETWORK_ERROR',
      message: err instanceof Error ? err.message : 'Unknown network error',
    };
    throw error;
  }
}

/**
 * Fetch Earth ephemeris for a given time range.
 * Earth is commonly used as reference for Earth-relative calculations.
 */
export async function fetchEarthEphemeris(
  startTime: string,
  stopTime: string,
  stepSize: string = '1d'
): Promise<NormalizedHorizonsData> {
  return fetchHorizonsEphemeris({
    command: '399', // Earth NAIF ID
    center: '@0',   // Solar System Barycenter
    startTime,
    stopTime,
    stepSize,
  });
}

/**
 * Fetch ephemeris for an asteroid by its SPK-ID or designation.
 * Used to refine orbital precision for NeoWs-discovered objects.
 */
export async function fetchAsteroidEphemeris(
  asteroidId: string,
  startTime: string,
  stopTime: string,
  stepSize: string = '1d'
): Promise<NormalizedHorizonsData> {
  return fetchHorizonsEphemeris({
    command: asteroidId,
    center: '@0', // Solar System Barycenter
    startTime,
    stopTime,
    stepSize,
  });
}
