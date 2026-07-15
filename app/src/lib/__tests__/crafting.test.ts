import { describe, it, expect } from 'vitest';
import {
  CRAFTING_CATALOG,
  validateCraftingCatalog,
  indexCraftingCatalog,
  getSelectableEntities,
  getDefaultRecipe,
  getRecipesForOutput,
} from '@/data/crafting';
import { buildCraftingPlan } from '@/lib/crafting';

describe('crafting catalog', () => {
  it('has schema metadata and non-empty provenance', () => {
    expect(CRAFTING_CATALOG.schemaVersion).toBe(1);
    expect(CRAFTING_CATALOG.gameVersion).toBeTruthy();
    expect(CRAFTING_CATALOG.generatedAt).toBeTruthy();
    expect(CRAFTING_CATALOG.sources.length).toBeGreaterThan(0);
    for (const source of CRAFTING_CATALOG.sources) {
      expect(source.name).toBeTruthy();
      expect(source.url).toBeTruthy();
      expect(source.retrievedAt).toBeTruthy();
    }
  });

  it('passes validation', () => {
    const result = validateCraftingCatalog(CRAFTING_CATALOG);
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it('has unique entity and recipe ids', () => {
    const entityIds = CRAFTING_CATALOG.entities.map((e) => e.id);
    const recipeIds = CRAFTING_CATALOG.recipes.map((r) => r.id);
    expect(new Set(entityIds).size).toBe(entityIds.length);
    expect(new Set(recipeIds).size).toBe(recipeIds.length);
  });

  it('uses positive integer quantities and yields', () => {
    for (const recipe of CRAFTING_CATALOG.recipes) {
      expect(recipe.output.quantity).toBeGreaterThan(0);
      expect(Number.isInteger(recipe.output.quantity)).toBe(true);
      for (const ing of recipe.ingredients) {
        expect(ing.quantity).toBeGreaterThan(0);
        expect(Number.isInteger(ing.quantity)).toBe(true);
      }
    }
  });

  it('has exactly one deterministic default per craftable output', () => {
    const index = indexCraftingCatalog(CRAFTING_CATALOG);
    for (const [outputId, recipes] of index.recipesByOutputId) {
      const defaults = recipes.filter((r) => r.isDefault);
      expect(defaults.length).toBe(1);
      expect(index.defaultRecipeByOutputId.get(outputId)?.id).toBe(defaults[0].id);
    }
  });

  it('deduplicates identical station-only variants into one recipe', () => {
    const carbon = getRecipesForOutput('CarbonFiber');
    expect(carbon.length).toBe(2);
    for (const recipe of carbon) {
      expect(recipe.stationIds.length).toBeGreaterThan(1);
    }
  });

  it('marks coal Carbon Fiber as default and includes charcoal alternative', () => {
    const defaultRecipe = getDefaultRecipe('CarbonFiber');
    expect(defaultRecipe?.id).toBe('carbon_fiber_coal');
    const ids = getRecipesForOutput('CarbonFiber').map((r) => r.id);
    expect(ids).toContain('carbon_fiber_charcoal');
  });

  it('keeps a non-empty selectable catalog', () => {
    const selectable = getSelectableEntities(CRAFTING_CATALOG);
    expect(selectable.length).toBeGreaterThanOrEqual(20);
  });

  it('contains the complete PalDB construction catalog', () => {
    const structures = CRAFTING_CATALOG.entities.filter((entity) => entity.kind === 'structure');
    expect(structures.length).toBeGreaterThanOrEqual(490);
    expect(structures.every((entity) => entity.selectable)).toBe(true);
    expect(structures.every((entity) => entity.sourceId && entity.iconUrl)).toBe(true);
    expect(CRAFTING_CATALOG.sources.filter((source) => /PalDB (EN|PT) .* buildings/.test(source.name))).toHaveLength(20);
  });

  it('includes golden Gigantic Furnace direct recipe quantities', () => {
    const recipe = getDefaultRecipe('GiganticFurnace');
    expect(recipe).toBeDefined();
    const byId = Object.fromEntries(recipe!.ingredients.map((i) => [i.entityId, i.quantity]));
    expect(byId).toEqual({
      Plasteel: 150,
      Polymer: 100,
      FlameOrgan: 200,
      Computer: 12,
    });
  });
});

describe('buildCraftingPlan', () => {
  it('plans a direct raw-input craft', () => {
    const plan = buildCraftingPlan(CRAFTING_CATALOG, { targetId: 'Charcoal', quantity: 3 });
    expect(plan.warnings).toEqual([]);
    expect(plan.rawMaterials).toEqual([
      expect.objectContaining({ entityId: 'Wood', quantity: 6 }),
    ]);
    expect(plan.steps).toHaveLength(1);
    expect(plan.steps[0].entityId).toBe('Charcoal');
    expect(plan.steps[0].craftCount).toBe(3);
  });

  it('plans a multi-level recipe', () => {
    const plan = buildCraftingPlan(CRAFTING_CATALOG, { targetId: 'Polymer', quantity: 2 });
    expect(plan.warnings).toEqual([]);
    expect(plan.steps.map((s) => s.entityId)).toEqual(['Polymer']);
    expect(plan.rawMaterials.find((m) => m.entityId === 'HighQualityPalOil')?.quantity).toBe(4);
    expect(plan.rawMaterials.find((m) => m.entityId === 'Sulfur')?.quantity).toBe(2);
  });

  it('aggregates shared intermediates before batch rounding', () => {
    const catalog = {
      ...CRAFTING_CATALOG,
      entities: [
        { id: 'A', kind: 'material' as const, names: { en: 'A' }, selectable: false },
        { id: 'B', kind: 'material' as const, names: { en: 'B' }, selectable: true },
        { id: 'C', kind: 'item' as const, names: { en: 'C' }, selectable: true },
      ],
      recipes: [
        {
          id: 'b_from_a',
          output: { entityId: 'B', quantity: 2 },
          ingredients: [{ entityId: 'A', quantity: 1 }],
          stationIds: [],
          sourceUrl: 'test',
          isDefault: true,
        },
        {
          id: 'c_from_b',
          output: { entityId: 'C', quantity: 1 },
          ingredients: [{ entityId: 'B', quantity: 3 }],
          stationIds: [],
          sourceUrl: 'test',
          isDefault: true,
        },
      ],
    };
    const plan = buildCraftingPlan(catalog, { targetId: 'C', quantity: 1 });
    expect(plan.warnings).toEqual([]);
    expect(plan.steps.find((s) => s.entityId === 'B')?.craftCount).toBe(2);
    expect(plan.rawMaterials.find((m) => m.entityId === 'A')?.quantity).toBe(2);
  });

  it('reports surplus when yield exceeds demand', () => {
    const plan = buildCraftingPlan(CRAFTING_CATALOG, { targetId: 'Nail', quantity: 1 });
    expect(plan.warnings).toEqual([]);
    const nail = plan.steps.find((s) => s.entityId === 'Nail');
    expect(nail?.craftCount).toBe(1);
    expect(nail?.producedQuantity).toBe(2);
    expect(nail?.surplus).toBe(1);
  });

  it('changes raw totals when switching Carbon Fiber routes', () => {
    const coal = buildCraftingPlan(CRAFTING_CATALOG, {
      targetId: 'GiganticFurnace',
      quantity: 1,
    });
    const charcoal = buildCraftingPlan(CRAFTING_CATALOG, {
      targetId: 'GiganticFurnace',
      quantity: 1,
      selectedRecipeIds: { CarbonFiber: 'carbon_fiber_charcoal' },
    });

    expect(coal.rawMaterials.find((m) => m.entityId === 'Coal')?.quantity).toBe(144);
    expect(charcoal.rawMaterials.find((m) => m.entityId === 'Coal')?.quantity).toBe(48);
    expect(charcoal.rawMaterials.find((m) => m.entityId === 'Wood')?.quantity).toBe(480);
    expect(coal.rawMaterials.find((m) => m.entityId === 'Wood')).toBeUndefined();
  });

  it('can target an intermediate', () => {
    const plan = buildCraftingPlan(CRAFTING_CATALOG, { targetId: 'CircuitBoard', quantity: 1 });
    expect(plan.steps.at(-1)?.entityId).toBe('CircuitBoard');
    expect(plan.rawMaterials.find((m) => m.entityId === 'PureQuartz')?.quantity).toBe(2);
  });

  it('detects cycles', () => {
    const catalog = {
      schemaVersion: 1 as const,
      gameVersion: 'test',
      generatedAt: '2026-07-14',
      sources: [{ name: 't', url: 'u', retrievedAt: '2026-07-14' }],
      entities: [
        { id: 'X', kind: 'material' as const, names: { en: 'X' }, selectable: true },
        { id: 'Y', kind: 'material' as const, names: { en: 'Y' }, selectable: true },
      ],
      recipes: [
        {
          id: 'x_from_y',
          output: { entityId: 'X', quantity: 1 },
          ingredients: [{ entityId: 'Y', quantity: 1 }],
          stationIds: [],
          sourceUrl: 't',
          isDefault: true,
        },
        {
          id: 'y_from_x',
          output: { entityId: 'Y', quantity: 1 },
          ingredients: [{ entityId: 'X', quantity: 1 }],
          stationIds: [],
          sourceUrl: 't',
          isDefault: true,
        },
      ],
    };
    const plan = buildCraftingPlan(catalog, { targetId: 'X', quantity: 1 });
    expect(plan.warnings.some((w) => w.code === 'cycle_detected')).toBe(true);
    expect(plan.steps).toEqual([]);
  });

  it('fails clearly for invalid quantity, target, and recipe selection', () => {
    expect(buildCraftingPlan(CRAFTING_CATALOG, { targetId: 'GiganticFurnace', quantity: 0 }).warnings[0].code).toBe(
      'invalid_quantity',
    );
    expect(buildCraftingPlan(CRAFTING_CATALOG, { targetId: 'Nope', quantity: 1 }).warnings[0].code).toBe(
      'invalid_target',
    );
    const bad = buildCraftingPlan(CRAFTING_CATALOG, {
      targetId: 'CarbonFiber',
      quantity: 1,
      selectedRecipeIds: { CarbonFiber: 'polymer_oil_sulfur' },
    });
    expect(bad.warnings.some((w) => w.code === 'invalid_recipe_selection')).toBe(true);
  });

  it('keeps deterministic order when source arrays are reordered', () => {
    const shuffled = {
      ...CRAFTING_CATALOG,
      entities: [...CRAFTING_CATALOG.entities].reverse(),
      recipes: [...CRAFTING_CATALOG.recipes].reverse(),
    };
    const a = buildCraftingPlan(CRAFTING_CATALOG, { targetId: 'GiganticFurnace', quantity: 1 });
    const b = buildCraftingPlan(shuffled, { targetId: 'GiganticFurnace', quantity: 1 });
    expect(a.rawMaterials.map((m) => [m.entityId, m.quantity])).toEqual(
      b.rawMaterials.map((m) => [m.entityId, m.quantity]),
    );
    expect(a.steps.map((s) => s.entityId)).toEqual(b.steps.map((s) => s.entityId));
  });

  it('builds a plan for every selectable catalog target', () => {
    for (const entity of getSelectableEntities(CRAFTING_CATALOG)) {
      const plan = buildCraftingPlan(CRAFTING_CATALOG, { targetId: entity.id, quantity: 1 });
      const fatal = plan.warnings.filter((w) =>
        ['cycle_detected', 'invalid_recipe_selection', 'missing_default_recipe'].includes(w.code),
      );
      expect(fatal, entity.id).toEqual([]);
      expect(plan.steps.length, entity.id).toBeGreaterThan(0);
    }
  });
});

describe('Gigantic Furnace golden totals', () => {
  const GOLDEN_RAW: Record<string, number> = {
    Ore: 978,
    CrudeOil: 372,
    HighQualityPalOil: 248,
    Sulfur: 124,
    Coal: 144,
    FlameOrgan: 248,
    PureQuartz: 48,
    ElectricOrgan: 24,
  };

  it('matches PalDB v1.0.0 default coal route for x1', () => {
    const plan = buildCraftingPlan(CRAFTING_CATALOG, { targetId: 'GiganticFurnace', quantity: 1 });
    expect(plan.warnings).toEqual([]);

    const raw = Object.fromEntries(plan.rawMaterials.map((m) => [m.entityId, m.quantity]));
    expect(raw).toEqual(GOLDEN_RAW);

    const intermediateIds = [
      'Plasteel',
      'Polymer',
      'Computer',
      'CircuitBoard',
      'BioBattery',
      'CarbonFiber',
      'RefinedIngot',
    ];
    for (const id of intermediateIds) {
      expect(raw[id]).toBeUndefined();
      expect(plan.steps.filter((s) => s.entityId === id)).toHaveLength(1);
    }

    expect(plan.steps.at(-1)?.entityId).toBe('GiganticFurnace');

    const order = plan.steps.map((s) => s.entityId);
    const indexOf = (id: string) => order.indexOf(id);
    expect(indexOf('RefinedIngot')).toBeLessThan(indexOf('BioBattery'));
    expect(indexOf('CarbonFiber')).toBeLessThan(indexOf('BioBattery'));
    expect(indexOf('Polymer')).toBeLessThan(indexOf('CircuitBoard'));
    expect(indexOf('CircuitBoard')).toBeLessThan(indexOf('Computer'));
    expect(indexOf('Plasteel')).toBeLessThan(indexOf('Computer'));
    expect(indexOf('Computer')).toBeLessThan(indexOf('GiganticFurnace'));
  });

  it('recalculates quantity 2 from source quantities', () => {
    const x2 = buildCraftingPlan(CRAFTING_CATALOG, { targetId: 'GiganticFurnace', quantity: 2 });
    const raw = Object.fromEntries(x2.rawMaterials.map((m) => [m.entityId, m.quantity]));
    for (const [id, qty] of Object.entries(GOLDEN_RAW)) {
      expect(raw[id]).toBe(qty * 2);
    }
  });
});
