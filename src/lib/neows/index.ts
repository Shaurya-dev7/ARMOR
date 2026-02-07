/**
 * NeoWs Module Index
 * 
 * Re-exports all public types and functions from the NeoWs data layer.
 */

// Types
export type {
  Asteroid,
  CloseApproachEvent,
  NormalizedNeoWsData,
  NeoWsError,
  RawNeoWsFeedResponse,
} from './types';

// Client
export {
  fetchNeoWsFeed,
  fetchTodaysAsteroids,
  fetchWeekAsteroids,
} from './client';

// Normalization
export {
  normalizeNeoWsFeed,
  validateNormalizedData,
} from './normalize';
