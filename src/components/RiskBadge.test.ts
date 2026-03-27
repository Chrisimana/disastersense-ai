import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { getRiskColor } from './RiskBadge';
import type { RiskStatus } from '../types';

const ALL_STATUSES: RiskStatus[] = ['Aman', 'Waspada', 'Bahaya'];

const EXPECTED_COLORS: Record<RiskStatus, string> = {
  Aman: '#22c55e',
  Waspada: '#f59e0b',
  Bahaya: '#ef4444',
};

const riskStatusArb = fc.constantFrom<RiskStatus>(...ALL_STATUSES);

describe('Property 10: Konsistensi Pemetaan Warna Status Risiko', () => {
  it('getRiskColor selalu mengembalikan warna yang benar untuk setiap RiskStatus', () => {
    fc.assert(
      fc.property(riskStatusArb, (status) => {
        const color = getRiskColor(status);
        expect(color).toBe(EXPECTED_COLORS[status]);
      }),
      { numRuns: 100 }
    );
  });

  it('Aman selalu dipetakan ke hijau (#22c55e)', () => {
    expect(getRiskColor('Aman')).toBe('#22c55e');
  });

  it('Waspada selalu dipetakan ke kuning/oranye (#f59e0b)', () => {
    expect(getRiskColor('Waspada')).toBe('#f59e0b');
  });

  it('Bahaya selalu dipetakan ke merah (#ef4444)', () => {
    expect(getRiskColor('Bahaya')).toBe('#ef4444');
  });

  it('setiap status menghasilkan warna yang unik (tidak ada dua status dengan warna sama)', () => {
    fc.assert(
      fc.property(
        riskStatusArb,
        riskStatusArb,
        (statusA, statusB) => {
          if (statusA !== statusB) {
            expect(getRiskColor(statusA)).not.toBe(getRiskColor(statusB));
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('warna yang dikembalikan selalu berupa string hex 7 karakter valid', () => {
    fc.assert(
      fc.property(riskStatusArb, (status) => {
        const color = getRiskColor(status);
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      }),
      { numRuns: 100 }
    );
  });

  it('getRiskColor bersifat deterministik — hasil sama untuk input yang sama', () => {
    fc.assert(
      fc.property(riskStatusArb, (status) => {
        expect(getRiskColor(status)).toBe(getRiskColor(status));
      }),
      { numRuns: 100 }
    );
  });
});
