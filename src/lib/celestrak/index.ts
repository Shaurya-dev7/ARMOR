/**
 * CelesTrak Module
 * 
 * Satellite and debris catalog data from CelesTrak/NORAD.
 * Provides normalized satellite models with orbit classification.
 */

// Types
export type {
  RawOmmRecord,
  Satellite,
  NormalizedCelesTrakData,
  OrbitRegime,
  SpaceObjectType,
  CelesTrakGroup,
  CelesTrakError,
  CelesTrakErrorCode,
} from './types';

// Client functions
export {
  fetchCelesTrakCatalog,
  fetchActiveSatellites,
  fetchSpaceStations,
  fetchStarlink,
  fetchDebris,
  fetchGeoSatellites,
} from './client';

// Normalization
export {
  normalizeCelesTrakData,
  validateNormalizedData,
  filterByOrbitRegime,
  filterByAltitude,
} from './normalize';
