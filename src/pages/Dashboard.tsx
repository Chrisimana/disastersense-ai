import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import RiskBadge from '../components/RiskBadge';
import LocationForm from '../components/LocationForm';
import { detectGPS } from '../services/locationService';

// WMO weather code
function getWeatherDescription(code: number): { label: string; icon: string } {
  if (code === 0) return { label: 'Cerah', icon: '☀️' };
  if (code <= 2) return { label: 'Sebagian Berawan', icon: '⛅' };
  if (code === 3) return { label: 'Berawan', icon: '☁️' };
  if (code <= 49) return { label: 'Berkabut', icon: '🌫️' };
  if (code <= 59) return { label: 'Gerimis', icon: '🌦️' };
  if (code <= 69) return { label: 'Hujan', icon: '🌧️' };
  if (code <= 79) return { label: 'Hujan Salju', icon: '🌨️' };
  if (code <= 84) return { label: 'Hujan Lebat', icon: '🌧️' };
  if (code <= 99) return { label: 'Badai Petir', icon: '⛈️' };
  return { label: 'Tidak Diketahui', icon: '🌡️' };
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function Dashboard() {
  const location = useAppStore((s) => s.location);
  const weather = useAppStore((s) => s.weather);
  const riskResult = useAppStore((s) => s.riskResult);
  const alerts = useAppStore((s) => s.alerts);
  const isLoadingWeather = useAppStore((s) => s.isLoadingWeather);
  const weatherError = useAppStore((s) => s.weatherError);
  const setLocation = useAppStore((s) => s.setLocation);

  const [showLocationForm, setShowLocationForm] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!location) {
      // No location at all
      detectGPS()
        .then((loc) => setLocation(loc))
        .catch(() => {
          setGpsError('Akses GPS ditolak atau tidak tersedia.');
          setShowLocationForm(true);
        });
    } else if (!weather && !isLoadingWeather) {
      setLocation(location);
    }
  }, []); 

  const weatherDesc = weather ? getWeatherDescription(weather.weatherCode) : null;
  const recentAlerts = [...alerts].reverse().slice(0, 3);

  return (
    <main style={{ padding: '1.5rem', maxWidth: '960px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e3a5f', margin: 0 }}>
            Dashboard Risiko
          </h1>
          {location && (
            <p style={{ margin: '0.25rem 0 0', color: '#475569', fontSize: '0.95rem' }}>
              📍 {location.cityName}
              {weather && (
                <span style={{ marginLeft: '0.75rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                  {formatDate(weather.timestamp)}
                </span>
              )}
            </p>
          )}
        </div>
        <button onClick={() => setShowLocationForm((v) => !v)} style={outlineButtonStyle}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e0e7ef'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
          📍 Ganti Lokasi
        </button>
      </div>

      {/* GPS error */}
      {(showLocationForm || gpsError) && (
        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
          {gpsError && !showLocationForm && (
            <p style={{ color: '#ef4444', marginBottom: '0.75rem', fontSize: '0.9rem' }}>{gpsError}</p>
          )}
          <LocationForm onSuccess={() => { setShowLocationForm(false); setGpsError(null); }} />
        </div>
      )}

      {/* Weather error banner */}
      {weatherError && (
        <div role="alert" style={{ marginBottom: '1.5rem', padding: '0.875rem 1rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '0.5rem', color: '#b91c1c', fontSize: '0.9rem' }}>
          ⚠ {weatherError}
          {weather && <span style={{ marginLeft: '0.5rem', color: '#64748b', fontSize: '0.8rem' }}>(Data terakhir: {formatTime(weather.timestamp)})</span>}
        </div>
      )}

      {/* Loading */}
      {isLoadingWeather && (
        <div aria-live="polite" style={{ marginBottom: '1.5rem', padding: '1rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.5rem', color: '#1d4ed8', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
          Memuat data cuaca...
        </div>
      )}

      {/* No location */}
      {!location && !isLoadingWeather && !showLocationForm && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Lokasi belum ditentukan.</p>
          <button onClick={() => setShowLocationForm(true)} style={{ padding: '0.625rem 1.5rem', backgroundColor: '#1e3a5f', color: '#fff', border: 'none', borderRadius: '0.375rem', fontWeight: 600, cursor: 'pointer' }}>
            Masukkan Lokasi Manual
          </button>
        </div>
      )}

      {location && (weather || riskResult) && (
        <>
          {/* Quick stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
            <QuickStat icon={weatherDesc?.icon ?? '🌡️'} label="Kondisi Cuaca" value={weatherDesc?.label ?? '—'} />
            <QuickStat icon="🌡️" label="Suhu" value={weather ? `${weather.temperature}°C` : '—'} />
            <QuickStat icon="💧" label="Kelembaban" value={weather ? `${weather.humidity}%` : '—'} />
            <QuickStat icon="🔔" label="Total Alert" value={String(alerts.length)} accent={alerts.length > 0} />
          </div>

          {/* Main grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>

            {/* Risk Status */}
            {riskResult && (
              <div style={cardStyle}>
                <h2 style={cardTitleStyle}>Status Risiko</h2>
                <div style={{ marginBottom: '0.75rem' }}>
                  <RiskBadge status={riskResult.status} size="lg" />
                  {riskResult.isStale && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>(data lama)</span>}
                </div>
                {riskResult.triggeringFactors.length > 0 && (
                  <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0 0 0.5rem' }}>
                    <strong>Faktor:</strong> {riskResult.triggeringFactors.join(', ')}
                  </p>
                )}
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
                  Dihitung: {formatTime(riskResult.calculatedAt)}
                </p>
              </div>
            )}

            {/* Weather detail */}
            {weather && (
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <h2 style={{ ...cardTitleStyle, marginBottom: 0 }}>Data Cuaca Terkini</h2>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    {formatTime(weather.timestamp)}
                    {weather.isStale && ' (lama)'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <WeatherStat label="Curah Hujan" value={`${weather.rainfall} mm/jam`} />
                  <WeatherStat label="Kec. Angin" value={`${weather.windSpeed} km/jam`} />
                  <WeatherStat label="Kelembaban" value={`${weather.humidity}%`} />
                  <WeatherStat label="Suhu" value={`${weather.temperature}°C`} />
                </div>
              </div>
            )}

            {/* Recommendations */}
            {riskResult && riskResult.recommendations.length > 0 && (
              <div style={{ ...cardStyle, gridColumn: 'span 2' }}>
                <h2 style={cardTitleStyle}>Rekomendasi Tindakan</h2>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#334155', lineHeight: 1.7 }}>
                  {riskResult.recommendations.map((rec, i) => (
                    <li key={i} style={{ fontSize: '0.9rem' }}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recent alerts */}
            <div style={{ ...cardStyle, gridColumn: 'span 2' }}>
              <h2 style={cardTitleStyle}>Riwayat Alert Terbaru</h2>
              {recentAlerts.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>Belum ada alert yang tercatat.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {recentAlerts.map((alert) => (
                    <div key={alert.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.75rem', background: '#f8fafc', borderRadius: '0.375rem', fontSize: '0.875rem' }}>
                      <span style={{ color: '#64748b', minWidth: '80px' }}>{formatTime(alert.timestamp)}</span>
                      <span style={{ color: '#475569' }}>{alert.location}</span>
                      <span style={{ color: '#94a3b8' }}>
                        {alert.previousStatus} → <strong style={{ color: alert.newStatus === 'Bahaya' ? '#dc2626' : alert.newStatus === 'Waspada' ? '#d97706' : '#16a34a' }}>{alert.newStatus}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {alerts.length > 3 && (
                <button onClick={() => navigate('/notifications')} style={{ marginTop: '0.75rem', background: 'none', border: 'none', color: '#1e3a5f', fontSize: '0.85rem', cursor: 'pointer', padding: 0, fontWeight: 600 }}>
                  Lihat semua ({alerts.length}) →
                </button>
              )}
            </div>
          </div>

          {/* Quick navigation */}
          <div style={{ marginTop: '1.25rem' }}>
            <h2 style={{ ...cardTitleStyle, marginBottom: '0.75rem' }}>Akses Cepat</h2>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <NavShortcut icon="🗺️" label="Peta Risiko" onClick={() => navigate('/map')} />
              <NavShortcut icon="🔔" label="Notifikasi" onClick={() => navigate('/notifications')} />
              <NavShortcut icon="📚" label="Edukasi Bencana" onClick={() => navigate('/education')} />
              <NavShortcut icon="ℹ️" label="Tentang Aplikasi" onClick={() => navigate('/about')} />
            </div>
          </div>
        </>
      )}
    </main>
  );
}

function QuickStat({ icon, label, value, accent }: { icon: string; label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${accent ? '#fca5a5' : '#e2e8f0'}`, borderRadius: '0.625rem', padding: '0.875rem 1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <span style={{ fontSize: '1.5rem' }}>{icon}</span>
      <div>
        <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: accent ? '#dc2626' : '#1e3a5f' }}>{value}</div>
      </div>
    </div>
  );
}

function WeatherStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: '#f8fafc', borderRadius: '0.375rem', padding: '0.5rem 0.75rem' }}>
      <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.125rem' }}>{label}</div>
      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e3a5f' }}>{value}</div>
    </div>
  );
}

function NavShortcut({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: '#1e3a5f', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'background-color 200ms' }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; }}>
      <span style={{ fontSize: '1.1rem' }}>{icon}</span>
      {label}
    </button>
  );
}

const outlineButtonStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  border: '1.5px solid #1e3a5f',
  borderRadius: '0.375rem',
  background: 'transparent',
  color: '#1e3a5f',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: '0.875rem',
  transition: 'background-color 200ms',
};

const cardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: '0.625rem',
  padding: '1.25rem',
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 700,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '0.75rem',
  marginTop: 0,
};
