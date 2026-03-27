import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  checkAndAlert,
  requestBrowserPermission,
  sendBrowserNotification,
  getAlertHistory,
  clearHistory,
} from './notificationService';
import type { RiskResult, WeatherData } from '../types';

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
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

// helpers
const mockWeather: WeatherData = {
  rainfall: 20,
  windSpeed: 45,
  humidity: 80,
  temperature: 28,
  weatherCode: 61,
  timestamp: Date.now(),
  isStale: false,
};

function makeRisk(status: 'Aman' | 'Waspada' | 'Bahaya'): RiskResult {
  return {
    status,
    triggeringFactors: [],
    recommendations: [],
    calculatedAt: Date.now(),
    isStale: false,
  };
}

beforeEach(() => {
  localStorageMock.clear();
  vi.restoreAllMocks();
});

// checkAndAlert
describe('checkAndAlert', () => {
  it('returns null when status stays the same', () => {
    const result = checkAndAlert(makeRisk('Waspada'), makeRisk('Waspada'), 'Jakarta', mockWeather);
    expect(result).toBeNull();
  });

  it('returns null when status decreases (Bahaya → Waspada)', () => {
    const result = checkAndAlert(makeRisk('Bahaya'), makeRisk('Waspada'), 'Jakarta', mockWeather);
    expect(result).toBeNull();
  });

  it('returns null when status decreases (Waspada → Aman)', () => {
    const result = checkAndAlert(makeRisk('Waspada'), makeRisk('Aman'), 'Jakarta', mockWeather);
    expect(result).toBeNull();
  });

  it('creates alert when status escalates Aman → Waspada', () => {
    const alert = checkAndAlert(makeRisk('Aman'), makeRisk('Waspada'), 'Bandung', mockWeather);
    expect(alert).not.toBeNull();
    expect(alert!.previousStatus).toBe('Aman');
    expect(alert!.newStatus).toBe('Waspada');
    expect(alert!.location).toBe('Bandung');
  });

  it('creates alert when status escalates Waspada → Bahaya', () => {
    const alert = checkAndAlert(makeRisk('Waspada'), makeRisk('Bahaya'), 'Surabaya', mockWeather);
    expect(alert).not.toBeNull();
    expect(alert!.previousStatus).toBe('Waspada');
    expect(alert!.newStatus).toBe('Bahaya');
  });

  it('creates alert when status escalates Aman → Bahaya', () => {
    const alert = checkAndAlert(makeRisk('Aman'), makeRisk('Bahaya'), 'Medan', mockWeather);
    expect(alert).not.toBeNull();
    expect(alert!.previousStatus).toBe('Aman');
    expect(alert!.newStatus).toBe('Bahaya');
  });

  it('creates alert when previous is null and current is Waspada', () => {
    const alert = checkAndAlert(null, makeRisk('Waspada'), 'Bali', mockWeather);
    expect(alert).not.toBeNull();
    expect(alert!.previousStatus).toBe('Aman');
    expect(alert!.newStatus).toBe('Waspada');
  });

  it('returns null when previous is null and current is Aman', () => {
    const result = checkAndAlert(null, makeRisk('Aman'), 'Bali', mockWeather);
    expect(result).toBeNull();
  });

  it('persists alert to localStorage', () => {
    checkAndAlert(makeRisk('Aman'), makeRisk('Bahaya'), 'Jakarta', mockWeather);
    const stored = JSON.parse(localStorageMock.getItem('disastersense_alerts')!);
    expect(stored).toHaveLength(1);
    expect(stored[0].newStatus).toBe('Bahaya');
  });

  it('alert has id and timestamp', () => {
    const alert = checkAndAlert(makeRisk('Aman'), makeRisk('Waspada'), 'Jakarta', mockWeather);
    expect(alert!.id).toBeTruthy();
    expect(alert!.timestamp).toBeGreaterThan(0);
  });

  it('accumulates multiple alerts', () => {
    checkAndAlert(makeRisk('Aman'), makeRisk('Waspada'), 'Jakarta', mockWeather);
    checkAndAlert(makeRisk('Waspada'), makeRisk('Bahaya'), 'Jakarta', mockWeather);
    const stored = JSON.parse(localStorageMock.getItem('disastersense_alerts')!);
    expect(stored).toHaveLength(2);
  });
});

// getAlertHistory
describe('getAlertHistory', () => {
  it('returns empty array when no alerts', () => {
    expect(getAlertHistory()).toEqual([]);
  });

  it('returns alerts sorted descending by timestamp', () => {
    const alerts = [
      { id: '1', timestamp: 1000, location: 'A', previousStatus: 'Aman', newStatus: 'Waspada', weatherSnapshot: mockWeather },
      { id: '2', timestamp: 3000, location: 'B', previousStatus: 'Waspada', newStatus: 'Bahaya', weatherSnapshot: mockWeather },
      { id: '3', timestamp: 2000, location: 'C', previousStatus: 'Aman', newStatus: 'Bahaya', weatherSnapshot: mockWeather },
    ];
    localStorageMock.setItem('disastersense_alerts', JSON.stringify(alerts));

    const history = getAlertHistory();
    expect(history[0].timestamp).toBe(3000);
    expect(history[1].timestamp).toBe(2000);
    expect(history[2].timestamp).toBe(1000);
  });
});

// clearHistory
describe('clearHistory', () => {
  it('removes all alerts from localStorage', () => {
    checkAndAlert(makeRisk('Aman'), makeRisk('Bahaya'), 'Jakarta', mockWeather);
    clearHistory();
    expect(localStorageMock.getItem('disastersense_alerts')).toBeNull();
    expect(getAlertHistory()).toEqual([]);
  });
});

// requestBrowserPermission
describe('requestBrowserPermission', () => {
  it('returns denied when Notification API is not available', async () => {
    const original = (globalThis as any).Notification;
    delete (globalThis as any).Notification;
    const result = await requestBrowserPermission();
    expect(result).toBe('denied');
    if (original) (globalThis as any).Notification = original;
  });

  it('calls Notification.requestPermission when available', async () => {
    const mockRequestPermission = vi.fn().mockResolvedValue('granted');
    Object.defineProperty(globalThis, 'Notification', {
      value: { requestPermission: mockRequestPermission },
      configurable: true,
      writable: true,
    });
    const result = await requestBrowserPermission();
    expect(mockRequestPermission).toHaveBeenCalled();
    expect(result).toBe('granted');
  });
});

// sendBrowserNotification
describe('sendBrowserNotification', () => {
  const mockAlert = {
    id: 'test-1',
    timestamp: Date.now(),
    location: 'Jakarta',
    previousStatus: 'Aman' as const,
    newStatus: 'Bahaya' as const,
    weatherSnapshot: mockWeather,
  };

  it('does nothing when Notification API is not available', () => {
    const original = (globalThis as any).Notification;
    delete (globalThis as any).Notification;
    expect(() => sendBrowserNotification(mockAlert)).not.toThrow();
    if (original) (globalThis as any).Notification = original;
  });

  it('does nothing when permission is not granted', () => {
    const MockNotification = vi.fn();
    (MockNotification as any).permission = 'denied';
    Object.defineProperty(globalThis, 'Notification', {
      value: MockNotification,
      configurable: true,
      writable: true,
    });
    sendBrowserNotification(mockAlert);
    expect(MockNotification).not.toHaveBeenCalled();
  });

  it('sends notification when permission is granted', () => {
    const MockNotification = vi.fn();
    (MockNotification as any).permission = 'granted';
    Object.defineProperty(globalThis, 'Notification', {
      value: MockNotification,
      configurable: true,
      writable: true,
    });
    sendBrowserNotification(mockAlert);
    expect(MockNotification).toHaveBeenCalledWith(
      expect.stringContaining('Bahaya'),
      expect.objectContaining({ body: expect.stringContaining('Jakarta') })
    );
  });
});

// Property-Based Tests
import * as fc from 'fast-check';

describe('Property 11: Entri Peringatan Dibuat Saat Status Meningkat', () => {

  const STATUS_ORDER: Record<'Aman' | 'Waspada' | 'Bahaya', number> = {
    Aman: 0,
    Waspada: 1,
    Bahaya: 2,
  };

  const riskStatusArb = fc.constantFrom('Aman' as const, 'Waspada' as const, 'Bahaya' as const);

  const weatherArb = fc.record({
    rainfall: fc.float({ min: 0, max: 200, noNaN: true }),
    windSpeed: fc.float({ min: 0, max: 200, noNaN: true }),
    humidity: fc.float({ min: 0, max: 100, noNaN: true }),
    temperature: fc.float({ min: -20, max: 50, noNaN: true }),
    weatherCode: fc.integer({ min: 0, max: 99 }),
    timestamp: fc.integer({ min: 1000000000000, max: 9999999999999 }),
    isStale: fc.boolean(),
  });

  function makeRiskResult(status: 'Aman' | 'Waspada' | 'Bahaya'): RiskResult {
    return {
      status,
      triggeringFactors: [],
      recommendations: [],
      calculatedAt: Date.now(),
      isStale: false,
    };
  }

  beforeEach(() => {
    localStorageMock.clear();
  });

  it('checkAndAlert mengembalikan AlertEntry iff status_baru > status_sebelumnya', () => {
    fc.assert(
      fc.property(
        riskStatusArb,
        riskStatusArb,
        fc.string({ minLength: 1, maxLength: 50 }),
        weatherArb,
        (prevStatus, currStatus, location, weather) => {
          localStorageMock.clear();

          const previous = makeRiskResult(prevStatus);
          const current = makeRiskResult(currStatus);
          const result = checkAndAlert(previous, current, location, weather);

          const isEscalation = STATUS_ORDER[currStatus] > STATUS_ORDER[prevStatus];

          if (isEscalation) {
            // Harus mengembalikan AlertEntry
            if (result === null) return false;
            // Verifikasi field yang benar
            if (result.previousStatus !== prevStatus) return false;
            if (result.newStatus !== currStatus) return false;
            if (result.location !== location) return false;
            if (typeof result.timestamp !== 'number' || result.timestamp <= 0) return false;
          } else {
            // Harus mengembalikan null
            if (result !== null) return false;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('checkAndAlert mengembalikan null ketika status tidak meningkat (sama atau turun)', () => {
    fc.assert(
      fc.property(
        riskStatusArb,
        riskStatusArb,
        fc.string({ minLength: 1, maxLength: 50 }),
        weatherArb,
        (prevStatus, currStatus, location, weather) => {
          localStorageMock.clear();

          // Hanya uji kasus di mana status tidak meningkat
          fc.pre(STATUS_ORDER[currStatus] <= STATUS_ORDER[prevStatus]);

          const previous = makeRiskResult(prevStatus);
          const current = makeRiskResult(currStatus);
          const result = checkAndAlert(previous, current, location, weather);

          return result === null;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('AlertEntry yang dikembalikan memiliki field timestamp, location, previousStatus, newStatus yang benar', () => {
    // Hanya uji pasangan yang meningkat
    const escalatingPairs = fc.constantFrom(
      ['Aman', 'Waspada'] as const,
      ['Aman', 'Bahaya'] as const,
      ['Waspada', 'Bahaya'] as const,
    );

    fc.assert(
      fc.property(
        escalatingPairs,
        fc.string({ minLength: 1, maxLength: 50 }),
        weatherArb,
        ([prevStatus, currStatus], location, weather) => {
          localStorageMock.clear();

          const before = Date.now();
          const previous = makeRiskResult(prevStatus);
          const current = makeRiskResult(currStatus);
          const alert = checkAndAlert(previous, current, location, weather);
          const after = Date.now();

          if (alert === null) return false;

          // timestamp harus dalam rentang waktu pemanggilan
          if (alert.timestamp < before || alert.timestamp > after) return false;
          // location harus sesuai
          if (alert.location !== location) return false;
          // previousStatus harus sesuai
          if (alert.previousStatus !== prevStatus) return false;
          // newStatus harus sesuai
          if (alert.newStatus !== currStatus) return false;

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 16: Browser Notification Dikirim Saat Izin Diberikan', () => {

  const alertArb = fc.record({
    id: fc.string({ minLength: 1, maxLength: 20 }),
    timestamp: fc.integer({ min: 1000000000000, max: 9999999999999 }),
    location: fc.string({ minLength: 1, maxLength: 50 }),
    previousStatus: fc.constantFrom('Aman' as const, 'Waspada' as const, 'Bahaya' as const),
    newStatus: fc.constantFrom('Aman' as const, 'Waspada' as const, 'Bahaya' as const),
    weatherSnapshot: fc.record({
      rainfall: fc.float({ min: 0, max: 200, noNaN: true }),
      windSpeed: fc.float({ min: 0, max: 200, noNaN: true }),
      humidity: fc.float({ min: 0, max: 100, noNaN: true }),
      temperature: fc.float({ min: -20, max: 50, noNaN: true }),
      weatherCode: fc.integer({ min: 0, max: 99 }),
      timestamp: fc.integer({ min: 1000000000000, max: 9999999999999 }),
      isStale: fc.boolean(),
    }),
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sendBrowserNotification dipanggil (new Notification) iff permission === granted', () => {
    fc.assert(
      fc.property(
        alertArb,
        fc.constantFrom('granted' as NotificationPermission, 'denied' as NotificationPermission, 'default' as NotificationPermission),
        (alert, permission) => {
          const MockNotification = vi.fn();
          (MockNotification as any).permission = permission;
          Object.defineProperty(globalThis, 'Notification', {
            value: MockNotification,
            configurable: true,
            writable: true,
          });

          sendBrowserNotification(alert);

          if (permission === 'granted') {
            // Notification constructor must have been called exactly once
            return MockNotification.mock.calls.length === 1;
          } else {
            // Notification constructor must NOT have been called
            return MockNotification.mock.calls.length === 0;
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 12: Round-Trip Penyimpanan Riwayat Peringatan', () => {

  const riskStatusArb = fc.constantFrom('Aman' as const, 'Waspada' as const, 'Bahaya' as const);

  const alertEntryArb = fc.record({
    id: fc.string({ minLength: 1, maxLength: 20 }),
    timestamp: fc.integer({ min: 1000000000000, max: 9999999999999 }),
    location: fc.string({ minLength: 1, maxLength: 50 }),
    previousStatus: riskStatusArb,
    newStatus: riskStatusArb,
    weatherSnapshot: fc.record({
      rainfall: fc.float({ min: 0, max: 200, noNaN: true }),
      windSpeed: fc.float({ min: 0, max: 200, noNaN: true }),
      humidity: fc.float({ min: 0, max: 100, noNaN: true }),
      temperature: fc.float({ min: -20, max: 50, noNaN: true }),
      weatherCode: fc.integer({ min: 0, max: 99 }),
      timestamp: fc.integer({ min: 1000000000000, max: 9999999999999 }),
      isStale: fc.boolean(),
    }),
  });

  beforeEach(() => {
    localStorageMock.clear();
  });

  it('semua AlertEntry yang disimpan dapat diambil kembali via getAlertHistory()', () => {
    fc.assert(
      fc.property(
        fc.array(alertEntryArb, { minLength: 1, maxLength: 20 }),
        (entries) => {
          localStorageMock.clear();

          // Simpan semua entri langsung ke localStorage (simulasi penyimpanan)
          localStorageMock.setItem('disastersense_alerts', JSON.stringify(entries));

          const history = getAlertHistory();

          // Semua entri harus dapat diambil kembali
          if (history.length !== entries.length) return false;

          const historyIds = new Set(history.map((a) => a.id));
          for (const entry of entries) {
            if (!historyIds.has(entry.id)) return false;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('getAlertHistory() mengembalikan array kosong saat tidak ada entri tersimpan', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        localStorageMock.clear();
        return getAlertHistory().length === 0;
      }),
      { numRuns: 10 }
    );
  });

  it('setiap field AlertEntry tetap identik setelah round-trip localStorage', () => {
    fc.assert(
      fc.property(
        alertEntryArb,
        (entry) => {
          localStorageMock.clear();
          localStorageMock.setItem('disastersense_alerts', JSON.stringify([entry]));

          const [retrieved] = getAlertHistory();

          return (
            retrieved.id === entry.id &&
            retrieved.timestamp === entry.timestamp &&
            retrieved.location === entry.location &&
            retrieved.previousStatus === entry.previousStatus &&
            retrieved.newStatus === entry.newStatus
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 13: Urutan Riwayat Descending', () => {

  const riskStatusArb = fc.constantFrom('Aman' as const, 'Waspada' as const, 'Bahaya' as const);

  const alertEntryArb = fc.record({
    id: fc.uuid(),
    timestamp: fc.integer({ min: 1000000000000, max: 9999999999999 }),
    location: fc.string({ minLength: 1, maxLength: 50 }),
    previousStatus: riskStatusArb,
    newStatus: riskStatusArb,
    weatherSnapshot: fc.record({
      rainfall: fc.float({ min: 0, max: 200, noNaN: true }),
      windSpeed: fc.float({ min: 0, max: 200, noNaN: true }),
      humidity: fc.float({ min: 0, max: 100, noNaN: true }),
      temperature: fc.float({ min: -20, max: 50, noNaN: true }),
      weatherCode: fc.integer({ min: 0, max: 99 }),
      timestamp: fc.integer({ min: 1000000000000, max: 9999999999999 }),
      isStale: fc.boolean(),
    }),
  });

  beforeEach(() => {
    localStorageMock.clear();
  });

  it('alerts[i].timestamp >= alerts[i+1].timestamp untuk semua i yang valid', () => {
    fc.assert(
      fc.property(
        fc.array(alertEntryArb, { minLength: 2, maxLength: 20 }),
        (entries) => {
          localStorageMock.clear();
          localStorageMock.setItem('disastersense_alerts', JSON.stringify(entries));

          const history = getAlertHistory();

          // Verifikasi urutan descending untuk setiap pasangan berurutan
          for (let i = 0; i < history.length - 1; i++) {
            if (history[i].timestamp < history[i + 1].timestamp) return false;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('array dengan satu elemen selalu terurut dengan benar', () => {
    fc.assert(
      fc.property(alertEntryArb, (entry) => {
        localStorageMock.clear();
        localStorageMock.setItem('disastersense_alerts', JSON.stringify([entry]));

        const history = getAlertHistory();
        return history.length === 1;
      }),
      { numRuns: 50 }
    );
  });

  it('entri dengan timestamp terbesar selalu menjadi elemen pertama', () => {
    fc.assert(
      fc.property(
        fc.array(alertEntryArb, { minLength: 2, maxLength: 10 }),
        (entries) => {
          localStorageMock.clear();
          localStorageMock.setItem('disastersense_alerts', JSON.stringify(entries));

          const history = getAlertHistory();
          const maxTimestamp = Math.max(...entries.map((e) => e.timestamp));

          return history[0].timestamp === maxTimestamp;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Unit: Transisi status yang harus membuat alert', () => {
  beforeEach(() => localStorageMock.clear());

  it('Aman → Waspada membuat alert', () => {
    const alert = checkAndAlert(makeRisk('Aman'), makeRisk('Waspada'), 'Jakarta', mockWeather);
    expect(alert).not.toBeNull();
    expect(alert!.previousStatus).toBe('Aman');
    expect(alert!.newStatus).toBe('Waspada');
  });

  it('Aman → Bahaya membuat alert', () => {
    const alert = checkAndAlert(makeRisk('Aman'), makeRisk('Bahaya'), 'Jakarta', mockWeather);
    expect(alert).not.toBeNull();
    expect(alert!.previousStatus).toBe('Aman');
    expect(alert!.newStatus).toBe('Bahaya');
  });

  it('Waspada → Bahaya membuat alert', () => {
    const alert = checkAndAlert(makeRisk('Waspada'), makeRisk('Bahaya'), 'Jakarta', mockWeather);
    expect(alert).not.toBeNull();
    expect(alert!.previousStatus).toBe('Waspada');
    expect(alert!.newStatus).toBe('Bahaya');
  });
});

describe('Unit: Transisi status yang tidak boleh membuat alert', () => {
  beforeEach(() => localStorageMock.clear());

  it('Bahaya → Waspada tidak membuat alert', () => {
    expect(checkAndAlert(makeRisk('Bahaya'), makeRisk('Waspada'), 'Jakarta', mockWeather)).toBeNull();
  });

  it('Waspada → Aman tidak membuat alert', () => {
    expect(checkAndAlert(makeRisk('Waspada'), makeRisk('Aman'), 'Jakarta', mockWeather)).toBeNull();
  });

  it('Aman → Aman tidak membuat alert', () => {
    expect(checkAndAlert(makeRisk('Aman'), makeRisk('Aman'), 'Jakarta', mockWeather)).toBeNull();
  });

  it('Waspada → Waspada tidak membuat alert', () => {
    expect(checkAndAlert(makeRisk('Waspada'), makeRisk('Waspada'), 'Jakarta', mockWeather)).toBeNull();
  });

  it('Bahaya → Bahaya tidak membuat alert', () => {
    expect(checkAndAlert(makeRisk('Bahaya'), makeRisk('Bahaya'), 'Jakarta', mockWeather)).toBeNull();
  });
});

describe('Unit: localStorage FIFO saat penuh', () => {
  beforeEach(() => localStorageMock.clear());

  it('menghapus entri terlama saat localStorage penuh dan menyimpan entri baru', () => {
    const originalSetItem = localStorageMock.setItem.bind(localStorageMock);
    let callCount = 0;

    vi.spyOn(localStorageMock, 'setItem').mockImplementation((key: string, value: string) => {
      callCount++;
      if (callCount === 1) {
        // Simulasikan QuotaExceededError pada panggilan pertama
        throw new DOMException('QuotaExceededError', 'QuotaExceededError');
      }
      originalSetItem(key, value);
    });

    // Isi localStorage dengan 3 entri lama
    const oldAlerts = [
      { id: 'old-1', timestamp: 1000, location: 'A', previousStatus: 'Aman', newStatus: 'Waspada', weatherSnapshot: mockWeather },
      { id: 'old-2', timestamp: 2000, location: 'B', previousStatus: 'Waspada', newStatus: 'Bahaya', weatherSnapshot: mockWeather },
      { id: 'old-3', timestamp: 3000, location: 'C', previousStatus: 'Aman', newStatus: 'Bahaya', weatherSnapshot: mockWeather },
    ];
    // Bypass mock untuk setup awal
    callCount = 999; // skip the throw
    localStorageMock.setItem('disastersense_alerts', JSON.stringify(oldAlerts));
    callCount = 0; // reset untuk test

    // Panggil checkAndAlert 
    const newAlert = checkAndAlert(makeRisk('Aman'), makeRisk('Bahaya'), 'Jakarta', mockWeather);
    expect(newAlert).not.toBeNull();

    // Setelah FIFO, entri terlama harus dihapus
    const stored = JSON.parse(localStorageMock.getItem('disastersense_alerts')!);
    const ids = stored.map((a: { id: string }) => a.id);
    expect(ids).not.toContain('old-1'); // entri terlama dihapus
  });

  it('entri baru tetap tersimpan setelah FIFO menghapus entri terlama', () => {
    const originalSetItem = localStorageMock.setItem.bind(localStorageMock);
    let callCount = 0;

    vi.spyOn(localStorageMock, 'setItem').mockImplementation((key: string, value: string) => {
      callCount++;
      if (callCount === 1) {
        throw new DOMException('QuotaExceededError', 'QuotaExceededError');
      }
      originalSetItem(key, value);
    });

    const oldAlerts = [
      { id: 'old-a', timestamp: 500, location: 'X', previousStatus: 'Aman', newStatus: 'Waspada', weatherSnapshot: mockWeather },
      { id: 'old-b', timestamp: 1500, location: 'Y', previousStatus: 'Waspada', newStatus: 'Bahaya', weatherSnapshot: mockWeather },
    ];
    callCount = 999;
    localStorageMock.setItem('disastersense_alerts', JSON.stringify(oldAlerts));
    callCount = 0;

    const newAlert = checkAndAlert(makeRisk('Aman'), makeRisk('Waspada'), 'Bali', mockWeather);
    expect(newAlert).not.toBeNull();

    const stored = JSON.parse(localStorageMock.getItem('disastersense_alerts')!);
    const ids = stored.map((a: { id: string }) => a.id);
    expect(ids).not.toContain('old-a');
    expect(ids).toContain('old-b');
  });
});
