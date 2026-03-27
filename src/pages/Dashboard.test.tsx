import { describe, it, vi, beforeEach, expect } from 'vitest';
import { render, within } from '@testing-library/react';
import fc from 'fast-check';
import Dashboard from './Dashboard';
import type { LocationData, WeatherData, RiskResult, RiskStatus } from '../types';

// Mocks

vi.mock('../store/appStore', () => ({
  useAppStore: vi.fn(),
}));

vi.mock('../services/locationService', () => ({
  detectGPS: vi.fn(() => Promise.reject(new Error('GPS not available'))),
  getCurrentLocation: vi.fn(() => null),
}));

import { useAppStore } from '../store/appStore';

// Arbitraries

const riskStatusArb = fc.constantFrom<RiskStatus>('Aman', 'Waspada', 'Bahaya');

const locationArb: fc.Arbitrary<LocationData> = fc.record({
  lat: fc.double({ min: -90, max: 90, noNaN: true }),
  lon: fc.double({ min: -180, max: 180, noNaN: true }),
  cityName: fc.stringMatching(/^[A-Za-z][A-Za-z0-9]{2,20}$/),
  source: fc.constantFrom<'gps' | 'manual'>('gps', 'manual'),
});

const weatherArb: fc.Arbitrary<WeatherData> = fc.record({
  rainfall: fc.double({ min: 0, max: 500, noNaN: true }),
  windSpeed: fc.double({ min: 0, max: 500, noNaN: true }),
  humidity: fc.double({ min: 0, max: 100, noNaN: true }),
  temperature: fc.double({ min: -20, max: 50, noNaN: true }),
  weatherCode: fc.integer({ min: 0, max: 99 }),
  timestamp: fc.integer({ min: 1_000_000_000_000, max: 9_999_999_999_999 }),
  isStale: fc.boolean(),
});

const riskResultArb: fc.Arbitrary<RiskResult> = riskStatusArb.chain((status) => {
  const minRecs = status === 'Bahaya' ? 5 : status === 'Waspada' ? 3 : 1;
  return fc.record({
    status: fc.constant(status),
    triggeringFactors: status === 'Aman'
      ? fc.constant([])
      : fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 3 }),
    recommendations: fc.array(
      fc.stringMatching(/^[A-Za-z][A-Za-z0-9]{4,40}$/),
      { minLength: minRecs, maxLength: minRecs + 3 }
    ),
    calculatedAt: fc.integer({ min: 1_000_000_000_000, max: 9_999_999_999_999 }),
    isStale: fc.boolean(),
  });
});

// Helper
function renderWithState(overrides: {
  location?: LocationData | null;
  weather?: WeatherData | null;
  riskResult?: RiskResult | null;
  isLoadingWeather?: boolean;
  weatherError?: string | null;
}) {
  const state = {
    location: overrides.location ?? null,
    weather: overrides.weather ?? null,
    riskResult: overrides.riskResult ?? null,
    isLoadingWeather: overrides.isLoadingWeather ?? false,
    weatherError: overrides.weatherError ?? null,
    setLocation: vi.fn(),
  };

  (useAppStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
    (selector: (s: typeof state) => unknown) => selector(state)
  );

  const container = document.createElement('div');
  document.body.appendChild(container);
  const result = render(<Dashboard />, { container });
  return { ...result, container };
}

// Property-Based Tests

describe('Property 9: Kelengkapan Tampilan Dashboard', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('selalu me-render nama lokasi saat AppState valid — Validates: Requirements 4.1', () => {
    fc.assert(
      fc.property(locationArb, weatherArb, riskResultArb, (location, weather, riskResult) => {
        const { container, unmount } = renderWithState({ location, weather, riskResult });
        const scope = within(container);
        const hasLocationName = scope.queryAllByText(new RegExp(location.cityName, 'i')).length > 0;
        unmount();
        container.remove();
        return hasLocationName;
      }),
      { numRuns: 100 }
    );
  });

  it('selalu me-render kartu Data Cuaca Terkini saat AppState valid — Validates: Requirements 4.1', () => {
    fc.assert(
      fc.property(locationArb, weatherArb, riskResultArb, (location, weather, riskResult) => {
        const { container, unmount } = renderWithState({ location, weather, riskResult });
        const scope = within(container);
        const hasWeatherCard = scope.queryAllByText(/data cuaca terkini/i).length > 0;
        unmount();
        container.remove();
        return hasWeatherCard;
      }),
      { numRuns: 100 }
    );
  });

  it('selalu me-render kartu Status Risiko saat AppState valid — Validates: Requirements 4.1', () => {
    fc.assert(
      fc.property(locationArb, weatherArb, riskResultArb, (location, weather, riskResult) => {
        const { container, unmount } = renderWithState({ location, weather, riskResult });
        const scope = within(container);
        const hasRiskStatus = scope.queryAllByText(/status risiko/i).length > 0;
        unmount();
        container.remove();
        return hasRiskStatus;
      }),
      { numRuns: 100 }
    );
  });

  it('selalu me-render kartu Rekomendasi Tindakan saat AppState valid — Validates: Requirements 7.4', () => {
    fc.assert(
      fc.property(locationArb, weatherArb, riskResultArb, (location, weather, riskResult) => {
        const { container, unmount } = renderWithState({ location, weather, riskResult });
        const scope = within(container);
        const hasRecommendations = scope.queryAllByText(/rekomendasi tindakan/i).length > 0;
        unmount();
        container.remove();
        return hasRecommendations;
      }),
      { numRuns: 100 }
    );
  });

  it('semua elemen wajib hadir sekaligus dalam satu render — Validates: Requirements 4.1, 7.4', () => {
    fc.assert(
      fc.property(locationArb, weatherArb, riskResultArb, (location, weather, riskResult) => {
        const { container, unmount } = renderWithState({ location, weather, riskResult });
        const scope = within(container);

        const hasLocationName    = scope.queryAllByText(new RegExp(location.cityName, 'i')).length > 0;
        const hasWeatherCard     = scope.queryAllByText(/data cuaca terkini/i).length > 0;
        const hasRiskStatus      = scope.queryAllByText(/status risiko/i).length > 0;
        const hasRecommendations = scope.queryAllByText(/rekomendasi tindakan/i).length > 0;

        unmount();
        container.remove();
        return hasLocationName && hasWeatherCard && hasRiskStatus && hasRecommendations;
      }),
      { numRuns: 100 }
    );
  });

  it('rekomendasi yang ditampilkan sesuai dengan riskResult.recommendations — Validates: Requirements 7.4', () => {
    fc.assert(
      fc.property(locationArb, weatherArb, riskResultArb, (location, weather, riskResult) => {
        const { container, unmount } = renderWithState({ location, weather, riskResult });
        const scope = within(container);

        const firstRec = riskResult.recommendations[0];
        const isVisible = scope.queryAllByText(new RegExp(firstRec, 'i')).length > 0;

        unmount();
        container.remove();
        return isVisible;
      }),
      { numRuns: 100 }
    );
  });

  it('status risiko yang ditampilkan sesuai dengan riskResult.status — Validates: Requirements 4.1', () => {
    fc.assert(
      fc.property(locationArb, weatherArb, riskResultArb, (location, weather, riskResult) => {
        const { container, unmount } = renderWithState({ location, weather, riskResult });
        const scope = within(container);

        const statusVisible = scope.queryAllByText(new RegExp(riskResult.status, 'i')).length > 0;

        unmount();
        container.remove();
        return statusVisible;
      }),
      { numRuns: 100 }
    );
  });
});

// Unit Tests 

describe('Unit: render saat loading', () => {
  beforeEach(() => vi.clearAllMocks());

  it('menampilkan indikator loading saat isLoadingWeather true', () => {
    const { container, unmount } = renderWithState({ isLoadingWeather: true });
    const scope = within(container);
    expect(scope.getByText(/memuat data cuaca/i)).toBeTruthy();
    unmount();
    container.remove();
  });

  it('tidak menampilkan indikator loading saat isLoadingWeather false', () => {
    const { container, unmount } = renderWithState({ isLoadingWeather: false });
    const scope = within(container);
    expect(scope.queryByText(/memuat data cuaca/i)).toBeNull();
    unmount();
    container.remove();
  });
});

describe('Unit: render saat error cuaca', () => {
  beforeEach(() => vi.clearAllMocks());

  it('menampilkan banner error saat weatherError tidak null', () => {
    const { container, unmount } = renderWithState({
      weatherError: 'Gagal mengambil data cuaca.',
    });
    const scope = within(container);
    expect(scope.getByRole('alert')).toBeTruthy();
    expect(scope.getByText(/gagal mengambil data cuaca/i)).toBeTruthy();
    unmount();
    container.remove();
  });

  it('tidak menampilkan banner error saat weatherError null', () => {
    const { container, unmount } = renderWithState({ weatherError: null });
    const scope = within(container);
    expect(scope.queryByRole('alert')).toBeNull();
    unmount();
    container.remove();
  });

  it('menampilkan waktu data terakhir di banner error jika weather tersedia', () => {
    const weather: WeatherData = {
      rainfall: 5, windSpeed: 20, humidity: 70, temperature: 28,
      weatherCode: 0, timestamp: new Date('2024-01-01T10:00:00').getTime(), isStale: true,
    };
    const { container, unmount } = renderWithState({
      weatherError: 'Timeout.',
      weather,
    });
    const scope = within(container);
    expect(scope.getByRole('alert').textContent).toMatch(/menampilkan data terakhir/i);
    unmount();
    container.remove();
  });
});

describe('Unit: render saat data lengkap — ketiga status', () => {
  beforeEach(() => vi.clearAllMocks());

  const location: LocationData = { lat: -6.2, lon: 106.8, cityName: 'Jakarta', source: 'gps' };
  const weather: WeatherData = {
    rainfall: 5, windSpeed: 20, humidity: 75, temperature: 28,
    weatherCode: 0, timestamp: Date.now(), isStale: false,
  };

  const makeRisk = (status: RiskStatus, recs: string[]): RiskResult => ({
    status,
    triggeringFactors: status === 'Aman' ? [] : ['curah hujan tinggi'],
    recommendations: recs,
    calculatedAt: Date.now(),
    isStale: false,
  });

  it('menampilkan status Aman dengan data cuaca dan rekomendasi', () => {
    const riskResult = makeRisk('Aman', ['Pantau prakiraan cuaca secara berkala']);
    const { container, unmount } = renderWithState({ location, weather, riskResult });
    const scope = within(container);
    expect(scope.getByText(/Jakarta/i)).toBeTruthy();
    expect(scope.getByText(/Aman/i)).toBeTruthy();
    expect(scope.getByText(/data cuaca terkini/i)).toBeTruthy();
    expect(scope.getByText(/pantau prakiraan cuaca/i)).toBeTruthy();
    unmount();
    container.remove();
  });

  it('menampilkan status Waspada dengan faktor pemicu dan rekomendasi', () => {
    const riskResult = makeRisk('Waspada', [
      'Siapkan tas darurat',
      'Periksa saluran air',
      'Pantau informasi BMKG',
    ]);
    const { container, unmount } = renderWithState({ location, weather, riskResult });
    const scope = within(container);
    expect(scope.getByText(/Waspada/i)).toBeTruthy();
    expect(scope.getByText(/faktor/i)).toBeTruthy();
    expect(scope.getByText(/siapkan tas darurat/i)).toBeTruthy();
    unmount();
    container.remove();
  });

  it('menampilkan status Bahaya dengan faktor pemicu dan rekomendasi', () => {
    const riskResult = makeRisk('Bahaya', [
      'Segera evakuasi',
      'Hubungi nomor darurat',
      'Jauhi saluran air',
      'Matikan aliran listrik',
      'Ikuti instruksi petugas',
    ]);
    const { container, unmount } = renderWithState({ location, weather, riskResult });
    const scope = within(container);
    expect(scope.getByText(/Bahaya/i)).toBeTruthy();
    expect(scope.getByText(/segera evakuasi/i)).toBeTruthy();
    unmount();
    container.remove();
  });

  it('menampilkan nilai cuaca: rainfall, windSpeed, humidity, temperature', () => {
    const riskResult = makeRisk('Aman', ['Pantau cuaca']);
    const { container, unmount } = renderWithState({ location, weather, riskResult });
    const scope = within(container);
    expect(scope.getByText(/5 mm\/jam/i)).toBeTruthy();
    expect(scope.getByText(/20 km\/jam/i)).toBeTruthy();
    expect(scope.getByText(/75%/i)).toBeTruthy();
    expect(scope.getByText(/28°C/i)).toBeTruthy();
    unmount();
    container.remove();
  });
});

describe('Unit: update otomatis saat status berubah', () => {
  beforeEach(() => vi.clearAllMocks());

  const location: LocationData = { lat: -6.2, lon: 106.8, cityName: 'Jakarta', source: 'gps' };
  const weather: WeatherData = {
    rainfall: 5, windSpeed: 20, humidity: 75, temperature: 28,
    weatherCode: 0, timestamp: Date.now(), isStale: false,
  };

  it('menampilkan status baru setelah store berubah dari Aman ke Waspada', () => {
    const riskAman: RiskResult = {
      status: 'Aman', triggeringFactors: [], recommendations: ['Pantau cuaca'],
      calculatedAt: Date.now(), isStale: false,
    };
    const { container, unmount } = renderWithState({ location, weather, riskResult: riskAman });
    expect(within(container).getByText(/Aman/i)).toBeTruthy();
    unmount();
    container.remove();

    const riskWaspada: RiskResult = {
      status: 'Waspada',
      triggeringFactors: ['curah hujan tinggi'],
      recommendations: ['Siapkan tas darurat', 'Periksa saluran air', 'Pantau BMKG'],
      calculatedAt: Date.now(), isStale: false,
    };
    const { container: c2, unmount: u2 } = renderWithState({ location, weather, riskResult: riskWaspada });
    expect(within(c2).getByText(/Waspada/i)).toBeTruthy();
    u2();
    c2.remove();
  });

  it('menampilkan status baru setelah store berubah dari Waspada ke Bahaya', () => {
    const riskWaspada: RiskResult = {
      status: 'Waspada',
      triggeringFactors: ['curah hujan tinggi'],
      recommendations: ['Siapkan tas darurat', 'Periksa saluran air', 'Pantau BMKG'],
      calculatedAt: Date.now(), isStale: false,
    };
    const { container, unmount } = renderWithState({ location, weather, riskResult: riskWaspada });
    expect(within(container).getByText(/Waspada/i)).toBeTruthy();
    unmount();
    container.remove();

    const riskBahaya: RiskResult = {
      status: 'Bahaya',
      triggeringFactors: ['kecepatan angin ekstrem'],
      recommendations: ['Evakuasi', 'Hubungi darurat', 'Jauhi sungai', 'Matikan listrik', 'Ikuti petugas'],
      calculatedAt: Date.now(), isStale: false,
    };
    const { container: c2, unmount: u2 } = renderWithState({ location, weather, riskResult: riskBahaya });
    expect(within(c2).getByText(/Bahaya/i)).toBeTruthy();
    u2();
    c2.remove();
  });

  it('memperbarui rekomendasi yang ditampilkan sesuai status baru', () => {
    const riskAman: RiskResult = {
      status: 'Aman', triggeringFactors: [], recommendations: ['Pantau cuaca'],
      calculatedAt: Date.now(), isStale: false,
    };
    const { container, unmount } = renderWithState({ location, weather, riskResult: riskAman });
    expect(within(container).getByText(/pantau cuaca/i)).toBeTruthy();
    unmount();
    container.remove();

    const riskBahaya: RiskResult = {
      status: 'Bahaya',
      triggeringFactors: ['curah hujan ekstrem'],
      recommendations: ['Segera evakuasi', 'Hubungi darurat', 'Jauhi sungai', 'Matikan listrik', 'Ikuti petugas'],
      calculatedAt: Date.now(), isStale: false,
    };
    const { container: c2, unmount: u2 } = renderWithState({ location, weather, riskResult: riskBahaya });
    expect(within(c2).getByText(/segera evakuasi/i)).toBeTruthy();
    expect(within(c2).queryByText(/pantau cuaca/i)).toBeNull();
    u2();
    c2.remove();
  });
});
