# Crafting Planner Feature Plan

## Status and intent

This is a planning-only handoff. No application feature code has been implemented.

The feature is feasible in the current React/Vite application. The difficult part is not rendering the page; it is maintaining a complete, versioned, internally consistent recipe graph. Implementation must therefore establish and test the data/algorithm layer before building the UI.

## Product goal

Add a top-level **Crafting Planner** view where a player:

1. searches for and selects a craftable item or structure;
2. chooses the desired output quantity;
3. sees one aggregated list of base/raw materials;
4. sees dependency-safe crafting steps, from the first intermediate to the final item/structure; and
5. can choose among alternate recipes and immediately see both sections recalculate.

The Gigantic Furnace is the golden example for the first vertical slice, but the domain model and algorithm must support every target included in the shipped catalog.

## Current application constraints

- `app/src/App.tsx` switches pages through `appState.currentView`; there is no URL router despite `react-router` being installed.
- `app/src/hooks/useAppState.ts` owns the `View` union and persists `currentView`, theme, packages, and completed combinations to `localStorage`.
- `app/src/components/Navbar.tsx` declares the top-level navigation and always renders the Pal search/list, even on non-breeding views. The Crafting Planner should follow the existing shell without expanding scope into a navbar redesign.
- `app/src/pages/BossDrops.tsx` is the closest visual/search precedent. `app/src/data/drops.ts` contains an item image resolver that can inform, but should not own, crafting imagery.
- `app/src/i18n/types.ts`, `locales/en.ts`, and `locales/pt-BR.ts` require explicit UI translation keys. `app/src/i18n/gameData.ts` already translates many material names but does not cover a complete recipe/structure catalog.
- The application is static and currently bundles game data under `app/src/data/json/`. Recipe data should also be bundled; the browser must not depend on a third-party API at runtime.
- Existing validation scripts are `npm run test:run`, `npm run lint`, and `npm run build` from `app/`.

## Scope decisions

### Included in the first release

- A new top-level `crafting` view and navigation item.
- Search and category filtering for all craftable items/structures in the shipped dataset.
- Integer target quantity, default `1`, minimum `1`.
- Fully recursive raw-material aggregation.
- Dependency-first crafting steps with required amount, craft count, produced amount, and surplus when a recipe yield forces overproduction.
- Alternate recipe selection at any reachable intermediate, with deterministic defaults.
- Workbench/station and technology level when present in the source data.
- English and Brazilian Portuguese UI; entity names use localized catalog names with canonical-English fallback.
- Visible game-data version/provenance metadata.
- Unit/data/component tests and a manual new-user walkthrough.

### Explicitly excluded from the first release

- Subtracting materials already in the player's inventory.
- Saving, sharing, exporting, or comparing plans.
- Optimizing a recipe route by price, rarity, travel time, or player inventory.
- Acquisition advice such as Pal drops, merchants, map locations, or farming routes.
- Live third-party requests from the browser.
- A broad responsive/navbar redesign.
- Treating dropped or purchased intermediates as alternate crafting recipes. The first release answers “what must I craft from base inputs,” not “what is every way to obtain this item.”

## Versioned data contract

Create `app/src/data/crafting.ts` for typed accessors and `app/src/data/json/crafting.json` for the bundled snapshot.

Suggested normalized contract:

```ts
type CraftingEntityKind = 'material' | 'item' | 'structure';

interface CraftingCatalog {
  schemaVersion: 1;
  gameVersion: string;
  generatedAt: string;
  sources: Array<{
    name: string;
    url: string;
    retrievedAt: string;
  }>;
  entities: CraftingEntity[];
  recipes: CraftingRecipe[];
}

interface CraftingEntity {
  id: string; // stable internal/game ID where available
  kind: CraftingEntityKind;
  names: { en: string; 'pt-BR'?: string };
  iconName?: string;
  selectable: boolean;
}

interface CraftingRecipe {
  id: string;
  output: { entityId: string; quantity: number };
  ingredients: Array<{ entityId: string; quantity: number }>;
  stationIds: string[];
  technologyLevel?: number;
  sourceUrl: string;
  isDefault: boolean;
}
```

Data rules:

- IDs, quantities, and output yields are domain data and must never be inferred from display names in the planner.
- Quantities and yields must be positive integers.
- Each entity/recipe ID is unique; every referenced entity exists.
- A craftable target has at least one recipe. An entity with no selected/available recipe is a raw leaf.
- Multiple stations with the same output, yield, and ingredients are one recipe with multiple `stationIds`, not user-facing alternatives.
- Recipes with different ingredients or yields are real alternatives and have distinct IDs.
- Exactly one recipe per output is the deterministic default. If the source has no preferred route, pick the normalized recipe with the lexicographically smallest ID and record that policy in code.
- Catalog metadata is shown in the page and asserted by tests so version drift is visible.

## Data provenance gate

Do this before implementing the UI.

1. Use Pocketpair's current technology-ID list for stable IDs/names where available: `https://docs.palworldgame.com/settings-and-operation/technologyids/`.
2. Use a single, current recipe dataset for quantities/yields and snapshot it into the repository. PalDB currently labels its pages as v1.0.0 (2026-07-10), and is suitable for the golden fixture: `https://paldb.cc/en/Gigantic_Furnace`, `https://paldb.cc/en/Computer`, `https://paldb.cc/en/Bio_Battery`, `https://paldb.cc/en/Carbon_Fiber`, `https://paldb.cc/en/Circuit_Board`, `https://paldb.cc/en/Polymer`, and `https://paldb.cc/en/Plasteel`.
3. Do not silently combine sources. The current Wiki.gg Gigantic Furnace page exposes a conflicting older/different recipe, although Wiki.gg's Cargo schema is otherwise useful for understanding recipe fields: `https://palworld.wiki.gg/wiki/Template:Crafting_Recipe` and `https://palworld.wiki.gg/wiki/Module:Crafting_Recipe`.
4. Before importing a full third-party catalog or reusing its images, confirm its reuse/attribution terms. Store source URLs and retrieval date in the JSON regardless.
5. Prefer a repeatable normalization script at `app/scripts/update-crafting-data.mjs` if the selected source exposes structured/exported data. The script should fetch/read raw source data, normalize/dedupe it, validate it, write deterministic JSON, and print counts. If the source has no stable structured export, use a reviewed static snapshot rather than fragile runtime scraping.
6. Keep any temporary raw exports in `.memory/scratch/`; only the normalized, reviewed catalog belongs in tracked application data.

The referenced ChatGPT answer is an acceptance example, not the source of truth. Its default coal route currently agrees with the PalDB v1.0.0 pages and should become a golden test after the snapshot is reviewed:

| Raw material | Quantity for Gigantic Furnace x1 |
|---|---:|
| Ore | 978 |
| Crude Oil | 372 |
| High Quality Pal Oil | 248 |
| Sulfur | 124 |
| Coal | 144 |
| Flame Organ | 248 |
| Pure Quartz | 48 |
| Electric Organ | 24 |

The ordered intermediates for that default route should include Refined Ingot, Carbon Fiber, Bio Battery, Polymer, Circuit Board, Plasteel, Computer, and finally Gigantic Furnace. The exact display order among independent steps must be deterministic.

## Planner domain and algorithm

Create `app/src/lib/crafting.ts` as pure TypeScript with no React or localization dependencies.

Suggested public API:

```ts
interface CraftingPlanInput {
  targetId: string;
  quantity: number;
  selectedRecipeIds?: Record<string, string>; // output entity ID -> recipe ID
}

interface CraftingPlan {
  target: Requirement;
  rawMaterials: Requirement[];
  steps: CraftingStep[];
  warnings: CraftingWarning[];
}

function buildCraftingPlan(
  catalog: CraftingCatalog,
  input: CraftingPlanInput,
): CraftingPlan;
```

Algorithm requirements:

1. Validate target, quantity, and explicit recipe selections. Return typed warnings/errors rather than partial `NaN` results.
2. Resolve one recipe per reachable craftable entity: explicit selection first, then catalog default.
3. Build the reachable directed graph with edges `output -> ingredient` and detect cycles before calculating totals. A cycle is invalid source data and must produce a clear planner warning.
4. Topologically order the graph with all consumers before their dependencies. This is essential for shared intermediates: all demand for an intermediate must be accumulated before its batch count is rounded.
5. Initialize demand for the selected target. For each craftable entity in topological order:
   - `craftCount = ceil(requiredQuantity / outputQuantity)`;
   - `producedQuantity = craftCount * outputQuantity`;
   - `surplus = producedQuantity - requiredQuantity`;
   - add `ingredient.quantity * craftCount` to each ingredient's accumulated demand.
6. Entities without a resolved recipe are raw leaves and populate the aggregated `rawMaterials` list.
7. Reverse the craftable portion of the topological order for the UI so dependencies appear before consumers and the final target is last.
8. Use stable tie-breakers (normalized entity ID, then recipe ID) so JSON order does not change output.
9. Recompute from scratch when quantity or any recipe selection changes; do not incrementally mutate prior totals.

Important edge cases:

- Shared dependencies reached through two branches must be aggregated before applying batch yields.
- A target can itself be a material/intermediate.
- Alternate recipes can introduce or remove whole subtrees (for example, Carbon Fiber from coal versus charcoal; if charcoal is craftable, recursively expand it to wood).
- A recipe output greater than one can create a displayed surplus.
- Duplicate ingredient rows in source data must be normalized or rejected.
- Missing entity references, missing default recipes, empty recipes, cycles, zero/negative quantities, and an explicit recipe that does not produce the requested entity must be covered by tests.

## UI design and file map

### App integration

- `app/src/hooks/useAppState.ts`: add `'crafting'` to `View`. Do not persist planner selections in MVP; existing `currentView` persistence is enough.
- `app/src/components/Navbar.tsx`: add a Crafting Planner nav item, using a distinct Lucide icon such as `Factory` or `Hammer`.
- `app/src/App.tsx`: render the new page for the `crafting` view.

### Page and components

- `app/src/pages/CraftingPlanner.tsx`: state orchestration, catalog filtering, selected target/quantity/recipes, memoized call to `buildCraftingPlan`.
- `app/src/components/crafting/TargetPicker.tsx`: searchable target control and category chips (`all`, `items`, `structures`). Search current-locale name, canonical English name, and ID.
- `app/src/components/crafting/RawMaterialsPanel.tsx`: compact aggregated shopping list with icons, names, and quantities.
- `app/src/components/crafting/CraftingSteps.tsx`: numbered dependency-first steps.
- `app/src/components/crafting/CraftingStepCard.tsx`: required/produced quantities, craft count, surplus, station, technology level, and alternate-recipe control when applicable.
- `app/src/components/crafting/index.ts`: exports.

Page behavior:

- Initial state explains what to select; do not default to an arbitrary target.
- Header shows title, concise description, and `Palworld data <version>`.
- Target picker and quantity remain visible above results.
- With a target selected, use two columns at the existing desktop content widths: raw materials in the narrower column, crafting steps in the wider column. Stack when the main content area is narrow.
- Changing an alternate recipe updates the raw totals and all affected steps immediately.
- Missing images use a stable fallback and never hide the entity name.
- Reuse existing CSS variables, spacing, card treatment, focus styling, and motion restraint. Respect `prefers-reduced-motion` if new animation is added.
- Do not make the unrelated persistent Pal search/list behavior worse; a separate shell cleanup can happen later.

### Images

Do not import `getItemImageUrl` directly from `data/drops.ts` into the planner. Either:

- extract a shared game-entity image resolver to `app/src/lib/game-entity-images.ts`, keeping existing Boss Drops behavior compatible; or
- let the crafting catalog carry an `iconName`/path and add a crafting-specific resolver.

Structures and materials need different fallback patterns. Show a generic package/factory icon if a remote asset fails.

### Localization

- Add all planner UI keys to `app/src/i18n/types.ts`, `locales/en.ts`, and `locales/pt-BR.ts` in the same change.
- Add `nav.crafting` and keys for title, description, search, categories, quantity, raw materials, steps, crafts, produces, surplus, station, technology level, alternate recipe, empty state, no results, invalid data, and version label.
- Entity names come from catalog `names`; fall back to English, then ID. Keep translation keys for UI copy only.
- Number formatting should use `Intl.NumberFormat(locale)`.

## Vertical implementation slices

### Slice 1 - Data contract and golden fixture

- Add types, normalized catalog accessors, validator, and a reviewed fixture containing the Gigantic Furnace's complete transitive recipe graph.
- Record schema/game/source metadata.
- Add tests for all validation rules and the exact default golden totals above.
- Add an alternate Carbon Fiber route test.

Exit criterion: invalid data fails clearly and the fixture can be queried without any UI code.

### Slice 2 - Pure planning engine

- Implement graph resolution, cycle detection, topological demand aggregation, batch rounding, raw leaves, reverse crafting order, surplus, warnings, and deterministic sorting.
- Test synthetic graphs before relying on the real fixture.

Exit criterion: all algorithm tests and both Gigantic Furnace routes pass.

### Slice 3 - Complete versioned catalog

- Normalize the intended full item/structure recipe dataset using the provenance gate above.
- Deduplicate station-only variants, designate defaults, add localized names/fallbacks, and validate every reference.
- Add catalog count assertions/snapshots so an accidental empty or partial update fails tests.

Exit criterion: every selectable entity builds a plan or yields an intentional, typed warning; no silent broken graph remains.

### Slice 4 - Page and app integration

- Add the view/nav/i18n integration and page components.
- Connect quantity and alternate recipe controls to the pure engine.
- Add component tests for empty state, selection, quantity changes, recipe changes, and localized search.

Exit criterion: the golden scenario works through visible UI in both locales and themes.

### Slice 5 - Hardening and documentation

- Run automated checks and the new-user walkthrough in `.memory/verify.md`.
- Update root `README.md` feature/data/test sections, including catalog version and update procedure.
- Review the final diff for generated-data noise, unrelated refactors, source attribution, and accessibility.

Exit criterion: every item in `.memory/verify.md` is checked and `.memory/progress.md` reflects the final state.

## Implementation guardrails for the handoff agent

- Do not derive the plan with naive recursive rounding; it overcounts shared batch-produced intermediates.
- Do not fetch recipe data in React components or at application runtime.
- Do not use display names as graph keys.
- Do not treat different workbenches with identical ingredients as different material routes.
- Do not silently fall back to a random recipe when a persisted/explicit selection is invalid.
- Do not copy the referenced conversation's numbers without validating them against the committed source snapshot.
- Keep algorithm/data changes separate from visual refinements so failures are easy to isolate.
- Update `.memory/progress.md` after each slice and `.memory/verify.md` as checks pass.

## Likely follow-ups after MVP

- Inventory subtraction and a “still needed” column.
- Saved/shareable plans.
- Drop/merchant/location links by reusing Boss Drops data.
- Route optimization by preferred raw resource.
- URL-based navigation/deep links if the application adopts a router.
- Shared item/entity registry to remove duplicate names/images across Drops and Crafting.

