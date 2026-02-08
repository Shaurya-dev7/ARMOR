export interface Asteroid {
  id: string;
  name: string;
  size_km: number;
  velocity_kph: number;
  miss_distance_km: number;
  approach_date: string;
  is_potentially_hazardous: boolean;
  risk_score: number;
  severity: 'info' | 'warning' | 'alert' | 'critical';
  severity_label: string;
  severity_color: string;
  is_suppressed: boolean;
  civilian_relevance: string;
  confidence: string;
}

export interface FavoriteAsteroid {
  id: string; // Database ID
  user_id: string;
  asteroid_id: string;
  created_at: string;
  asteroid_data: Asteroid; // JSONB storage
}

export interface AsteroidUpdate {
  id: string;
  asteroid_id: string;
  alert_type: 'risk_level' | 'orbit_change' | 'close_approach';
  message: string;
  created_at: string;
  data_snapshot?: any;
}
