import { useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import MapComponent from '../components/MapComponent';
import type { MapMarker } from '../types';

function buildWeatherSummary(weather: { rainfall: number; windSpeed: number; humidity: number; temperature: number } | null): string {
  if (!weather) return 'Data cuaca tidak tersedia';
  return `🌧 ${weather.rainfall} mm/jam · 💨 ${weather.windSpeed} km/jam · 💧 ${weather.humidity}% · 🌡 ${weather.temperature}°C`;
}

export default function MapPage() {
  const location = useAppStore((s) => s.location);
  const weather = useAppStore((s) => s.weather);
  const riskResult = useAppStore((s) => s.riskResult);

  const center: [number, number] = location
    ? [location.lat, location.lon]
    : [-2.5, 118]; // Default: center of Indonesia

  const markers = useMemo<MapMarker[]>(() => {
    if (!location || !riskResult) return [];
    return [
      {
        lat: location.lat,
        lon: location.lon,
        status: riskResult.status,
        label: location.cityName,
        weatherSummary: buildWeatherSummary(weather),
      },
    ];
  }, [location, weather, riskResult]);

  return (
    <main style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0', background: '#fff', flexShrink: 0 }}>
        <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e3a5f' }}>
          Peta Risiko
        </h1>
        {location ? (
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.875rem', color: '#64748b' }}>
            📍 {location.cityName}
            {riskResult && (
              <span
                style={{
                  marginLeft: '0.5rem',
                  fontWeight: 700,
                  color:
                    riskResult.status === 'Bahaya'
                      ? '#ef4444'
                      : riskResult.status === 'Waspada'
                      ? '#f59e0b'
                      : '#22c55e',
                }}
              >
                · {riskResult.status}
              </span>
            )}
          </p>
        ) : (
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.875rem', color: '#94a3b8' }}>
            Lokasi belum ditentukan, buka Dashboard untuk mendeteksi lokasi.
          </p>
        )}
      </div>

      {/* Map fills remaining height */}
      <div style={{ flex: 1, padding: '0.75rem', background: '#f8fafc' }}>
        <div style={{ width: '100%', height: '100%', borderRadius: '0.625rem', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <MapComponent
            center={center}
            zoom={location ? 12 : 5}
            markers={markers}
          />
        </div>
      </div>
    </main>
  );
}
