/**
 * Space-Track SATCAT Module
 * 
 * Earth-orbiting object catalog from Space-Track.org.
 * Provides normalized SpaceObject models for situational awareness.
 * 
 * This module:
 * - Ingests SATCAT catalog data
 * - Normalizes to internal SpaceObject model
 * - Classifies orbit type (LEO/MEO/GEO/HEO)
 * 
 * It does NOT:
 * - Perform orbital propagation
 * - Calculate collision probabilities
 * - Generate alerts or risk assessments
 */

// Types
export type {
  RawSatcatRecord,
  SpaceObject,
  NormalizedSatcatData,
  ObjectType,
  OrbitClass,
  ObjectStatus,
  SatcatQueryOptions,
  SpaceTrackError,
  SpaceTrackErrorCode,
} from './types';

// Client functions
export {
  fetchSatcat,
  fetchActivePayloads,
  fetchDebris,
  fetchRocketBodies,
  fetchByCountry,
} from './client';

// Normalization
export {
  normalizeSatcatData,
  validateNormalizedData,
  filterByType,
  filterByOrbitClass,
  filterActive,
} from './normalize';
