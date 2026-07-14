# Crafting Planner Verification

## Definition of done

The feature is done only when a new user can select any supported craftable item or structure, request a quantity, understand the complete raw shopping list, follow dependency-safe crafting steps, change an alternate recipe, and see correct recalculated results without a network dependency.

## Automated checks

Run from `app/` and record results in `.memory/progress.md`:

```powershell
npm run test:run
npm run lint
npm run build
```

Required test coverage:

- [x] Catalog schema metadata and non-empty source provenance.
- [x] Unique entity and recipe IDs.
- [x] Positive integer quantities and yields.
- [x] All entity/station/ingredient references resolve.
- [x] Exactly one deterministic default per craftable output.
- [x] Identical recipes at different stations are deduplicated.
- [x] Direct raw input plan.
- [x] Multi-level recipe plan.
- [x] Shared intermediate demand aggregates before batch rounding.
- [x] Batch output reports craft count, production, and surplus.
- [x] Alternative recipe changes all affected raw totals/steps.
- [x] Targeting an intermediate works.
- [x] Cycle detection produces a typed error/warning.
- [x] Invalid quantity, target, and recipe selection fail clearly.
- [x] Output order remains deterministic when source arrays are reordered.
- [x] Every selectable catalog target builds or returns an intentional typed warning.
- [x] Crafting page empty state and target selection.
- [x] Quantity change recalculation.
- [x] Alternate recipe recalculation.
- [x] Localized search/name fallback.

## Golden Gigantic Furnace checks

With the reviewed PalDB v1.0.0-compatible fixture, target `Gigantic Furnace x1`, defaulting Carbon Fiber to the coal recipe:

- [x] Raw totals are exactly: Ore 978; Crude Oil 372; High Quality Pal Oil 248; Sulfur 124; Coal 144; Flame Organ 248; Pure Quartz 48; Electric Organ 24.
- [x] No intermediate (Plasteel, Polymer, Computer, Circuit Board, Bio Battery, Carbon Fiber, Refined Ingot) appears in raw totals.
- [x] Each intermediate appears once in the crafting steps after demand aggregation.
- [x] Every dependency precedes the step that consumes it.
- [x] Gigantic Furnace is the last step.
- [x] Switching Carbon Fiber to its charcoal route removes the Carbon Fiber coal demand, adds the recursively expanded charcoal/wood demand, and leaves the Refined Ingot coal demand intact.
- [x] Target quantity `2` recalculates from source quantities rather than multiplying rendered strings.

If the committed source snapshot intentionally differs from this v1.0.0 fixture, stop and update the fixture, plan note, source version, and expected numbers together after human review. Do not silently change only the test.

## Manual new-user walkthrough

- [ ] Start on another page, open Crafting Planner from the navbar, reload, and confirm the persisted view remains valid.
- [ ] Confirm the initial empty state explains the next action.
- [ ] Search “Gigantic Furnace” in English and its localized name in Portuguese if available.
- [ ] Filter between all/items/structures without losing a valid selection unexpectedly.
- [ ] Select Gigantic Furnace, keep quantity 1, and compare the visible values with the golden checks.
- [ ] Read the steps from top to bottom and confirm they can be performed in that order.
- [ ] Change the Carbon Fiber recipe and confirm affected values update immediately.
- [ ] Change quantity to 2, then try invalid text, zero, and a very large integer; confirm the UI prevents or explains invalid input.
- [ ] Select a simple intermediate item and confirm the final step/summary changes appropriately.
- [ ] Test a recipe with output yield greater than 1 and confirm surplus is understandable.
- [ ] Switch EN/PT-BR and confirm UI labels, entity names/fallbacks, search, and number formatting.
- [ ] Switch dark/light themes and confirm contrast, borders, focus rings, and disabled/error states.
- [ ] Use keyboard-only navigation for target search, quantity, alternative recipes, and step expansion if collapsible.
- [ ] Check at the repository's normal desktop width and a narrower content width; results may stack but must not overlap the fixed sidebar.
- [ ] Force an entity image failure and confirm a visible fallback plus readable name.
- [ ] Confirm the page makes no runtime request for recipe JSON and still works after the static assets are loaded.
- [ ] Confirm the browser console has no React key, data validation, uncaught promise, or image-loop errors.

## Regression checks

- [ ] Breeding selection and Pal sidebar still work.
- [ ] Packages and Completed localStorage data survive the new view.
- [ ] Mounts, Pals, Boss Drops, and Builds still render.
- [ ] Theme and locale persistence still work.
- [ ] Existing drop-item images still resolve if the image helper was extracted.
- [ ] A legacy persisted `currentView` still loads without resetting unrelated state.
