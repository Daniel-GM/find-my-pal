import { describe, it, expect } from 'vitest';
import { PALS, findPalByName, ALL_WORK_TYPES } from '@/data/pals';

describe('pals data', () => {
  it('has a non-empty pal list', () => {
    expect(PALS.length).toBeGreaterThan(0);
  });

  it('finds a known pal by name', () => {
    const lamball = findPalByName('Lamball');
    expect(lamball).toBeDefined();
    expect(lamball!.name).toBe('Lamball');
    expect(lamball!.id).toBeTruthy();
  });

  it('returns undefined for unknown pal names', () => {
    expect(findPalByName('NotAPal')).toBeUndefined();
  });

  it('every pal has required fields', () => {
    for (const pal of PALS) {
      expect(pal.id).toBeTruthy();
      expect(pal.name).toBeTruthy();
      expect(pal.number).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(pal.elements)).toBe(true);
      expect(typeof pal.breedingPower).toBe('number');
      expect(pal.workSuitability).toBeDefined();
    }
  });

  it('lists all known work types', () => {
    expect(ALL_WORK_TYPES).toContain('kindling');
    expect(ALL_WORK_TYPES).toContain('mining');
    expect(ALL_WORK_TYPES).toContain('farming');
  });
});
