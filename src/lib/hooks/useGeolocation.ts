'use client';

import { useState, useEffect, useCallback } from 'react';

export interface GeolocationState {
  /** Latitude in degrees */
  latitude: number | null;
  /** Longitude in degrees */
  longitude: number | null;
  /** Accuracy of position in meters */
  accuracy: number | null;
  /** Altitude in meters (if available) */
  altitude: number | null;
  /** Loading state */
  loading: boolean;
  /** Error message if geolocation failed */
  error: string | null;
  /** Timestamp of last position update */
  timestamp: number | null;
}

interface UseGeolocationOptions {
  /** Enable high accuracy mode (uses more battery) */
  enableHighAccuracy?: boolean;
  /** Max age of cached position in ms */
  maximumAge?: number;
  /** Timeout for position request in ms */
  timeout?: number;
  /** Automatically request location on mount */
  autoRequest?: boolean;
}

const defaultOptions: UseGeolocationOptions = {
  enableHighAccuracy: false,
  maximumAge: 30000, // 30 seconds
  timeout: 10000,    // 10 seconds
  autoRequest: false,
};

/**
 * React hook for accessing the browser's Geolocation API.
 * 
 * @example
 * const { latitude, longitude, loading, error, requestLocation } = useGeolocation();
 * 
 * // Request location on button click
 * <button onClick={requestLocation}>Detect My Location</button>
 * 
 * // Or auto-request on mount
 * const location = useGeolocation({ autoRequest: true });
 */
export function useGeolocation(options: UseGeolocationOptions = {}) {
  const { enableHighAccuracy, maximumAge, timeout, autoRequest } = {
    ...defaultOptions,
    ...options,
  };

  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    altitude: null,
    loading: false,
    error: null,
    timestamp: null,
  });

  const onSuccess = useCallback((position: GeolocationPosition) => {
    setState({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      loading: false,
      error: null,
      timestamp: position.timestamp,
    });
  }, []);

  const onError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = 'An unknown error occurred.';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location permission denied. Please enable location access.';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable.';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out.';
        break;
    }

    setState((prev) => ({
      ...prev,
      loading: false,
      error: errorMessage,
    }));
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocation is not supported by this browser.',
        loading: false,
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy,
      maximumAge,
      timeout,
    });
  }, [enableHighAccuracy, maximumAge, timeout, onSuccess, onError]);

  // Auto-request on mount if enabled
  useEffect(() => {
    if (autoRequest) {
      requestLocation();
    }
  }, [autoRequest, requestLocation]);

  return {
    ...state,
    /** Manually request the user's location */
    requestLocation,
    /** Check if geolocation is supported */
    isSupported: typeof navigator !== 'undefined' && 'geolocation' in navigator,
  };
}
