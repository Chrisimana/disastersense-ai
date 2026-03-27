// Komponen peta interaktif berbasis Leaflet
import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MapMarker, RiskStatus } from '../types';
import { getRiskColor } from './RiskBadge';

// Perbaikan ikon default Leaflet yang tidak muncul saat di-bundle dengan Vite
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapComponentProps {
  center: [number, number];
  zoom?: number;
  markers?: MapMarker[];
}

// Membuat ikon lingkaran SVG berwarna sesuai status risiko untuk marker peta
function createRiskIcon(status: RiskStatus): L.DivIcon {
  const color = getRiskColor(status);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="11" fill="${color}" stroke="#fff" stroke-width="2.5"/>
      <circle cx="14" cy="14" r="4" fill="#fff" opacity="0.8"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

// Membuat konten HTML popup yang muncul saat marker diklik
function buildPopupHtml(marker: MapMarker): string {
  const color = getRiskColor(marker.status);
  return `
    <div style="min-width:180px;font-family:sans-serif;font-size:13px;line-height:1.5">
      <strong style="font-size:14px;color:#1e3a5f">${marker.label}</strong>
      <div style="margin:6px 0 4px">
        <span style="background:${color};color:#fff;padding:2px 8px;border-radius:4px;font-weight:700;font-size:12px">
          ${marker.status}
        </span>
      </div>
      <div style="color:#475569;font-size:12px">${marker.weatherSummary}</div>
    </div>`;
}

export default function MapComponent({ center, zoom = 12, markers = [] }: MapComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);   // referensi ke elemen DOM container peta
  const mapRef = useRef<L.Map | null>(null);           // instance peta Leaflet
  const markersRef = useRef<Map<string, L.Marker>>(new Map()); // cache marker aktif (key: "lat,lon")
  const tileErrorRef = useRef(false);                  // flag untuk mencegah duplikasi pesan error tile
  const tileLayerRef = useRef<L.TileLayer | null>(null); // referensi tile layer OpenStreetMap

  // Inisialisasi peta Leaflet
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: true,
    });

    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    });

    tileLayer.on('tileerror', () => {
      if (!tileErrorRef.current) {
        tileErrorRef.current = true;

        const fallback = document.getElementById('map-tile-fallback');
        if (fallback) fallback.style.display = 'flex';
      }
    });

    tileLayer.addTo(map);
    tileLayerRef.current = tileLayer;
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  // Perbarui posisi dan zoom peta saat props center atau zoom berubah
  useEffect(() => {
    mapRef.current?.setView(center, zoom);
  }, [center, zoom]);

  // Sinkronisasi marker di peta dengan data props terbaru secara efisien
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const incoming = new Set(markers.map((m) => `${m.lat},${m.lon}`));

    markersRef.current.forEach((leafletMarker, key) => {
      if (!incoming.has(key)) {
        leafletMarker.remove();
        markersRef.current.delete(key);
      }
    });

    markers.forEach((m) => {
      const key = `${m.lat},${m.lon}`;
      const icon = createRiskIcon(m.status);
      const popup = buildPopupHtml(m);

      if (markersRef.current.has(key)) {
        const existing = markersRef.current.get(key)!;
        existing.setIcon(icon);
        existing.setPopupContent(popup);
      } else {
        const leafletMarker = L.marker([m.lat, m.lon], { icon })
          .bindPopup(popup)
          .addTo(map);
        markersRef.current.set(key, leafletMarker);
      }
    });
  }, [markers]);

  // Fungsi utilitas untuk memindahkan tampilan peta ke koordinat tertentu dari luar komponen
  const centerOn = useCallback((lat: number, lon: number, z?: number) => {
    mapRef.current?.setView([lat, lon], z ?? zoom);
  }, [zoom]);

  useEffect(() => {
    if (containerRef.current) {
      (containerRef.current as unknown as Record<string, unknown>).centerOn = centerOn;
    }
  }, [centerOn]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Map container */}
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', borderRadius: '0.5rem', overflow: 'hidden' }}
        aria-label="Peta risiko interaktif"
        role="application"
      />

      {/* Tile error fallback */}
      <div
        id="map-tile-fallback"
        style={{
          display: 'none',
          position: 'absolute',
          inset: 0,
          background: 'rgba(248,250,252,0.92)',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '0.5rem',
          borderRadius: '0.5rem',
          pointerEvents: 'none',
          zIndex: 1000,
        }}
      >
        <span style={{ fontSize: '2rem' }}>🗺️</span>
        <p style={{ color: '#64748b', fontWeight: 600, margin: 0 }}>Peta tidak tersedia</p>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>Periksa koneksi internet Anda</p>
      </div>

      {/* Risk legend */}
      <div
        style={{
          position: 'absolute',
          bottom: '1.5rem',
          right: '0.75rem',
          background: 'rgba(255,255,255,0.95)',
          border: '1px solid #e2e8f0',
          borderRadius: '0.5rem',
          padding: '0.625rem 0.875rem',
          zIndex: 999,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          fontSize: '0.78rem',
          lineHeight: 1.8,
        }}
        aria-label="Legenda warna risiko"
      >
        <div style={{ fontWeight: 700, color: '#1e3a5f', marginBottom: '0.25rem', fontSize: '0.8rem' }}>
          Legenda
        </div>
        {(['Aman', 'Waspada', 'Bahaya'] as RiskStatus[]).map((s) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span
              style={{
                display: 'inline-block',
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: getRiskColor(s),
                flexShrink: 0,
              }}
            />
            <span style={{ color: '#334155' }}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
