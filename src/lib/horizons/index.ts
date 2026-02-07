/**
 * NASA JPL Horizons API Module
 * 
 * Precision ephemeris extraction and normalization for ARMOR.
 * 
 * This module:
 * - Queries NASA JPL Horizons for Cartesian state vectors
 * - Parses ephemeris data between $$SOE and $$EOE markers
 * - Normalizes to OrbitSample internal model
 * 
 * It does NOT:
 * - Perform risk analysis
 * - Calculate impact probabilities
 * - Generate alerts
 * - Interpret danger or intent
 * 
 * Server-side only. Cache by (object + time window + step size).
 */

// Types
export type {
  HorizonsRequestParams,
  HorizonsQueryParams,
  RawHorizonsResponse,
  ParsedEphemerisEntry,
  OrbitSample,
  NormalizedHorizonsData,
  HorizonsError,
  HorizonsErrorCode,
} from './types';

// Client functions
export {
  fetchHorizonsEphemeris,
  fetchEarthEphemeris,
  fetchAsteroidEphemeris,
} from './client';

// Parser (for advanced usage)
export {
  parseHorizonsResult,
  extractEphemerisBlock,
} from './parser';

// Normalization (for advanced usage)
export {
  normalizeHorizonsData,
  validateNormalizedData,
} from './normalize';
