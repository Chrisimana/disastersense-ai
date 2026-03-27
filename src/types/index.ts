export interface LocationData {
  lat: number;       // -90 hingga 90
  lon: number;       // -180 hingga 180
  cityName: string;
  source: 'gps' | 'manual';
}

export interface WeatherData {
  rainfall: number;       // mm/jam (precipitation)
  windSpeed: number;      // km/jam (windspeed_10m)
  humidity: number;       // % (relativehumidity_2m)
  temperature: number;    // °C (temperature_2m)
  weatherCode: number;    // kode cuaca WMO (weathercode)
  timestamp: number;      // Unix timestamp
  isStale: boolean;
}

export type RiskStatus = 'Aman' | 'Waspada' | 'Bahaya';

export interface RiskResult {
  status: RiskStatus;
  triggeringFactors: string[];
  recommendations: string[];
  calculatedAt: number;
  isStale: boolean;
}

export interface AlertEntry {
  id: string;
  timestamp: number;
  location: string;
  previousStatus: RiskStatus;
  newStatus: RiskStatus;
  weatherSnapshot: WeatherData;
}

export interface AppState {
  location: LocationData | null;
  weather: WeatherData | null;
  riskResult: RiskResult | null;
  alerts: AlertEntry[];
  isLoadingWeather: boolean;
  weatherError: string | null;
}

export interface MapMarker {
  lat: number;
  lon: number;
  status: RiskStatus;
  label: string;
  weatherSummary: string;
}
