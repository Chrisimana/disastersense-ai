import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { calculate, getRecommendations, getLastResult } from './riskEngine';
import type { WeatherData } from '../types';

// Helper to build a valid WeatherData object
function makeWeather(rainfall: number, windSpeed: number): WeatherData {
  return {
    rainfall,
    windSpeed,
    humidity: 80,
    temperature: 28,
    weatherCode: 0,
    timestamp: Date.now(),
    isStale: false,
  };
}

// Reset lastResult between tests by calling calculate with null
beforeEach(() => {
  // Force-reset module state by calling with null (returns stale default)
  calculate(null);
});

// Property-Based Tests

describe('Property 6: Klasifikasi Risiko Sesuai Aturan', () => {

  it('status Aman iff rainfall < 10 AND windSpeed < 40 — Validates: Requirements 3.1, 3.2', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 9.9999, noNaN: true }),
        fc.double({ min: 0, max: 39.9999, noNaN: true }),
        (rainfall, windSpeed) => {
          const result = calculate(makeWeather(rainfall, windSpeed));
          return result.status === 'Aman';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('status Bahaya when rainfall > 50 — Validates: Requirements 3.1, 3.2', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 50.0001, max: 500, noNaN: true }),
        fc.double({ min: 0, max: 200, noNaN: true }),
        (rainfall, windSpeed) => {
          const result = calculate(makeWeather(rainfall, windSpeed));
          return result.status === 'Bahaya';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('status Bahaya when windSpeed > 70 — Validates: Requirements 3.1, 3.2', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 200, noNaN: true }),
        fc.double({ min: 70.0001, max: 500, noNaN: true }),
        (rainfall, windSpeed) => {
          const result = calculate(makeWeather(rainfall, windSpeed));
          return result.status === 'Bahaya';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('status Waspada when rainfall in [10,50] and windSpeed < 40 — Validates: Requirements 3.1, 3.2', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 10, max: 50, noNaN: true }),
        fc.double({ min: 0, max: 39.9999, noNaN: true }),
        (rainfall, windSpeed) => {
          const result = calculate(makeWeather(rainfall, windSpeed));
          return result.status === 'Waspada';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('status Waspada when windSpeed in [40,70] and rainfall < 10 — Validates: Requirements 3.1, 3.2', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 9.9999, noNaN: true }),
        fc.double({ min: 40, max: 70, noNaN: true }),
        (rainfall, windSpeed) => {
          const result = calculate(makeWeather(rainfall, windSpeed));
          return result.status === 'Waspada';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('always produces exactly one of Aman/Waspada/Bahaya — Validates: Requirements 3.2', () => {
    const validStatuses = new Set(['Aman', 'Waspada', 'Bahaya']);
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 500, noNaN: true }),
        fc.double({ min: 0, max: 500, noNaN: true }),
        (rainfall, windSpeed) => {
          const result = calculate(makeWeather(rainfall, windSpeed));
          return validStatuses.has(result.status);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Bahaya takes priority over Waspada when both conditions met — Validates: Requirements 3.1', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 50.0001, max: 500, noNaN: true }),
        fc.double({ min: 40, max: 70, noNaN: true }),
        (rainfall, windSpeed) => {
          const result = calculate(makeWeather(rainfall, windSpeed));
          return result.status === 'Bahaya';
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 7: Faktor Pemicu Selalu Disertakan', () => {

  it('triggeringFactors.length >= 1 when status is Waspada (rainfall in [10,50], windSpeed < 40)', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 10, max: 50, noNaN: true }),
        fc.double({ min: 0, max: 39.9999, noNaN: true }),
        (rainfall, windSpeed) => {
          const result = calculate(makeWeather(rainfall, windSpeed));
          return result.status === 'Waspada' && result.triggeringFactors.length >= 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('triggeringFactors.length >= 1 when status is Waspada (windSpeed in [40,70], rainfall < 10)', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 9.9999, noNaN: true }),
        fc.double({ min: 40, max: 70, noNaN: true }),
        (rainfall, windSpeed) => {
          const result = calculate(makeWeather(rainfall, windSpeed));
          return result.status === 'Waspada' && result.triggeringFactors.length >= 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('triggeringFactors.length >= 1 when status is Bahaya (rainfall > 50)', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 50.0001, max: 500, noNaN: true }),
        fc.double({ min: 0, max: 39.9999, noNaN: true }),
        (rainfall, windSpeed) => {
          const result = calculate(makeWeather(rainfall, windSpeed));
          return result.status === 'Bahaya' && result.triggeringFactors.length >= 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('triggeringFactors.length >= 1 when status is Bahaya (windSpeed > 70)', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 9.9999, noNaN: true }),
        fc.double({ min: 70.0001, max: 500, noNaN: true }),
        (rainfall, windSpeed) => {
          const result = calculate(makeWeather(rainfall, windSpeed));
          return result.status === 'Bahaya' && result.triggeringFactors.length >= 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('triggeringFactors.length >= 1 for any Waspada/Bahaya status across all valid inputs', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 500, noNaN: true }),
        fc.double({ min: 0, max: 500, noNaN: true }),
        (rainfall, windSpeed) => {
          const result = calculate(makeWeather(rainfall, windSpeed));
          if (result.status === 'Waspada' || result.status === 'Bahaya') {
            return result.triggeringFactors.length >= 1;
          }
          return true; // Aman has no triggering factors — that's expected
        }
      ),
      { numRuns: 100 }
    );
  });

  it('triggeringFactors is empty when status is Aman', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 9.9999, noNaN: true }),
        fc.double({ min: 0, max: 39.9999, noNaN: true }),
        (rainfall, windSpeed) => {
          const result = calculate(makeWeather(rainfall, windSpeed));
          return result.status === 'Aman' && result.triggeringFactors.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 8: Pertahanan Status Saat Data Tidak Lengkap', () => {

  it('calculate(null) after valid calculation returns isStale: true with same status — Validates: Requirements 3.5', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          makeWeather(0, 0),       // Aman
          makeWeather(20, 0),      // Waspada
          makeWeather(60, 0),      // Bahaya
        ),
        (priorWeather) => {
          const priorResult = calculate(priorWeather);
          const staleResult = calculate(null);
          return staleResult.isStale === true && staleResult.status === priorResult.status;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('calculate(undefined) after valid calculation returns isStale: true with same status — Validates: Requirements 3.5', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          makeWeather(0, 0),       // Aman
          makeWeather(20, 0),      // Waspada
          makeWeather(60, 0),      // Bahaya
        ),
        (priorWeather) => {
          const priorResult = calculate(priorWeather);
          const staleResult = calculate(undefined);
          return staleResult.isStale === true && staleResult.status === priorResult.status;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('calculate with rainfall=null returns isStale: true — Validates: Requirements 3.5', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          makeWeather(0, 0),
          makeWeather(20, 0),
          makeWeather(60, 0),
        ),
        fc.double({ min: 0, max: 200, noNaN: true }),
        (priorWeather, windSpeed) => {
          calculate(priorWeather);
          const incompleteWeather = { ...makeWeather(0, windSpeed), rainfall: null as unknown as number };
          const staleResult = calculate(incompleteWeather);
          return staleResult.isStale === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('calculate with windSpeed=null returns isStale: true — Validates: Requirements 3.5', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          makeWeather(0, 0),
          makeWeather(20, 0),
          makeWeather(60, 0),
        ),
        fc.double({ min: 0, max: 200, noNaN: true }),
        (priorWeather, rainfall) => {
          calculate(priorWeather);
          const incompleteWeather = { ...makeWeather(rainfall, 0), windSpeed: null as unknown as number };
          const staleResult = calculate(incompleteWeather);
          return staleResult.isStale === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('for any valid prior status, calculate(null) preserves that status with isStale: true — Validates: Requirements 3.5', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<[number, number]>(
          [0, 0],       // Aman
          [20, 0],      // Waspada
          [0, 50],      // Waspada
          [60, 0],      // Bahaya
          [0, 80],      // Bahaya
        ),
        ([rainfall, windSpeed]) => {
          const priorResult = calculate(makeWeather(rainfall, windSpeed));
          const staleResult = calculate(null);
          return staleResult.isStale === true && staleResult.status === priorResult.status;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Unit Tests

describe('calculate — boundary conditions', () => {
  // Tepat di batas bawah Waspada
  it('rainfall tepat 10 mm/jam → Waspada', () => {
    const result = calculate(makeWeather(10, 0));
    expect(result.status).toBe('Waspada');
  });

  it('rainfall tepat 50 mm/jam → Waspada', () => {
    const result = calculate(makeWeather(50, 0));
    expect(result.status).toBe('Waspada');
  });

  it('windSpeed tepat 40 km/jam → Waspada', () => {
    const result = calculate(makeWeather(0, 40));
    expect(result.status).toBe('Waspada');
  });

  it('windSpeed tepat 70 km/jam → Waspada', () => {
    const result = calculate(makeWeather(0, 70));
    expect(result.status).toBe('Waspada');
  });

  // Tepat di bawah batas Waspada → Aman
  it('rainfall 9.9999 dan windSpeed 39.9999 → Aman', () => {
    expect(calculate(makeWeather(9.9999, 39.9999)).status).toBe('Aman');
  });

  // Tepat di atas batas Waspada → Bahaya
  it('rainfall 50.0001 mm/jam → Bahaya', () => {
    expect(calculate(makeWeather(50.0001, 0)).status).toBe('Bahaya');
  });

  it('windSpeed 70.0001 km/jam → Bahaya', () => {
    expect(calculate(makeWeather(0, 70.0001)).status).toBe('Bahaya');
  });
});

describe('calculate — kombinasi rainfall + windSpeed menghasilkan ketiga status', () => {
  // Status Aman
  it('rainfall=0, windSpeed=0 → Aman', () => {
    const result = calculate(makeWeather(0, 0));
    expect(result.status).toBe('Aman');
    expect(result.triggeringFactors).toHaveLength(0);
  });

  it('rainfall=5, windSpeed=20 → Aman', () => {
    expect(calculate(makeWeather(5, 20)).status).toBe('Aman');
  });

  it('rainfall=9.9, windSpeed=39.9 → Aman', () => {
    expect(calculate(makeWeather(9.9, 39.9)).status).toBe('Aman');
  });

  // Status Waspada
  it('rainfall=10, windSpeed=0 → Waspada (dipicu rainfall)', () => {
    const result = calculate(makeWeather(10, 0));
    expect(result.status).toBe('Waspada');
    expect(result.triggeringFactors.some(f => f.includes('hujan'))).toBe(true);
  });

  it('rainfall=30, windSpeed=0 → Waspada (dipicu rainfall)', () => {
    const result = calculate(makeWeather(30, 0));
    expect(result.status).toBe('Waspada');
    expect(result.triggeringFactors.length).toBeGreaterThanOrEqual(1);
  });

  // Status Waspada
  it('rainfall=0, windSpeed=40 → Waspada (dipicu windSpeed)', () => {
    const result = calculate(makeWeather(0, 40));
    expect(result.status).toBe('Waspada');
    expect(result.triggeringFactors.some(f => f.includes('angin'))).toBe(true);
  });

  it('rainfall=0, windSpeed=55 → Waspada (dipicu windSpeed)', () => {
    const result = calculate(makeWeather(0, 55));
    expect(result.status).toBe('Waspada');
    expect(result.triggeringFactors.length).toBeGreaterThanOrEqual(1);
  });

  // Status Waspada 
  it('rainfall=25, windSpeed=50 → Waspada (dipicu keduanya)', () => {
    const result = calculate(makeWeather(25, 50));
    expect(result.status).toBe('Waspada');
    expect(result.triggeringFactors.length).toBe(2);
  });

  // Status Bahaya
  it('rainfall=51, windSpeed=0 → Bahaya (dipicu rainfall)', () => {
    const result = calculate(makeWeather(51, 0));
    expect(result.status).toBe('Bahaya');
    expect(result.triggeringFactors.some(f => f.includes('hujan'))).toBe(true);
  });

  it('rainfall=100, windSpeed=0 → Bahaya (dipicu rainfall)', () => {
    expect(calculate(makeWeather(100, 0)).status).toBe('Bahaya');
  });

  // Status Bahaya
  it('rainfall=0, windSpeed=71 → Bahaya (dipicu windSpeed)', () => {
    const result = calculate(makeWeather(0, 71));
    expect(result.status).toBe('Bahaya');
    expect(result.triggeringFactors.some(f => f.includes('angin'))).toBe(true);
  });

  it('rainfall=0, windSpeed=150 → Bahaya (dipicu windSpeed)', () => {
    expect(calculate(makeWeather(0, 150)).status).toBe('Bahaya');
  });

  // Status Bahaya
  it('rainfall=80, windSpeed=90 → Bahaya (dipicu keduanya)', () => {
    const result = calculate(makeWeather(80, 90));
    expect(result.status).toBe('Bahaya');
    expect(result.triggeringFactors.length).toBe(2);
  });

  // Prioritas
  it('rainfall=60 (Bahaya) + windSpeed=50 (Waspada) → Bahaya', () => {
    expect(calculate(makeWeather(60, 50)).status).toBe('Bahaya');
  });

  it('rainfall=25 (Waspada) + windSpeed=80 (Bahaya) → Bahaya', () => {
    expect(calculate(makeWeather(25, 80)).status).toBe('Bahaya');
  });
});

describe('calculate — data tidak lengkap → isStale: true', () => {
  it('returns isStale: true when weather is null', () => {
    const result = calculate(null);
    expect(result.isStale).toBe(true);
  });

  it('returns isStale: true when weather is undefined', () => {
    const result = calculate(undefined);
    expect(result.isStale).toBe(true);
  });

  it('mempertahankan status Aman terakhir saat data null', () => {
    calculate(makeWeather(0, 0)); // set lastResult = Aman
    const stale = calculate(null);
    expect(stale.status).toBe('Aman');
    expect(stale.isStale).toBe(true);
  });

  it('mempertahankan status Waspada terakhir saat data null', () => {
    calculate(makeWeather(20, 0)); // set lastResult = Waspada
    const stale = calculate(null);
    expect(stale.status).toBe('Waspada');
    expect(stale.isStale).toBe(true);
  });

  it('mempertahankan status Bahaya terakhir saat data null', () => {
    calculate(makeWeather(60, 0)); // set lastResult = Bahaya
    const stale = calculate(null);
    expect(stale.status).toBe('Bahaya');
    expect(stale.isStale).toBe(true);
  });

  it('returns isStale: true when rainfall is null', () => {
    calculate(makeWeather(30, 0)); // set lastResult
    const incomplete = { ...makeWeather(0, 20), rainfall: null as unknown as number };
    const result = calculate(incomplete);
    expect(result.isStale).toBe(true);
  });

  it('returns isStale: true when windSpeed is null', () => {
    calculate(makeWeather(30, 0)); // set lastResult
    const incomplete = { ...makeWeather(20, 0), windSpeed: null as unknown as number };
    const result = calculate(incomplete);
    expect(result.isStale).toBe(true);
  });

  it('isStale: false untuk data cuaca yang valid', () => {
    const result = calculate(makeWeather(5, 10));
    expect(result.isStale).toBe(false);
  });
});

describe('Property 14: Jumlah Minimum Rekomendasi Per Status', () => {

  it('getRecommendations returns >= 1 item for Aman — Validates: Requirements 7.1', () => {
    fc.assert(
      fc.property(fc.constant('Aman' as const), (status) => {
        return getRecommendations(status).length >= 1;
      }),
      { numRuns: 100 }
    );
  });

  it('getRecommendations returns >= 3 items for Waspada — Validates: Requirements 7.2', () => {
    fc.assert(
      fc.property(fc.constant('Waspada' as const), (status) => {
        return getRecommendations(status).length >= 3;
      }),
      { numRuns: 100 }
    );
  });

  it('getRecommendations returns >= 5 items for Bahaya — Validates: Requirements 7.3', () => {
    fc.assert(
      fc.property(fc.constant('Bahaya' as const), (status) => {
        return getRecommendations(status).length >= 5;
      }),
      { numRuns: 100 }
    );
  });

  it('minimum counts hold for all RiskStatus values — Validates: Requirements 7.1, 7.2, 7.3', () => {
    const minCounts: Record<string, number> = { Aman: 1, Waspada: 3, Bahaya: 5 };
    fc.assert(
      fc.property(fc.constantFrom('Aman' as const, 'Waspada' as const, 'Bahaya' as const), (status) => {
        return getRecommendations(status).length >= minCounts[status];
      }),
      { numRuns: 100 }
    );
  });

  it('calculate result recommendations meet minimum counts for each status — Validates: Requirements 7.1, 7.2, 7.3', () => {
    const minCounts: Record<string, number> = { Aman: 1, Waspada: 3, Bahaya: 5 };
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 500, noNaN: true }),
        fc.double({ min: 0, max: 500, noNaN: true }),
        (rainfall, windSpeed) => {
          const result = calculate(makeWeather(rainfall, windSpeed));
          return result.recommendations.length >= minCounts[result.status];
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('getRecommendations', () => {
  it('returns at least 1 item for Aman', () => {
    expect(getRecommendations('Aman').length).toBeGreaterThanOrEqual(1);
  });

  it('returns at least 3 items for Waspada', () => {
    expect(getRecommendations('Waspada').length).toBeGreaterThanOrEqual(3);
  });

  it('returns at least 5 items for Bahaya', () => {
    expect(getRecommendations('Bahaya').length).toBeGreaterThanOrEqual(5);
  });

  it('setiap item rekomendasi adalah string tidak kosong', () => {
    (['Aman', 'Waspada', 'Bahaya'] as const).forEach(status => {
      getRecommendations(status).forEach(rec => {
        expect(typeof rec).toBe('string');
        expect(rec.length).toBeGreaterThan(0);
      });
    });
  });
});

describe('getLastResult', () => {
  it('returns the most recent calculation result', () => {
    calculate(makeWeather(60, 0));
    const last = getLastResult();
    expect(last).not.toBeNull();
    expect(last!.status).toBe('Bahaya');
  });

  it('updates after each calculate call', () => {
    calculate(makeWeather(5, 5));   // Aman
    expect(getLastResult()!.status).toBe('Aman');

    calculate(makeWeather(20, 0));  // Waspada
    expect(getLastResult()!.status).toBe('Waspada');

    calculate(makeWeather(60, 0));  // Bahaya
    expect(getLastResult()!.status).toBe('Bahaya');
  });

  it('tidak diupdate saat input null (tetap hasil terakhir yang valid)', () => {
    calculate(makeWeather(20, 0));  // Waspada
    calculate(null);                // stale
    expect(getLastResult()!.status).toBe('Waspada');
  });
});
