import { describe, it, expect } from 'vitest';
import { findParentCombinations, generateComboId, sortCombinations } from '@/lib/breeding';
import { PALS, findPalByName } from '@/data/pals';

describe('breeding', () => {
  const lamball = findPalByName('Lamball');
  const chikipi = findPalByName('Chikipi');

  it('finds parent combinations for a known pal', () => {
    expect(lamball).toBeDefined();
    const combos = findParentCombinations(lamball!);
    expect(combos.length).toBeGreaterThan(0);
    for (const combo of combos) {
      expect(combo.baby.name).toBe('Lamball');
      expect(combo.parentA).toBeDefined();
      expect(combo.parentB).toBeDefined();
      expect(combo.id).toContain('+');
      expect(combo.id).toContain('=');
    }
  });

  it('returns an empty array when no breeding data exists', () => {
    const fakePal = { ...PALS[0], name: 'UnknownPalXYZ' };
    expect(findParentCombinations(fakePal)).toEqual([]);
  });

  it('generates consistent combo ids', () => {
    expect(lamball).toBeDefined();
    expect(chikipi).toBeDefined();
    const id = generateComboId(lamball!, chikipi!, lamball!);
    expect(id).toBe(`${lamball!.id}+${chikipi!.id}=${lamball!.id}`);
  });

  describe('sortCombinations', () => {
    it('sorts by power ascending', () => {
      expect(lamball).toBeDefined();
      const combos = findParentCombinations(lamball!);
      const sorted = sortCombinations(combos, 'power-asc');
      for (let i = 1; i < sorted.length; i++) {
        const prev = Math.max(sorted[i - 1].parentA.breedingPower, sorted[i - 1].parentB.breedingPower);
        const curr = Math.max(sorted[i].parentA.breedingPower, sorted[i].parentB.breedingPower);
        expect(prev).toBeLessThanOrEqual(curr);
      }
    });

    it('sorts by power descending', () => {
      expect(lamball).toBeDefined();
      const combos = findParentCombinations(lamball!);
      const sorted = sortCombinations(combos, 'power-desc');
      for (let i = 1; i < sorted.length; i++) {
        const prev = Math.max(sorted[i - 1].parentA.breedingPower, sorted[i - 1].parentB.breedingPower);
        const curr = Math.max(sorted[i].parentA.breedingPower, sorted[i].parentB.breedingPower);
        expect(prev).toBeGreaterThanOrEqual(curr);
      }
    });

    it('sorts alphabetically', () => {
      expect(lamball).toBeDefined();
      const combos = findParentCombinations(lamball!);
      const sorted = sortCombinations(combos, 'alphabetical');
      const names = sorted.map((c) => `${c.parentA.name}${c.parentB.name}`);
      const expected = [...names].sort((a, b) => String(a).localeCompare(String(b)));
      expect(names).toEqual(expected);
    });

    it('sorts by primary element', () => {
      expect(lamball).toBeDefined();
      const combos = findParentCombinations(lamball!);
      const sorted = sortCombinations(combos, 'element');
      const elements = sorted.map((c) => (c.parentA.elements[0] as string | undefined) ?? '');
      const expected = [...elements].sort((a, b) => a.localeCompare(b));
      expect(elements).toEqual(expected);
    });
  });
});
