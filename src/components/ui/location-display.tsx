'use client';

import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import { useGeolocation } from '@/lib/hooks/useGeolocation';
import { cn } from '@/lib/utils';

interface LocationDisplayProps {
  /** Show coordinates alongside city name */
  showCoordinates?: boolean;
  /** Compact mode for navbar */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Component that displays the user's current location.
 * Requests location permission and shows city/coordinates.
 */
export function LocationDisplay({ 
  showCoordinates = false, 
  compact = false,
  className 
}: LocationDisplayProps) {
  const { latitude, longitude, loading, error, requestLocation, isSupported } = useGeolocation();

  if (!isSupported) {
    return null;
  }

  // Not yet requested
  if (!latitude && !longitude && !loading && !error) {
    return (
      <button
        onClick={requestLocation}
        className={cn(
          "flex items-center gap-2 text-muted-foreground hover:text-white transition-colors",
          compact ? "text-xs" : "text-sm",
          className
        )}
      >
        <MapPin className={cn(compact ? "w-3 h-3" : "w-4 h-4")} />
        <span>Detect location</span>
      </button>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className={cn(
        "flex items-center gap-2 text-muted-foreground",
        compact ? "text-xs" : "text-sm",
        className
      )}>
        <Loader2 className={cn("animate-spin", compact ? "w-3 h-3" : "w-4 h-4")} />
        <span>Detecting...</span>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <button
        onClick={requestLocation}
        className={cn(
          "flex items-center gap-2 text-destructive hover:text-destructive/80 transition-colors",
          compact ? "text-xs" : "text-sm",
          className
        )}
        title={error}
      >
        <AlertCircle className={cn(compact ? "w-3 h-3" : "w-4 h-4")} />
        <span>Location unavailable</span>
      </button>
    );
  }

  // Success
  return (
    <div className={cn(
      "flex items-center gap-2 text-white",
      compact ? "text-xs" : "text-sm",
      className
    )}>
      <MapPin className={cn("text-primary", compact ? "w-3 h-3" : "w-4 h-4")} />
      {showCoordinates && latitude && longitude ? (
        <span className="font-mono">
          {latitude.toFixed(4)}°, {longitude.toFixed(4)}°
        </span>
      ) : (
        <span>Location detected</span>
      )}
    </div>
  );
}
