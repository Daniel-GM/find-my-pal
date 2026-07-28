import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { findGearById, getGearByKind, GEAR } from '@/data/gear';

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
const INTERNAL_OR_WIP_IDS = [
  'axe4',
  'capture_rope',
  'penguin_launcher',
  'throw_stone',
  'recurve_bow',
  'air_grappling_gun',
  'ballistic_shield',
  'claws_pendant',
  'fang_necklace',
  'night_vision_goggles',
];

describe('player gear catalog', () => {
  it('contains only audited, equipable weapons and accessories', () => {
    expect(getGearByKind('weapon')).toHaveLength(115);
    expect(getGearByKind('accessory')).toHaveLength(83);

    for (const id of INTERNAL_OR_WIP_IDS) {
      expect(findGearById(id), id).toBeUndefined();
    }
  });

  it('includes Attack Pendant with its Brazilian Portuguese name and icon', () => {
    expect(findGearById('attack_pendant')).toMatchObject({
      kind: 'accessory',
      names: {
        en: 'Attack Pendant',
        'pt-BR': 'Pingente de Ataque',
      },
      sourceId: 'Accessory_AT_1',
    });
    expect(findGearById('attack_pendant')?.iconUrl).toMatch(/^\/assets\/gear\/.+\.webp$/);
  });

  it('uses localized display names for the reported weapon regressions', () => {
    expect(findGearById('primitive_sword')?.names['pt-BR']).toBe('Espada Primitiva');
    expect(findGearById('plasma_rifle')?.names['pt-BR']).toBe('Fuzil de Plasma');
    expect(findGearById('gatling_gun')?.names['pt-BR']).toBe('Metralhadora Gatling');
  });

  it('stores every team item icon locally and keeps ids unique', () => {
    expect(new Set(GEAR.map((item) => item.id)).size).toBe(GEAR.length);

    const uniqueIconPaths = new Set<string>();
    for (const item of GEAR) {
      expect(item.iconUrl, item.id).toMatch(/^\/assets\/gear\/.+\.webp$/);
      uniqueIconPaths.add(item.iconUrl!);
    }

    for (const iconUrl of uniqueIconPaths) {
      const filePath = path.join(PUBLIC_DIR, ...iconUrl.slice(1).split('/'));
      expect(existsSync(filePath), iconUrl).toBe(true);
      const bytes = readFileSync(filePath);
      expect(bytes.byteLength, iconUrl).toBeGreaterThan(12);
      expect(bytes.subarray(0, 4).toString('ascii'), iconUrl).toBe('RIFF');
      expect(bytes.subarray(8, 12).toString('ascii'), iconUrl).toBe('WEBP');
    }
  });

  it('includes the Eye of Cthulhu Mask with a local image', () => {
    expect(findGearById('eye_of_cthulhu_mask')).toMatchObject({
      kind: 'helmet',
      names: {
        en: 'Eye of Cthulhu Mask',
        'pt-BR': 'Máscara do Olho de Cthulhu',
      },
    });
    expect(findGearById('eye_of_cthulhu_mask')?.iconUrl).toMatch(/^\/assets\/gear\/.+\.webp$/);
  });
});
