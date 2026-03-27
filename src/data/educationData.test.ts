import { describe, it } from 'vitest';
import fc from 'fast-check';
import { educationData } from './educationData';
import type { EducationEntry } from './educationData';


describe('Property 15: Kelengkapan Struktur Data Edukasi', () => {

  it('setiap entri memiliki field description yang terdefinisi dan tidak kosong', () => {
    fc.assert(
      fc.property(fc.constantFrom(...educationData), (entry: EducationEntry) => {
        return typeof entry.description === 'string' && entry.description.length > 0;
      }),
      { numRuns: 100 }
    );
  });

  it('setiap entri memiliki field warningSigns yang terdefinisi dan tidak kosong', () => {
    fc.assert(
      fc.property(fc.constantFrom(...educationData), (entry: EducationEntry) => {
        return Array.isArray(entry.warningSigns) && entry.warningSigns.length > 0;
      }),
      { numRuns: 100 }
    );
  });

  it('setiap entri memiliki field beforeSteps yang terdefinisi dan tidak kosong', () => {
    fc.assert(
      fc.property(fc.constantFrom(...educationData), (entry: EducationEntry) => {
        return Array.isArray(entry.beforeSteps) && entry.beforeSteps.length > 0;
      }),
      { numRuns: 100 }
    );
  });

  it('setiap entri memiliki field duringSteps yang terdefinisi dan tidak kosong', () => {
    fc.assert(
      fc.property(fc.constantFrom(...educationData), (entry: EducationEntry) => {
        return Array.isArray(entry.duringSteps) && entry.duringSteps.length > 0;
      }),
      { numRuns: 100 }
    );
  });

  it('setiap entri memiliki field afterSteps yang terdefinisi dan tidak kosong', () => {
    fc.assert(
      fc.property(fc.constantFrom(...educationData), (entry: EducationEntry) => {
        return Array.isArray(entry.afterSteps) && entry.afterSteps.length > 0;
      }),
      { numRuns: 100 }
    );
  });

  it('setiap entri memiliki field checklist dengan minimal satu item', () => {
    fc.assert(
      fc.property(fc.constantFrom(...educationData), (entry: EducationEntry) => {
        return Array.isArray(entry.checklist) && entry.checklist.length >= 1;
      }),
      { numRuns: 100 }
    );
  });

  it('semua field wajib terdefinisi dan tidak kosong untuk setiap entri', () => {
    fc.assert(
      fc.property(fc.constantFrom(...educationData), (entry: EducationEntry) => {
        const hasDescription = typeof entry.description === 'string' && entry.description.length > 0;
        const hasWarningSigns = Array.isArray(entry.warningSigns) && entry.warningSigns.length > 0;
        const hasBeforeSteps = Array.isArray(entry.beforeSteps) && entry.beforeSteps.length > 0;
        const hasDuringSteps = Array.isArray(entry.duringSteps) && entry.duringSteps.length > 0;
        const hasAfterSteps = Array.isArray(entry.afterSteps) && entry.afterSteps.length > 0;
        const hasChecklist = Array.isArray(entry.checklist) && entry.checklist.length >= 1;
        return hasDescription && hasWarningSigns && hasBeforeSteps && hasDuringSteps && hasAfterSteps && hasChecklist;
      }),
      { numRuns: 100 }
    );
  });
});
