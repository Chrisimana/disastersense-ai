import { describe, it, vi, beforeEach, expect } from 'vitest';
import { render } from '@testing-library/react';
import type { MapMarker, RiskStatus } from '../types';

// Leaflet mock
const mockPopup = { setContent: vi.fn().mockReturnThis() };
const mockMarkerInstance = {
  bindPopup: vi.fn().mockReturnThis(),
  addTo: vi.fn().mockReturnThis(),
  setIcon: vi.fn().mockReturnThis(),
  setPopupContent: vi.fn().mockReturnThis(),
  remove: vi.fn(),
  getPopup: vi.fn().mockReturnValue(mockPopup),
};

const mockTileLayer = {
  on: vi.fn().mockReturnThis(),
  addTo: vi.fn().mockReturnThis(),
};

const mockMap = {
  setView: vi.fn().mockReturnThis(),
  remove: vi.fn(),
};

vi.mock('leaflet', () => {
  const divIcon = vi.fn((opts: unknown) => opts);
  const marker = vi.fn(() => mockMarkerInstance);
  const tileLayer = vi.fn(() => mockTileLayer);
  const map = vi.fn(() => mockMap);

  return {
    default: {
      map,
      tileLayer,
      marker,
      divIcon,
      Icon: {
        Default: {
          prototype: { _getIconUrl: vi.fn() },
          mergeOptions: vi.fn(),
        },
      },
    },
    map,
    tileLayer,
    marker,
    divIcon,
  };
});

vi.mock('leaflet/dist/leaflet.css', () => ({}));

import L from 'leaflet';
import MapComponent from './MapComponent';

// Helpers 
function makeMarker(overrides: Partial<MapMarker> = {}): MapMarker {
  return {
    lat: -6.2,
    lon: 106.8,
    status: 'Aman',
    label: 'Jakarta',
    weatherSummary: '🌧 5 mm/jam · 💨 20 km/jam',
    ...overrides,
  };
}

function renderMap(props: Partial<React.ComponentProps<typeof MapComponent>> = {}) {
  return render(
    <MapComponent
      center={[-6.2, 106.8]}
      zoom={12}
      markers={[]}
      {...props}
    />
  );
}

// Tests 
describe('MapComponent — inisialisasi peta', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Validates
  it('merender container peta dengan aria-label yang benar', () => {
    const { getByRole } = renderMap();
    expect(getByRole('application')).toBeTruthy();
    expect(getByRole('application').getAttribute('aria-label')).toBe('Peta risiko interaktif');
  });

  it('memanggil L.map saat komponen di-mount', () => {
    renderMap();
    expect(L.map).toHaveBeenCalledTimes(1);
  });

  it('memanggil L.tileLayer dengan URL OpenStreetMap', () => {
    renderMap();
    expect(L.tileLayer).toHaveBeenCalledWith(
      expect.stringContaining('openstreetmap.org'),
      expect.any(Object)
    );
  });

  it('menambahkan tile layer ke peta', () => {
    renderMap();
    expect(mockTileLayer.addTo).toHaveBeenCalledWith(mockMap);
  });

  it('memanggil map.setView dengan center dan zoom yang diberikan', () => {
    renderMap({ center: [-7.25, 112.75], zoom: 10 });
    expect(mockMap.setView).toHaveBeenCalledWith([-7.25, 112.75], 10);
  });

  it('merender legenda risiko dengan ketiga status', () => {
    const { getByLabelText } = renderMap();
    const legend = getByLabelText('Legenda warna risiko');
    expect(legend.textContent).toContain('Aman');
    expect(legend.textContent).toContain('Waspada');
    expect(legend.textContent).toContain('Bahaya');
  });

  it('merender fallback tile error dalam keadaan tersembunyi', () => {
    const { container } = renderMap();
    const fallback = container.querySelector('#map-tile-fallback') as HTMLElement;
    expect(fallback).toBeTruthy();
    expect(fallback.style.display).toBe('none');
  });

  it('memanggil map.remove saat komponen di-unmount', () => {
    const { unmount } = renderMap();
    unmount();
    expect(mockMap.remove).toHaveBeenCalledTimes(1);
  });
});

describe('MapComponent — marker ditambahkan dengan warna yang benar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('memanggil L.marker untuk setiap marker yang diberikan', () => {
    const markers = [
      makeMarker({ lat: -6.2, lon: 106.8, status: 'Aman' }),
      makeMarker({ lat: -6.9, lon: 107.6, status: 'Bahaya' }),
    ];
    renderMap({ markers });
    expect(L.marker).toHaveBeenCalledTimes(2);
  });

  it('membuat divIcon dengan warna hijau (#22c55e) untuk status Aman', () => {
    renderMap({ markers: [makeMarker({ status: 'Aman' })] });
    const iconArg = (L.divIcon as ReturnType<typeof vi.fn>).mock.calls[0][0] as { html: string };
    expect(iconArg.html).toContain('#22c55e');
  });

  it('membuat divIcon dengan warna kuning (#f59e0b) untuk status Waspada', () => {
    renderMap({ markers: [makeMarker({ status: 'Waspada' })] });
    const iconArg = (L.divIcon as ReturnType<typeof vi.fn>).mock.calls[0][0] as { html: string };
    expect(iconArg.html).toContain('#f59e0b');
  });

  it('membuat divIcon dengan warna merah (#ef4444) untuk status Bahaya', () => {
    renderMap({ markers: [makeMarker({ status: 'Bahaya' })] });
    const iconArg = (L.divIcon as ReturnType<typeof vi.fn>).mock.calls[0][0] as { html: string };
    expect(iconArg.html).toContain('#ef4444');
  });

  it('setiap marker menggunakan icon yang sesuai statusnya', () => {
    const statuses: RiskStatus[] = ['Aman', 'Waspada', 'Bahaya'];
    const expectedColors: Record<RiskStatus, string> = {
      Aman: '#22c55e',
      Waspada: '#f59e0b',
      Bahaya: '#ef4444',
    };

    statuses.forEach((status) => {
      vi.clearAllMocks();
      renderMap({ markers: [makeMarker({ status })] });
      const iconArg = (L.divIcon as ReturnType<typeof vi.fn>).mock.calls[0][0] as { html: string };
      expect(iconArg.html).toContain(expectedColors[status]);
    });
  });

  it('marker ditambahkan ke peta via addTo', () => {
    renderMap({ markers: [makeMarker()] });
    expect(mockMarkerInstance.addTo).toHaveBeenCalledWith(mockMap);
  });

  it('tidak memanggil L.marker saat markers array kosong', () => {
    renderMap({ markers: [] });
    expect(L.marker).not.toHaveBeenCalled();
  });
});

describe('MapComponent — konten popup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('popup berisi nama lokasi (label marker)', () => {
    renderMap({ markers: [makeMarker({ label: 'Bandung' })] });
    const popupHtml = mockMarkerInstance.bindPopup.mock.calls[0][0] as string;
    expect(popupHtml).toContain('Bandung');
  });

  it('popup berisi Status Risiko', () => {
    renderMap({ markers: [makeMarker({ status: 'Waspada' })] });
    const popupHtml = mockMarkerInstance.bindPopup.mock.calls[0][0] as string;
    expect(popupHtml).toContain('Waspada');
  });

  it('popup berisi ringkasan cuaca', () => {
    const summary = '🌧 25 mm/jam · 💨 55 km/jam';
    renderMap({ markers: [makeMarker({ weatherSummary: summary })] });
    const popupHtml = mockMarkerInstance.bindPopup.mock.calls[0][0] as string;
    expect(popupHtml).toContain(summary);
  });

  it('popup berisi warna yang sesuai status risiko', () => {
    renderMap({ markers: [makeMarker({ status: 'Bahaya' })] });
    const popupHtml = mockMarkerInstance.bindPopup.mock.calls[0][0] as string;
    expect(popupHtml).toContain('#ef4444');
  });

  it('popup berisi semua tiga elemen: label, status, dan ringkasan cuaca sekaligus', () => {
    const marker = makeMarker({
      label: 'Surabaya',
      status: 'Bahaya',
      weatherSummary: '🌧 60 mm/jam · 💨 80 km/jam',
    });
    renderMap({ markers: [marker] });
    const popupHtml = mockMarkerInstance.bindPopup.mock.calls[0][0] as string;
    expect(popupHtml).toContain('Surabaya');
    expect(popupHtml).toContain('Bahaya');
    expect(popupHtml).toContain('60 mm/jam');
  });
});
