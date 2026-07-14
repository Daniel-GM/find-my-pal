import { describe, it, expect } from 'vitest';
import { getPalImageUrl, getElementIconUrl, getActiveWorkSuitability, getWorkSkillIconUrl } from '@/lib/images';
import { ELEMENTS } from '@/lib/elements';
import type { Pal, WorkType } from '@/data/pals';

describe('images', () => {
  it('builds pal image url from icon name', () => {
    expect(getPalImageUrl('Lamball')).toContain('Lamball_icon.png');
  });

  it('builds element icon urls for every element', () => {
    for (const element of ELEMENTS) {
      const url = getElementIconUrl(element);
      expect(url).toContain(`${element}.webp`);
    }
  });

  it('builds work skill icon urls for every work type', () => {
    const workTypes: WorkType[] = ['kindling', 'mining', 'farming'];
    const mappedNames = ['Kindling', 'Mining', 'Farming'];
    for (let i = 0; i < workTypes.length; i++) {
      const url = getWorkSkillIconUrl(workTypes[i]);
      expect(url).toContain(mappedNames[i]);
      expect(url).toContain('.webp');
    }
  });

  it('returns only active work suitability entries', () => {
    const fakePal: Pal = {
      id: 'test',
      iconName: 'Test',
      name: 'Test',
      number: 1,
      elements: ['neutral'],
      breedingPower: 1000,
      workSuitability: {
        kindling: 2,
        watering: 0,
        planting: 1,
        generatingElectricity: 0,
        handiwork: 0,
        gathering: 0,
        lumbering: 0,
        mining: 3,
        medicineProduction: 0,
        cooling: 0,
        transporting: 0,
        farming: 0,
      },
    };
    const active = getActiveWorkSuitability(fakePal);
    expect(active.map((a) => a.type)).toEqual(['kindling', 'planting', 'mining']);
    for (const entry of active) {
      expect(entry.level).toBeGreaterThan(0);
      expect(entry.iconUrl).toContain('.webp');
    }
  });
});
