import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import {
  validateCoordinates,
  getCurrentLocation,
  detectGPS,
  parseManualInput,
} from './locationService';
import { LocationData } from '../types';

// localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

const STORAGE_KEY = 'disastersense_last_location';

beforeEach(() => {
  localStorageMock.clear();
  vi.restoreAllMocks();
});

// validateCoordinates
describe('validateCoordinates', () => {
  it('returns true for valid coordinates', () => {
    expect(validateCoordinates(0, 0)).toBe(true);
    expect(validateCoordinates(-6.2, 106.8)).toBe(true);
    expect(validateCoordinates(90, 180)).toBe(true);
    expect(validateCoordinates(-90, -180)).toBe(true);
  });

  it('returns false when lat is out of range', () => {
    expect(validateCoordinates(91, 0)).toBe(false);
    expect(validateCoordinates(-91, 0)).toBe(false);
  });

  it('returns false when lon is out of range', () => {
    expect(validateCoordinates(0, 181)).toBe(false);
    expect(validateCoordinates(0, -181)).toBe(false);
  });

  it('returns false when both are out of range', () => {
    expect(validateCoordinates(100, 200)).toBe(false);
  });
});

// getCurrentLocation
describe('getCurrentLocation', () => {
  it('returns null when localStorage is empty', () => {
    expect(getCurrentLocation()).toBeNull();
  });

  it('returns parsed LocationData when stored', () => {
    const loc: LocationData = { lat: -6.2, lon: 106.8, cityName: 'Jakarta', source: 'gps' };
    localStorageMock.setItem(STORAGE_KEY, JSON.stringify(loc));
    expect(getCurrentLocation()).toEqual(loc);
  });

  it('returns null when stored value is invalid JSON', () => {
    localStorageMock.setItem(STORAGE_KEY, 'not-json');
    expect(getCurrentLocation()).toBeNull();
  });
});

// detectGPS
describe('detectGPS', () => {
  it('throws when geolocation is not supported', async () => {
    const original = globalThis.navigator;
    Object.defineProperty(globalThis, 'navigator', {
      value: { geolocation: undefined },
      configurable: true,
    });
    await expect(detectGPS()).rejects.toThrow('Geolocation tidak didukung');
    Object.defineProperty(globalThis, 'navigator', { value: original, configurable: true });
  });

  it('throws when GPS is denied', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        geolocation: {
          getCurrentPosition: (_: unknown, reject: (e: GeolocationPositionError) => void) => {
            reject({ code: 1, message: 'User denied', PERMISSION_DENIED: 1 } as GeolocationPositionError);
          },
        },
      },
      configurable: true,
    });

    await expect(detectGPS()).rejects.toBeDefined();
  });

  it('stores location in localStorage and returns LocationData with ≥4 decimal places', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        geolocation: {
          getCurrentPosition: (resolve: (p: GeolocationPosition) => void) => {
            resolve({
              coords: { latitude: -6.123456, longitude: 106.789012 },
            } as GeolocationPosition);
          },
        },
      },
      configurable: true,
    });

    // Mock fetch for reverse geocoding
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        address: { city: 'Jakarta' },
        display_name: 'Jakarta, Indonesia',
      }),
    }));

    const result = await detectGPS();

    expect(result.source).toBe('gps');
    expect(result.cityName).toBe('Jakarta');
    // Precision: at least 4 decimal places preserved
    expect(result.lat.toString()).toMatch(/\.\d{4,}/);
    expect(result.lon.toString()).toMatch(/\.\d{4,}/);

    // Stored in localStorage
    const stored = getCurrentLocation();
    expect(stored).toEqual(result);
  });
});

// parseManualInput
describe('parseManualInput', () => {
  it('returns null for empty input', async () => {
    expect(await parseManualInput('')).toBeNull();
    expect(await parseManualInput('   ')).toBeNull();
  });

  it('parses valid coordinate string', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ address: { city: 'Bandung' }, display_name: 'Bandung, Indonesia' }),
    }));

    const result = await parseManualInput('-6.9147, 107.6098');
    expect(result).not.toBeNull();
    expect(result!.lat).toBeCloseTo(-6.9147, 4);
    expect(result!.lon).toBeCloseTo(107.6098, 4);
    expect(result!.source).toBe('manual');
  });

  it('throws for out-of-range coordinates', async () => {
    await expect(parseManualInput('100, 200')).rejects.toThrow('Koordinat tidak valid');
  });

  it('resolves city name via Nominatim', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ lat: '-6.2', lon: '106.8', display_name: 'Jakarta, Indonesia' }],
    }));

    const result = await parseManualInput('Jakarta');
    expect(result).not.toBeNull();
    expect(result!.lat).toBeCloseTo(-6.2, 4);
    expect(result!.lon).toBeCloseTo(106.8, 4);
    expect(result!.cityName).toBe('Jakarta, Indonesia');
    expect(result!.source).toBe('manual');
  });

  it('throws when city name is not found', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    }));

    await expect(parseManualInput('XyzNonExistentCity123')).rejects.toThrow('tidak ditemukan');
  });

  it('saves result to localStorage', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ lat: '-6.2', lon: '106.8', display_name: 'Jakarta' }],
    }));

    const result = await parseManualInput('Jakarta');
    expect(getCurrentLocation()).toEqual(result);
  });
});

// Property-Based Tests

describe('Property 1: Presisi Koordinat GPS', () => {
  it('lat/lon dari GPS memiliki presisi minimal 4 digit desimal — Validates: Requirements 1.1', async () => {
    const coordWithPrecision = fc.tuple(
      fc.integer({ min: 1, max: 9 }),       
      fc.integer({ min: 0, max: 999 }),     
      fc.integer({ min: -89, max: 89 }),  
    ).map(([d4, d3, intPart]) => {
      const fraction = (d3 * 10 + d4) / 10000; 
      return intPart + (intPart >= 0 ? fraction : -fraction);
    });

    const lonWithPrecision = fc.tuple(
      fc.integer({ min: 1, max: 9 }),
      fc.integer({ min: 0, max: 999 }),
      fc.integer({ min: -179, max: 179 }),
    ).map(([d4, d3, intPart]) => {
      const fraction = (d3 * 10 + d4) / 10000;
      return intPart + (intPart >= 0 ? fraction : -fraction);
    });

    await fc.assert(
      fc.asyncProperty(
        coordWithPrecision,
        lonWithPrecision,
        async (lat, lon) => {
          Object.defineProperty(globalThis, 'navigator', {
            value: {
              geolocation: {
                getCurrentPosition: (resolve: (p: GeolocationPosition) => void) => {
                  resolve({
                    coords: { latitude: lat, longitude: lon },
                  } as GeolocationPosition);
                },
              },
            },
            configurable: true,
          });

          vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: false,
          }));

          const result = await detectGPS();

          const latStr = result.lat.toString();
          const lonStr = result.lon.toString();

          const latDecimals = latStr.includes('.') ? latStr.split('.')[1].length : 0;
          const lonDecimals = lonStr.includes('.') ? lonStr.split('.')[1].length : 0;

          return latDecimals >= 4 && lonDecimals >= 4;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 2: Validasi Rentang Koordinat', () => {
  it('accepts iff lat ∈ [-90,90] and lon ∈ [-180,180] — Validates: Requirements 1.3', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -200, max: 200, noNaN: true }),
        fc.double({ min: -400, max: 400, noNaN: true }),
        (lat, lon) => {
          const result = validateCoordinates(lat, lon);
          const expected = lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
          return result === expected;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('always returns true for valid coordinate pairs — Validates: Requirements 1.3', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -90, max: 90, noNaN: true }),
        fc.double({ min: -180, max: 180, noNaN: true }),
        (lat, lon) => {
          return validateCoordinates(lat, lon) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('always returns false when lat is out of range — Validates: Requirements 1.3', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.double({ min: 90.0001, max: 200, noNaN: true }),
          fc.double({ min: -200, max: -90.0001, noNaN: true })
        ),
        fc.double({ min: -180, max: 180, noNaN: true }),
        (lat, lon) => {
          return validateCoordinates(lat, lon) === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('always returns false when lon is out of range — Validates: Requirements 1.3', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -90, max: 90, noNaN: true }),
        fc.oneof(
          fc.double({ min: 180.0001, max: 400, noNaN: true }),
          fc.double({ min: -400, max: -180.0001, noNaN: true })
        ),
        (lat, lon) => {
          return validateCoordinates(lat, lon) === false;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 3: Input Tidak Valid Menghasilkan Error', () => {
  it('throws an error for out-of-range coordinate strings — Validates: Requirements 1.4', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          // lat out of range
          fc.tuple(
            fc.oneof(
              fc.double({ min: 90.1, max: 200, noNaN: true }),
              fc.double({ min: -200, max: -90.1, noNaN: true })
            ),
            fc.double({ min: -180, max: 180, noNaN: true })
          ),
          // lon out of range
          fc.tuple(
            fc.double({ min: -90, max: 90, noNaN: true }),
            fc.oneof(
              fc.double({ min: 180.1, max: 400, noNaN: true }),
              fc.double({ min: -400, max: -180.1, noNaN: true })
            )
          )
        ),
        async ([lat, lon]) => {
          const input = `${lat},${lon}`;
          try {
            await parseManualInput(input);
            return false; // should have thrown
          } catch (err) {
            return err instanceof Error && err.message.length > 0;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('throws an error for unrecognized city name strings — Validates: Requirements 1.4', async () => {
    // Mock fetch to simulate Nominatim returning no results
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    }));

    await fc.assert(
      fc.asyncProperty(
        // Generate strings that look like random garbage (not coordinate patterns)
        fc.stringMatching(/^[a-zA-Z]{10,20}[0-9]{3,5}$/),
        async (cityName) => {
          try {
            await parseManualInput(cityName);
            return false; // should have thrown
          } catch (err) {
            return err instanceof Error && err.message.length > 0;
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 4: Round-Trip Penyimpanan Lokasi', () => {
  it('getCurrentLocation() after save returns identical lat, lon, cityName — Validates: Requirements 1.5', () => {
    fc.assert(
      fc.property(
        fc.record({
          lat: fc.double({ min: -90, max: 90, noNaN: true }),
          lon: fc.double({ min: -180, max: 180, noNaN: true }),
          cityName: fc.string({ minLength: 1, maxLength: 50 }),
          source: fc.constantFrom('gps' as const, 'manual' as const),
        }),
        (locationData: LocationData) => {
          // Save directly via localStorage
          localStorage.setItem('disastersense_last_location', JSON.stringify(locationData));

          const retrieved = getCurrentLocation();
          return (
            retrieved !== null &&
            retrieved.lat === locationData.lat &&
            retrieved.lon === locationData.lon &&
            retrieved.cityName === locationData.cityName
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
