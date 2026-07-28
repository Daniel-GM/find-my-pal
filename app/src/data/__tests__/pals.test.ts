import { describe, it, expect } from 'vitest';
import {
  ALL_WORK_TYPES,
  PALS,
  findPalByName,
  getPalName,
} from '@/data/pals';
import { getPalDetail } from '@/data/palDetails';

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

  it('includes the complete current PalDB directory', () => {
    expect(PALS).toHaveLength(299);
    expect(findPalByName('Astralym')).toBeDefined();
  });

  it('keeps localized names and complete detail data', async () => {
    const chikipi = findPalByName('Chikipi');
    expect(chikipi).toBeDefined();
    expect(getPalName(chikipi!, 'pt-BR')).toBe('Chikipi');

    const detail = await getPalDetail('Chikipi');
    expect(detail?.level1.hp).toEqual([535, 544]);
    expect(detail?.level80.hp).toEqual([3300, 4020]);
    expect(detail?.drops.map((drop) => drop.names['pt-BR'])).toEqual([
      'Ovo',
      'Carne de Chikipi',
    ]);
    expect(detail?.habitats.palpagos.day.count).toBeGreaterThan(0);
  });

  it('stores all Pal and drop images as local assets', async () => {
    for (const pal of PALS) {
      expect(pal.iconUrl).toMatch(/^\/assets\/pals\//);
      for (const drop of (await getPalDetail(pal.name))?.drops ?? []) {
        expect(drop.iconUrl).toMatch(/^\/assets\/drops\//);
      }
    }
  });
});
