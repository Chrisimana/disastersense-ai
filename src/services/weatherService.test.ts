import { describe, it, beforeEach, expect, vi } from 'vitest';
import fc from 'fast-check';
import { fetchWeather } from './weatherService';
import { LocationData } from '../types';

const sampleLocation: LocationData = {
  lat: -6.2,
  lon: 106.8,
  cityName: 'Jakarta',
  source: 'manual',
};

beforeEach(() => {
  vi.restoreAllMocks();
});

// Property-Based Tests

describe('Property 5: Kelengkapan Field Data Cuaca', () => {
  it(
    'WeatherData selalu memiliki semua field yang terdefinisi dengan tipe number — Validates: Requirements 2.2',
    async () => {

      const openMeteoResponseArb = fc
        .integer({ min: 1, max: 24 }) // number of hourly entries
        .chain((size) =>
          fc.record({
            latitude: fc.double({ min: -90, max: 90, noNaN: true }),
            longitude: fc.double({ min: -180, max: 180, noNaN: true }),
            hourly: fc.record({
              time: fc.array(
                fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map(
                  (d) => d.toISOString().slice(0, 16) // "YYYY-MM-DDTHH:MM"
                ),
                { minLength: size, maxLength: size }
              ),
              precipitation: fc.array(
                fc.double({ min: 0, max: 100, noNaN: true }),
                { minLength: size, maxLength: size }
              ),
              windspeed_10m: fc.array(
                fc.double({ min: 0, max: 200, noNaN: true }),
                { minLength: size, maxLength: size }
              ),
              relativehumidity_2m: fc.array(
                fc.integer({ min: 0, max: 100 }),
                { minLength: size, maxLength: size }
              ),
              temperature_2m: fc.array(
                fc.double({ min: -50, max: 60, noNaN: true }),
                { minLength: size, maxLength: size }
              ),
              weathercode: fc.array(
                fc.integer({ min: 0, max: 99 }),
                { minLength: size, maxLength: size }
              ),
            }),
          })
        );

      await fc.assert(
        fc.asyncProperty(openMeteoResponseArb, async (mockResponse) => {
          vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
              ok: true,
              json: async () => mockResponse,
            })
          );

          const result = await fetchWeather(sampleLocation);

          // All required fields must be present and of type number
          return (
            typeof result.rainfall === 'number' &&
            typeof result.windSpeed === 'number' &&
            typeof result.humidity === 'number' &&
            typeof result.temperature === 'number' &&
            typeof result.weatherCode === 'number' &&
            typeof result.timestamp === 'number' &&
            result.rainfall !== undefined &&
            result.windSpeed !== undefined &&
            result.humidity !== undefined &&
            result.temperature !== undefined &&
            result.weatherCode !== undefined &&
            result.timestamp !== undefined
          );
        }),
        { numRuns: 100 }
      );
    }
  );
});

// Unit Tests

function buildOpenMeteoResponse(idx: number, size = 3) {
  const times = Array.from({ length: size }, (_, i) => {
    const d = new Date(Date.now() + (i - idx) * 3600 * 1000);
    return d.toISOString().slice(0, 16);
  });
  return {
    hourly: {
      time: times,
      precipitation: times.map((_, i) => i * 1.5),
      windspeed_10m: times.map((_, i) => i * 10),
      relativehumidity_2m: times.map((_, i) => 50 + i),
      temperature_2m: times.map((_, i) => 25 + i),
      weathercode: times.map((_, i) => i),
    },
  };
}

describe('Unit: fetchWeather — fetch sukses', () => {
  it('mengembalikan WeatherData lengkap dengan isStale: false — Validates: Requirements 2.1', async () => {
    // Reset module state so lastWeatherData is null
    vi.resetModules();
    const { fetchWeather: fw } = await import('./weatherService');

    const mockResponse = buildOpenMeteoResponse(1);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => mockResponse })
    );

    const result = await fw(sampleLocation);

    expect(result.isStale).toBe(false);
    expect(typeof result.rainfall).toBe('number');
    expect(typeof result.windSpeed).toBe('number');
    expect(typeof result.humidity).toBe('number');
    expect(typeof result.temperature).toBe('number');
    expect(typeof result.weatherCode).toBe('number');
    expect(typeof result.timestamp).toBe('number');
  });
});

describe('Unit: fetchWeather — timeout → fallback ke data terakhir dengan isStale: true', () => {
  it('saat fetch timeout, mengembalikan data terakhir dengan isStale: true — Validates: Requirements 2.4', async () => {
    vi.useFakeTimers();
    vi.resetModules();
    const { fetchWeather: fw } = await import('./weatherService');

    // First call succeeds to populate lastWeatherData
    const mockResponse = buildOpenMeteoResponse(1);
    vi.stubGlobal(
      'fetch',
      vi.fn()
        // First call: success
        .mockResolvedValueOnce({ ok: true, json: async () => mockResponse })
        // Second call: never resolves
        .mockImplementationOnce(
          (_url: string, opts: { signal: AbortSignal }) =>
            new Promise((_resolve, reject) => {
              opts.signal.addEventListener('abort', () =>
                reject(new DOMException('The operation was aborted.', 'AbortError'))
              );
            })
        )
    );

    // Populate lastWeatherData
    await fw(sampleLocation);

    // Second call
    const pendingFetch = fw(sampleLocation);
    vi.advanceTimersByTime(6000);
    const result = await pendingFetch;

    expect(result.isStale).toBe(true);
    expect(typeof result.rainfall).toBe('number');

    vi.useRealTimers();
  });
});

describe('Unit: fetchWeather — API error 4xx/5xx → fallback ke data terakhir', () => {
  it('saat API mengembalikan 4xx, mengembalikan data terakhir dengan isStale: true — Validates: Requirements 2.4', async () => {
    vi.resetModules();
    const { fetchWeather: fw } = await import('./weatherService');

    const mockResponse = buildOpenMeteoResponse(1);
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => mockResponse })
        .mockResolvedValueOnce({ ok: false, status: 404 })
    );

    await fw(sampleLocation);
    const result = await fw(sampleLocation);

    expect(result.isStale).toBe(true);
  });

  it('saat API mengembalikan 5xx, mengembalikan data terakhir dengan isStale: true — Validates: Requirements 2.4', async () => {
    vi.resetModules();
    const { fetchWeather: fw } = await import('./weatherService');

    const mockResponse = buildOpenMeteoResponse(1);
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => mockResponse })
        .mockResolvedValueOnce({ ok: false, status: 500 })
    );

    await fw(sampleLocation);
    const result = await fw(sampleLocation);

    expect(result.isStale).toBe(true);
  });

  it('saat tidak ada data sebelumnya dan API error, melempar error — Validates: Requirements 2.4', async () => {
    vi.resetModules();
    const { fetchWeather: fw } = await import('./weatherService');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 503 })
    );

    await expect(fw(sampleLocation)).rejects.toThrow('Open-Meteo API error: 503');
  });
});

describe('Unit: startPolling — polling interval', () => {
  it('memanggil fetchWeather sesuai interval yang ditentukan — Validates: Requirements 2.3', async () => {
    vi.useFakeTimers();
    vi.resetModules();
    const { startPolling: sp, stopPolling: stop } = await import('./weatherService');

    const mockResponse = buildOpenMeteoResponse(1);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });
    vi.stubGlobal('fetch', fetchMock);

    const intervalMs = 10 * 60 * 1000; 
    sp(sampleLocation, intervalMs);

    // No calls yet (interval hasn't fired)
    expect(fetchMock).not.toHaveBeenCalled();

    // Advance by one interval
    await vi.advanceTimersByTimeAsync(intervalMs);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Advance by two more intervals
    await vi.advanceTimersByTimeAsync(intervalMs * 2);
    expect(fetchMock).toHaveBeenCalledTimes(3);

    stop();
    vi.useRealTimers();
  });

  it('stopPolling menghentikan polling — Validates: Requirements 2.3', async () => {
    vi.useFakeTimers();
    vi.resetModules();
    const { startPolling: sp, stopPolling: stop } = await import('./weatherService');

    const mockResponse = buildOpenMeteoResponse(1);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });
    vi.stubGlobal('fetch', fetchMock);

    const intervalMs = 10 * 60 * 1000;
    sp(sampleLocation, intervalMs);

    await vi.advanceTimersByTimeAsync(intervalMs);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    stop();

    await vi.advanceTimersByTimeAsync(intervalMs * 3);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});
