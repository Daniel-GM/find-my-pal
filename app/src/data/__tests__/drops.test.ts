import { describe, it, expect } from 'vitest';
import { PAL_DROPS, RARE_DROP_ITEMS, isRareDrop, getPalsByDropItem, getItemImageUrl, getAllDropItems } from '@/data/drops';

describe('drops data', () => {
  it('has drop entries', () => {
    expect(Object.keys(PAL_DROPS).length).toBeGreaterThan(0);
  });

  it('identifies rare drops', () => {
    expect(isRareDrop('Diamond')).toBe(true);
    expect(isRareDrop('Ancient Civilization Parts')).toBe(true);
    expect(isRareDrop('WheatSeeds')).toBe(false);
  });

  it('finds pals that drop a specific item', () => {
    const boneDrops = getPalsByDropItem('Bone');
    expect(boneDrops.length).toBeGreaterThan(0);
    for (const drop of boneDrops) {
      expect(drop.palName).toBeTruthy();
      expect(drop.rate).toBeGreaterThan(0);
      expect(drop.min).toBeGreaterThanOrEqual(0);
      expect(drop.max).toBeGreaterThanOrEqual(drop.min);
    }
  });

  it('returns mapped image URLs', () => {
    expect(getItemImageUrl('Diamond')).toContain('T_itemicon_Material_Diamond.png');
  });

  it('returns fallback image URLs for unknown items', () => {
    expect(getItemImageUrl('UnknownItem')).toContain('T_itemicon_Material_UnknownItem.png');
  });

  it('aggregates drop items across all pals', () => {
    const items = getAllDropItems();
    expect(items.length).toBeGreaterThan(0);
    const boneItem = items.find((i) => i.itemName === 'Bone');
    expect(boneItem).toBeDefined();
    expect(boneItem!.pals.length).toBeGreaterThan(0);
  });

  it('lists expected rare items', () => {
    expect(RARE_DROP_ITEMS).toContain('Diamond');
    expect(RARE_DROP_ITEMS).toContain('Pal Metal Ingot');
  });
});
