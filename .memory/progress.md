# Crafting Planner Progress

## Current status

- Product implementation: complete for MVP on branch `feature/crafting-planner` (worktree `find-my-pal-crafting`).
- Automated checks: `npm run test:run`, `npm run lint`, and `npm run build` pass from `app/`.
- Blockers: none for MVP. Expanding beyond the curated PalDB snapshot to a full game-wide recipe dump needs a structured source export (PalDB has no public JSON API).
- Next concrete step: open a PR from `feature/crafting-planner` into `main`, then optional manual walkthrough in `.memory/verify.md`.

## Completed planning work

- [x] Read the persistent-state skill and use its durable handoff files.
- [x] Inspect the app shell, view state, navigation, localization, current data layout, item imagery, scripts, and tests.
- [x] Confirm that the feature fits the existing static React/Vite architecture.
- [x] Identify the absence of a recipe/building graph in the repository.
- [x] Define the MVP boundary and excluded follow-ups.
- [x] Define a versioned normalized catalog contract.
- [x] Define the non-recursive-rounding graph algorithm needed for correct shared dependencies and batch yields.
- [x] Define the page/component integration points.
- [x] Define vertical slices and verification requirements.
- [x] Verify the Gigantic Furnace default coal-route totals against a current PalDB v1.0.0 recipe chain for use as a future golden fixture.
- [x] Record the conflicting wiki recipe as a source-version risk.

## Atomic implementation checklist

### Slice 1 - Catalog foundation

- [x] Confirm source reuse/attribution terms and the intended Palworld version.
- [x] Add `CraftingCatalog`, `CraftingEntity`, and `CraftingRecipe` types.
- [x] Add stable catalog indexes/accessors by entity ID, recipe ID, and output ID.
- [x] Add catalog validation for IDs, references, positive quantities/yields, defaults, duplicates, and empty ingredients.
- [x] Add `app/src/data/json/crafting.json` with schema/game/source metadata.
- [x] Seed and review the complete Gigantic Furnace transitive graph.
- [x] Mark the coal Carbon Fiber recipe as the golden default; include the charcoal alternative.
- [x] Add data validation tests.
- [x] Add a golden data test for the direct Gigantic Furnace recipe and each intermediate recipe.

### Slice 2 - Planning engine

- [x] Add pure planner input/result/warning types.
- [x] Resolve explicit recipes and deterministic defaults.
- [x] Build the reachable output-to-ingredient graph.
- [x] Detect and report cycles.
- [x] Topologically order consumers before dependencies.
- [x] Aggregate all demand before rounding recipe batches.
- [x] Calculate craft count, produced count, and surplus.
- [x] Collect and sort raw leaves.
- [x] Reverse craftable order for dependency-first display.
- [x] Add tests for direct raw input, multi-level graph, shared intermediate, batch yield, surplus, alternative routes, target intermediate, cycle, invalid selection, missing reference, and deterministic ordering.
- [x] Add golden tests for Gigantic Furnace x1 and x2.

### Slice 3 - Complete catalog

- [x] Add/update the repeatable data-normalization script or document the reviewed static import procedure.
- [x] Import a curated PalDB-reviewed recipe catalog for materials/items/structures in scope (27 selectable targets; not every item in the game).
- [x] Collapse station-only duplicate recipes.
- [x] Designate one deterministic default for every craftable output.
- [x] Add English and Brazilian Portuguese entity names with fallback behavior.
- [x] Add icon names/paths without coupling to Boss Drops.
- [x] Add minimum count assertions and full reference validation.
- [x] Generate every selectable target in a test and assert success or an intentional typed warning.
- [x] Record source version, retrieval date, and update instructions.

### Slice 4 - User interface

- [x] Add `crafting` to the `View` union.
- [x] Add the navigation item and translation.
- [x] Add `CraftingPlanner` rendering in `App.tsx`.
- [x] Add target search and item/structure filters.
- [x] Add integer quantity control with accessible label and validation.
- [x] Add the raw-material summary panel.
- [x] Add numbered crafting step cards.
- [x] Add alternate recipe selectors only where alternatives exist.
- [x] Recalculate immediately on quantity/recipe change.
- [x] Show station, technology level, produced quantity, and surplus when present.
- [x] Show game-data version/provenance metadata.
- [x] Add loading-independent empty/no-results/error states.
- [x] Add robust image fallback.
- [x] Add all EN/PT-BR UI keys and localized entity-name lookup.
- [x] Add component tests for initial, selected, recalculated, and localized states.

### Slice 5 - Verification and docs

- [x] Complete every automated check in `.memory/verify.md`.
- [ ] Complete the manual new-user walkthrough in both locales/themes (pending human/browser pass).
- [ ] Inspect the browser console for runtime/image/data errors (pending human/browser pass).
- [x] Update root `README.md` with the feature and data refresh workflow.
- [x] Review the diff for unrelated edits and generated churn.
- [x] Update this file with completed, in-progress, blocked, and next-step status.

## Automated check results (2026-07-14)

```
npm run test:run  # 68 passed
npm run lint      # clean
npm run build     # success
node scripts/update-crafting-data.mjs  # entities=57 recipes=28 selectable=27
```
