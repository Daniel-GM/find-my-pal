import craftingCatalogJson from './json/crafting.json';

export type CraftingEntityKind = 'material' | 'item' | 'structure';

export interface CraftingEntityNames {
  en: string;
  'pt-BR'?: string;
}

export interface CraftingEntity {
  id: string;
  kind: CraftingEntityKind;
  names: CraftingEntityNames;
  iconName?: string;
  selectable: boolean;
}

export interface CraftingRecipeIO {
  entityId: string;
  quantity: number;
}

export interface CraftingRecipe {
  id: string;
  output: CraftingRecipeIO;
  ingredients: CraftingRecipeIO[];
  stationIds: string[];
  technologyLevel?: number;
  sourceUrl: string;
  isDefault: boolean;
}

export interface CraftingSource {
  name: string;
  url: string;
  retrievedAt: string;
}

export interface CraftingCatalog {
  schemaVersion: 1;
  gameVersion: string;
  generatedAt: string;
  sources: CraftingSource[];
  entities: CraftingEntity[];
  recipes: CraftingRecipe[];
}

export type CatalogValidationIssueCode =
  | 'empty_catalog'
  | 'missing_metadata'
  | 'duplicate_entity_id'
  | 'duplicate_recipe_id'
  | 'invalid_quantity'
  | 'empty_ingredients'
  | 'duplicate_ingredient'
  | 'missing_entity_ref'
  | 'missing_station_ref'
  | 'missing_default_recipe'
  | 'multiple_default_recipes'
  | 'default_recipe_mismatch'
  | 'selectable_without_recipe';

export interface CatalogValidationIssue {
  code: CatalogValidationIssueCode;
  message: string;
  entityId?: string;
  recipeId?: string;
}

export interface CatalogValidationResult {
  ok: boolean;
  issues: CatalogValidationIssue[];
}

export interface CraftingCatalogIndex {
  catalog: CraftingCatalog;
  entitiesById: Map<string, CraftingEntity>;
  recipesById: Map<string, CraftingRecipe>;
  recipesByOutputId: Map<string, CraftingRecipe[]>;
  defaultRecipeByOutputId: Map<string, CraftingRecipe>;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

/**
 * Default recipe policy: exactly one `isDefault: true` per output.
 * If source data has no preferred route, pick the lexicographically smallest recipe ID.
 */
export function designateDefaultRecipeIds(recipes: CraftingRecipe[]): Map<string, string> {
  const byOutput = new Map<string, CraftingRecipe[]>();
  for (const recipe of recipes) {
    const list = byOutput.get(recipe.output.entityId) ?? [];
    list.push(recipe);
    byOutput.set(recipe.output.entityId, list);
  }

  const defaults = new Map<string, string>();
  for (const [outputId, list] of byOutput) {
    const marked = list.filter((r) => r.isDefault);
    if (marked.length === 1) {
      defaults.set(outputId, marked[0].id);
      continue;
    }
    const sorted = [...list].sort((a, b) => a.id.localeCompare(b.id));
    defaults.set(outputId, sorted[0].id);
  }
  return defaults;
}

export function validateCraftingCatalog(catalog: CraftingCatalog): CatalogValidationResult {
  const issues: CatalogValidationIssue[] = [];

  if (!catalog.entities?.length && !catalog.recipes?.length) {
    issues.push({ code: 'empty_catalog', message: 'Catalog has no entities or recipes' });
  }

  if (catalog.schemaVersion !== 1) {
    issues.push({ code: 'missing_metadata', message: `Unsupported schemaVersion: ${String(catalog.schemaVersion)}` });
  }
  if (!catalog.gameVersion?.trim()) {
    issues.push({ code: 'missing_metadata', message: 'gameVersion is required' });
  }
  if (!catalog.generatedAt?.trim()) {
    issues.push({ code: 'missing_metadata', message: 'generatedAt is required' });
  }
  if (!catalog.sources?.length) {
    issues.push({ code: 'missing_metadata', message: 'At least one source is required' });
  } else {
    for (const source of catalog.sources) {
      if (!source.name?.trim() || !source.url?.trim() || !source.retrievedAt?.trim()) {
        issues.push({
          code: 'missing_metadata',
          message: `Source is incomplete: ${JSON.stringify(source)}`,
        });
      }
    }
  }

  const entitiesById = new Map<string, CraftingEntity>();
  for (const entity of catalog.entities ?? []) {
    if (!entity.id?.trim()) {
      issues.push({ code: 'duplicate_entity_id', message: 'Entity id is empty' });
      continue;
    }
    if (entitiesById.has(entity.id)) {
      issues.push({
        code: 'duplicate_entity_id',
        message: `Duplicate entity id: ${entity.id}`,
        entityId: entity.id,
      });
      continue;
    }
    entitiesById.set(entity.id, entity);
  }

  const recipesById = new Map<string, CraftingRecipe>();
  const recipesByOutputId = new Map<string, CraftingRecipe[]>();

  for (const recipe of catalog.recipes ?? []) {
    if (!recipe.id?.trim()) {
      issues.push({ code: 'duplicate_recipe_id', message: 'Recipe id is empty' });
      continue;
    }
    if (recipesById.has(recipe.id)) {
      issues.push({
        code: 'duplicate_recipe_id',
        message: `Duplicate recipe id: ${recipe.id}`,
        recipeId: recipe.id,
      });
      continue;
    }
    recipesById.set(recipe.id, recipe);

    if (!isPositiveInteger(recipe.output?.quantity)) {
      issues.push({
        code: 'invalid_quantity',
        message: `Recipe ${recipe.id} has invalid output quantity`,
        recipeId: recipe.id,
      });
    }

    if (!recipe.ingredients?.length) {
      issues.push({
        code: 'empty_ingredients',
        message: `Recipe ${recipe.id} has no ingredients`,
        recipeId: recipe.id,
      });
    }

    const seenIngredients = new Set<string>();
    for (const ingredient of recipe.ingredients ?? []) {
      if (!isPositiveInteger(ingredient.quantity)) {
        issues.push({
          code: 'invalid_quantity',
          message: `Recipe ${recipe.id} has invalid ingredient quantity for ${ingredient.entityId}`,
          recipeId: recipe.id,
          entityId: ingredient.entityId,
        });
      }
      if (seenIngredients.has(ingredient.entityId)) {
        issues.push({
          code: 'duplicate_ingredient',
          message: `Recipe ${recipe.id} duplicates ingredient ${ingredient.entityId}`,
          recipeId: recipe.id,
          entityId: ingredient.entityId,
        });
      }
      seenIngredients.add(ingredient.entityId);

      if (!entitiesById.has(ingredient.entityId)) {
        issues.push({
          code: 'missing_entity_ref',
          message: `Recipe ${recipe.id} references missing ingredient ${ingredient.entityId}`,
          recipeId: recipe.id,
          entityId: ingredient.entityId,
        });
      }
    }

    if (!entitiesById.has(recipe.output?.entityId)) {
      issues.push({
        code: 'missing_entity_ref',
        message: `Recipe ${recipe.id} references missing output ${recipe.output?.entityId}`,
        recipeId: recipe.id,
        entityId: recipe.output?.entityId,
      });
    }

    for (const stationId of recipe.stationIds ?? []) {
      if (!entitiesById.has(stationId)) {
        issues.push({
          code: 'missing_station_ref',
          message: `Recipe ${recipe.id} references missing station ${stationId}`,
          recipeId: recipe.id,
          entityId: stationId,
        });
      }
    }

    const outputList = recipesByOutputId.get(recipe.output.entityId) ?? [];
    outputList.push(recipe);
    recipesByOutputId.set(recipe.output.entityId, outputList);
  }

  for (const [outputId, list] of recipesByOutputId) {
    const defaults = list.filter((r) => r.isDefault);
    if (defaults.length === 0) {
      issues.push({
        code: 'missing_default_recipe',
        message: `Output ${outputId} has no default recipe`,
        entityId: outputId,
      });
    } else if (defaults.length > 1) {
      issues.push({
        code: 'multiple_default_recipes',
        message: `Output ${outputId} has ${defaults.length} default recipes`,
        entityId: outputId,
      });
    } else if (defaults[0].output.entityId !== outputId) {
      issues.push({
        code: 'default_recipe_mismatch',
        message: `Default recipe ${defaults[0].id} does not produce ${outputId}`,
        recipeId: defaults[0].id,
        entityId: outputId,
      });
    }
  }

  for (const entity of entitiesById.values()) {
    if (entity.selectable && !recipesByOutputId.has(entity.id)) {
      issues.push({
        code: 'selectable_without_recipe',
        message: `Selectable entity ${entity.id} has no recipes`,
        entityId: entity.id,
      });
    }
  }

  return { ok: issues.length === 0, issues };
}

export function indexCraftingCatalog(catalog: CraftingCatalog): CraftingCatalogIndex {
  const entitiesById = new Map(catalog.entities.map((e) => [e.id, e]));
  const recipesById = new Map(catalog.recipes.map((r) => [r.id, r]));
  const recipesByOutputId = new Map<string, CraftingRecipe[]>();
  const defaultRecipeByOutputId = new Map<string, CraftingRecipe>();

  for (const recipe of catalog.recipes) {
    const list = recipesByOutputId.get(recipe.output.entityId) ?? [];
    list.push(recipe);
    recipesByOutputId.set(recipe.output.entityId, list);
    if (recipe.isDefault) {
      defaultRecipeByOutputId.set(recipe.output.entityId, recipe);
    }
  }

  for (const [outputId, list] of recipesByOutputId) {
    list.sort((a, b) => a.id.localeCompare(b.id));
    if (!defaultRecipeByOutputId.has(outputId)) {
      defaultRecipeByOutputId.set(outputId, list[0]);
    }
  }

  return {
    catalog,
    entitiesById,
    recipesById,
    recipesByOutputId,
    defaultRecipeByOutputId,
  };
}

export function getEntityName(entity: CraftingEntity, locale: 'en' | 'pt-BR'): string {
  if (locale === 'pt-BR' && entity.names['pt-BR']) {
    return entity.names['pt-BR'];
  }
  return entity.names.en || entity.id;
}

export function getSelectableEntities(catalog: CraftingCatalog): CraftingEntity[] {
  return catalog.entities
    .filter((e) => e.selectable)
    .sort((a, b) => a.names.en.localeCompare(b.names.en) || a.id.localeCompare(b.id));
}

export const CRAFTING_CATALOG = craftingCatalogJson as CraftingCatalog;

const indexed = indexCraftingCatalog(CRAFTING_CATALOG);

export const craftingCatalogIndex = indexed;

export function getCraftingEntity(id: string): CraftingEntity | undefined {
  return indexed.entitiesById.get(id);
}

export function getRecipesForOutput(outputId: string): CraftingRecipe[] {
  return indexed.recipesByOutputId.get(outputId) ?? [];
}

export function getDefaultRecipe(outputId: string): CraftingRecipe | undefined {
  return indexed.defaultRecipeByOutputId.get(outputId);
}
