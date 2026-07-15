import { describe, expect, it } from 'vitest';
import { mergeBuildingsIntoCatalog, parseBuildingCategory, parsePaldbVersion } from './paldb-buildings.mjs';

const PAGE = `
<div class="col"><div class="card itemPopup">
  <a class="itemname" data-hover="?s=MapObjects%2FWorkBench" href="Primitive_Workbench">Primitive Workbench</a>
  <div class="hover_icon_bg"><img src="https://cdn.paldb.cc/image/Pal/Texture/BuildObject/PNG/T_icon_buildObject_WorkBench.webp"></div>
  <span data-hover="?s=Technology%2FWorkbench">Technology</span></span><span class="border p-1">1</span>
  <div class="recipes">
    <div><a class="itemname" data-hover="?s=Items%2FWood" href="Wood"><img src="https://cdn/items/wood.webp"/>Wood</a></div><div>2</div>
  </div>
</div>
<a href="version">v1.0.0</a> 2026/7/10`;

describe('PalDB building import', () => {
  it('parses IDs, localized names, icons, levels, and ingredients', () => {
    const [building] = parseBuildingCategory(PAGE, { category: 'Production', locale: 'en' });
    expect(building).toMatchObject({
      sourceId: 'WorkBench',
      pageSlug: 'Primitive_Workbench',
      name: 'Primitive Workbench',
      technologyLevel: 1,
      ingredients: [{ sourceId: 'Wood', name: 'Wood', quantity: 2 }],
    });
    expect(building.iconUrl).toContain('T_icon_buildObject_WorkBench.webp');
    expect(parsePaldbVersion(PAGE)).toEqual({ version: 'v1.0.0', date: '2026/7/10' });
  });

  it('preserves existing canonical IDs while replacing structure recipes', () => {
    const english = parseBuildingCategory(PAGE, { category: 'Production', locale: 'en' });
    const portuguese = [{ ...english[0], name: 'Bancada Primitiva', ingredients: [{ ...english[0].ingredients[0], name: 'Madeira' }] }];
    const catalog = {
      schemaVersion: 1,
      gameVersion: 'old',
      generatedAt: '2026-01-01T00:00:00.000Z',
      sources: [{ name: 'Existing', url: 'https://example.com', retrievedAt: '2026-01-01' }],
      entities: [
        { id: 'Wood', kind: 'material', names: { en: 'Wood' }, selectable: false },
        { id: 'station_primitive', kind: 'structure', names: { en: 'Primitive Workbench' }, selectable: false },
      ],
      recipes: [],
    };
    const merged = mergeBuildingsIntoCatalog(catalog, {
      version: { version: 'v1.0.0', date: '2026/7/10' },
      english,
      portuguese,
      pages: [{ category: 'Production', locale: 'en', url: 'https://paldb.cc/en/Production' }],
    }, new Date('2026-07-14T12:00:00.000Z'));
    expect(merged.entities.find((entity) => entity.kind === 'structure')).toMatchObject({
      id: 'station_primitive',
      sourceId: 'WorkBench',
      names: { en: 'Primitive Workbench', 'pt-BR': 'Bancada Primitiva' },
      selectable: true,
    });
    expect(merged.recipes[0]).toMatchObject({
      output: { entityId: 'station_primitive', quantity: 1 },
      ingredients: [{ entityId: 'Wood', quantity: 2 }],
    });
  });
});
