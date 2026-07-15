/**
 * Normalize and validate a reviewed crafting catalog snapshot.
 *
 * Usage:
 *   node scripts/update-crafting-data.mjs
 *   node scripts/update-crafting-data.mjs path/to/raw-catalog.json
 *   node scripts/update-crafting-data.mjs --fetch-buildings
 *
 * Without an input path, validates the committed catalog and prints counts.
 * With an input path, validates/normalizes it and writes app/src/data/json/crafting.json.
 *
 * Put temporary raw exports under .memory/scratch/ (gitignored).
 * Prefer a single reviewed source (PalDB). Do not silently merge conflicting wiki recipes.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchPaldbBuildings, mergeBuildingsIntoCatalog } from './paldb-buildings.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const catalogPath = resolve(__dirname, '../src/data/json/crafting.json');
const args = process.argv.slice(2);
const inputArg = args.find((arg) => !arg.startsWith('--'));
const inputPath = inputArg ? resolve(process.cwd(), inputArg) : catalogPath;
const fetchBuildings = args.includes('--fetch-buildings');

function isPositiveInteger(value) {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function validate(catalog) {
  const issues = [];
  if (catalog.schemaVersion !== 1) issues.push('schemaVersion must be 1');
  if (!catalog.gameVersion) issues.push('gameVersion required');
  if (!catalog.generatedAt) issues.push('generatedAt required');
  if (!Array.isArray(catalog.sources) || catalog.sources.length === 0) {
    issues.push('sources required');
  }

  const entityIds = new Set();
  for (const entity of catalog.entities ?? []) {
    if (entityIds.has(entity.id)) issues.push(`duplicate entity ${entity.id}`);
    entityIds.add(entity.id);
  }

  const recipeIds = new Set();
  const defaultsByOutput = new Map();
  for (const recipe of catalog.recipes ?? []) {
    if (recipeIds.has(recipe.id)) issues.push(`duplicate recipe ${recipe.id}`);
    recipeIds.add(recipe.id);
    if (!isPositiveInteger(recipe.output?.quantity)) {
      issues.push(`invalid output qty ${recipe.id}`);
    }
    if (!recipe.ingredients?.length) issues.push(`empty ingredients ${recipe.id}`);
    const seen = new Set();
    for (const ing of recipe.ingredients ?? []) {
      if (!isPositiveInteger(ing.quantity)) issues.push(`invalid ingredient qty ${recipe.id}`);
      if (seen.has(ing.entityId)) issues.push(`duplicate ingredient ${recipe.id}/${ing.entityId}`);
      seen.add(ing.entityId);
      if (!entityIds.has(ing.entityId)) issues.push(`missing ingredient ${ing.entityId}`);
    }
    if (!entityIds.has(recipe.output?.entityId)) {
      issues.push(`missing output ${recipe.output?.entityId}`);
    }
    for (const stationId of recipe.stationIds ?? []) {
      if (!entityIds.has(stationId)) issues.push(`missing station ${stationId}`);
    }
    if (recipe.isDefault) {
      const prev = defaultsByOutput.get(recipe.output.entityId) ?? 0;
      defaultsByOutput.set(recipe.output.entityId, prev + 1);
    }
  }

  for (const [outputId, count] of defaultsByOutput) {
    if (count !== 1) issues.push(`default count ${count} for ${outputId}`);
  }

  for (const entity of catalog.entities ?? []) {
    if (!entity.selectable) continue;
    const hasRecipe = (catalog.recipes ?? []).some((r) => r.output.entityId === entity.id);
    if (!hasRecipe) issues.push(`selectable without recipe ${entity.id}`);
  }

  return issues;
}

function normalize(catalog) {
  const entities = [...catalog.entities].sort((a, b) => a.id.localeCompare(b.id));
  const recipes = [...catalog.recipes]
    .map((recipe) => ({
      ...recipe,
      ingredients: [...recipe.ingredients].sort((a, b) => a.entityId.localeCompare(b.entityId)),
      stationIds: [...(recipe.stationIds ?? [])].sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  return {
    ...catalog,
    schemaVersion: 1,
    entities,
    recipes,
  };
}

let raw = JSON.parse(readFileSync(inputPath, 'utf8'));
if (fetchBuildings) {
  const fetched = await fetchPaldbBuildings();
  console.log(`fetchedBuildings=${fetched.english.length}`);
  raw = mergeBuildingsIntoCatalog(raw, fetched);
}
const normalized = normalize(raw);
const issues = validate(normalized);

if (issues.length) {
  console.error('Validation failed:');
  for (const issue of issues) console.error(` - ${issue}`);
  process.exit(1);
}

const selectable = normalized.entities.filter((e) => e.selectable).length;
console.log(`entities=${normalized.entities.length}`);
console.log(`recipes=${normalized.recipes.length}`);
console.log(`selectable=${selectable}`);
console.log(`gameVersion=${normalized.gameVersion}`);
console.log(`sources=${normalized.sources.length}`);

if (fetchBuildings || inputPath !== catalogPath || args.includes('--write')) {
  writeFileSync(catalogPath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${catalogPath}`);
} else {
  console.log('Catalog OK (pass a raw JSON path or --write to overwrite crafting.json)');
}
