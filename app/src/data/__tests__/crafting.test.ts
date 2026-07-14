import { describe, it, expect } from 'vitest';
import { validateCraftingCatalog, type CraftingCatalog } from '@/data/crafting';

function baseCatalog(overrides: Partial<CraftingCatalog> = {}): CraftingCatalog {
  return {
    schemaVersion: 1,
    gameVersion: 'test',
    generatedAt: '2026-07-14T00:00:00.000Z',
    sources: [{ name: 't', url: 'https://example.com', retrievedAt: '2026-07-14' }],
    entities: [
      { id: 'A', kind: 'material', names: { en: 'A' }, selectable: false },
      { id: 'B', kind: 'item', names: { en: 'B' }, selectable: true },
      { id: 'station_x', kind: 'structure', names: { en: 'X' }, selectable: false },
    ],
    recipes: [
      {
        id: 'b_from_a',
        output: { entityId: 'B', quantity: 1 },
        ingredients: [{ entityId: 'A', quantity: 1 }],
        stationIds: ['station_x'],
        sourceUrl: 'https://example.com',
        isDefault: true,
      },
    ],
    ...overrides,
  };
}

describe('validateCraftingCatalog', () => {
  it('accepts a valid catalog', () => {
    expect(validateCraftingCatalog(baseCatalog()).ok).toBe(true);
  });

  it('rejects missing metadata', () => {
    const result = validateCraftingCatalog(baseCatalog({ gameVersion: '', sources: [] }));
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code === 'missing_metadata')).toBe(true);
  });

  it('rejects duplicate ids and bad quantities', () => {
    const result = validateCraftingCatalog(
      baseCatalog({
        entities: [
          { id: 'A', kind: 'material', names: { en: 'A' }, selectable: false },
          { id: 'A', kind: 'material', names: { en: 'A2' }, selectable: false },
          { id: 'B', kind: 'item', names: { en: 'B' }, selectable: true },
        ],
        recipes: [
          {
            id: 'bad',
            output: { entityId: 'B', quantity: 0 },
            ingredients: [],
            stationIds: [],
            sourceUrl: 'u',
            isDefault: true,
          },
        ],
      }),
    );
    expect(result.issues.map((i) => i.code)).toEqual(
      expect.arrayContaining(['duplicate_entity_id', 'invalid_quantity', 'empty_ingredients']),
    );
  });

  it('rejects missing references and selectable without recipes', () => {
    const result = validateCraftingCatalog(
      baseCatalog({
        entities: [
          { id: 'A', kind: 'material', names: { en: 'A' }, selectable: false },
          { id: 'B', kind: 'item', names: { en: 'B' }, selectable: true },
          { id: 'C', kind: 'item', names: { en: 'C' }, selectable: true },
        ],
        recipes: [
          {
            id: 'b',
            output: { entityId: 'B', quantity: 1 },
            ingredients: [{ entityId: 'Missing', quantity: 1 }],
            stationIds: ['missing_station'],
            sourceUrl: 'u',
            isDefault: true,
          },
        ],
      }),
    );
    expect(result.issues.map((i) => i.code)).toEqual(
      expect.arrayContaining(['missing_entity_ref', 'missing_station_ref', 'selectable_without_recipe']),
    );
  });
});
