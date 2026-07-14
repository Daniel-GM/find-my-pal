import type {
  CraftingCatalog,
  CraftingEntity,
  CraftingRecipe,
} from '@/data/crafting';
import { indexCraftingCatalog } from '@/data/crafting';

export interface CraftingPlanInput {
  targetId: string;
  quantity: number;
  selectedRecipeIds?: Record<string, string>;
}

export interface Requirement {
  entityId: string;
  quantity: number;
  entity: CraftingEntity;
}

export interface CraftingStep {
  entityId: string;
  entity: CraftingEntity;
  recipe: CraftingRecipe;
  requiredQuantity: number;
  craftCount: number;
  producedQuantity: number;
  surplus: number;
  ingredients: Requirement[];
}

export type CraftingWarningCode =
  | 'invalid_target'
  | 'invalid_quantity'
  | 'invalid_recipe_selection'
  | 'missing_default_recipe'
  | 'cycle_detected'
  | 'missing_entity';

export interface CraftingWarning {
  code: CraftingWarningCode;
  message: string;
  entityId?: string;
  recipeId?: string;
}

export interface CraftingPlan {
  target: Requirement | null;
  rawMaterials: Requirement[];
  steps: CraftingStep[];
  warnings: CraftingWarning[];
}

function emptyPlan(warnings: CraftingWarning[]): CraftingPlan {
  return { target: null, rawMaterials: [], steps: [], warnings };
}

function resolveRecipe(
  outputId: string,
  recipesByOutputId: Map<string, CraftingRecipe[]>,
  defaultRecipeByOutputId: Map<string, CraftingRecipe>,
  selectedRecipeIds: Record<string, string> | undefined,
  recipesById: Map<string, CraftingRecipe>,
  warnings: CraftingWarning[],
): CraftingRecipe | undefined {
  const explicitId = selectedRecipeIds?.[outputId];
  if (explicitId) {
    const explicit = recipesById.get(explicitId);
    if (!explicit || explicit.output.entityId !== outputId) {
      warnings.push({
        code: 'invalid_recipe_selection',
        message: `Recipe selection ${explicitId} does not produce ${outputId}`,
        entityId: outputId,
        recipeId: explicitId,
      });
      return undefined;
    }
    return explicit;
  }

  const fallback = defaultRecipeByOutputId.get(outputId);
  if (!fallback) {
    const alternatives = recipesByOutputId.get(outputId);
    if (alternatives?.length) {
      warnings.push({
        code: 'missing_default_recipe',
        message: `No default recipe for ${outputId}`,
        entityId: outputId,
      });
    }
  }
  return fallback;
}

/**
 * Kahn topological order of craftable nodes with consumers before dependencies.
 * Edges are output -> ingredient (among craftable nodes only).
 */
function topologicalConsumersFirst(
  craftableIds: string[],
  recipeByOutput: Map<string, CraftingRecipe>,
): { order: string[]; cycle: boolean } {
  const craftableSet = new Set(craftableIds);
  const indegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();

  for (const id of craftableIds) {
    indegree.set(id, 0);
    dependents.set(id, []);
  }

  for (const id of craftableIds) {
    const recipe = recipeByOutput.get(id);
    if (!recipe) continue;
    for (const ingredient of recipe.ingredients) {
      if (!craftableSet.has(ingredient.entityId)) continue;
      // edge: output -> ingredient (consumer depends on ingredient later in reverse display)
      // For consumers-before-dependencies processing: ingredient has edge FROM output?
      // Plan: "edges output -> ingredient" and "Topologically order consumers before dependencies"
      // So we process consumers first: when walking output->ingredient, consumers have edges pointing to deps,
      // meaning consumers should have lower indegree from deps... 
      // If edge is A->B meaning A before B in topo (consumer before dependency):
      // edge GiganticFurnace -> Plasteel means GF before Plasteel.
      // indegree[Plasteel]++, dependents from GF.
      indegree.set(ingredient.entityId, (indegree.get(ingredient.entityId) ?? 0) + 1);
      dependents.get(id)!.push(ingredient.entityId);
    }
  }

  const queue = craftableIds
    .filter((id) => (indegree.get(id) ?? 0) === 0)
    .sort((a, b) => a.localeCompare(b));
  const order: string[] = [];

  while (queue.length) {
    const current = queue.shift()!;
    order.push(current);
    const nextIds = [...(dependents.get(current) ?? [])].sort((a, b) => a.localeCompare(b));
    for (const next of nextIds) {
      const nextDegree = (indegree.get(next) ?? 0) - 1;
      indegree.set(next, nextDegree);
      if (nextDegree === 0) {
        queue.push(next);
        queue.sort((a, b) => a.localeCompare(b));
      }
    }
  }

  return { order, cycle: order.length !== craftableIds.length };
}

export function buildCraftingPlan(
  catalog: CraftingCatalog,
  input: CraftingPlanInput,
): CraftingPlan {
  const warnings: CraftingWarning[] = [];
  const index = indexCraftingCatalog(catalog);

  if (!Number.isInteger(input.quantity) || input.quantity < 1) {
    return emptyPlan([
      {
        code: 'invalid_quantity',
        message: `Quantity must be a positive integer, got ${String(input.quantity)}`,
      },
    ]);
  }

  const targetEntity = index.entitiesById.get(input.targetId);
  if (!targetEntity) {
    return emptyPlan([
      {
        code: 'invalid_target',
        message: `Unknown target entity: ${input.targetId}`,
        entityId: input.targetId,
      },
    ]);
  }

  const targetRequirement: Requirement = {
    entityId: targetEntity.id,
    quantity: input.quantity,
    entity: targetEntity,
  };

  // Resolve recipes for the reachable craftable subgraph
  const recipeByOutput = new Map<string, CraftingRecipe>();
  const toVisit = [input.targetId];
  const visited = new Set<string>();

  while (toVisit.length) {
    const entityId = toVisit.pop()!;
    if (visited.has(entityId)) continue;
    visited.add(entityId);

    if (!index.entitiesById.has(entityId)) {
      warnings.push({
        code: 'missing_entity',
        message: `Missing entity reference: ${entityId}`,
        entityId,
      });
      continue;
    }

    const recipes = index.recipesByOutputId.get(entityId);
    if (!recipes?.length) continue;

    const recipe = resolveRecipe(
      entityId,
      index.recipesByOutputId,
      index.defaultRecipeByOutputId,
      input.selectedRecipeIds,
      index.recipesById,
      warnings,
    );
    if (!recipe) {
      return { target: targetRequirement, rawMaterials: [], steps: [], warnings };
    }

    recipeByOutput.set(entityId, recipe);
    for (const ingredient of recipe.ingredients) {
      if (!visited.has(ingredient.entityId)) {
        toVisit.push(ingredient.entityId);
      }
    }
  }

  const craftableIds = [...recipeByOutput.keys()].sort((a, b) => a.localeCompare(b));
  const { order, cycle } = topologicalConsumersFirst(craftableIds, recipeByOutput);
  if (cycle) {
    warnings.push({
      code: 'cycle_detected',
      message: 'Cycle detected in crafting dependency graph',
    });
    return { target: targetRequirement, rawMaterials: [], steps: [], warnings };
  }

  const demand = new Map<string, number>();
  demand.set(input.targetId, input.quantity);

  const stepByEntity = new Map<string, CraftingStep>();

  for (const entityId of order) {
    const recipe = recipeByOutput.get(entityId);
    if (!recipe) continue;
    const requiredQuantity = demand.get(entityId) ?? 0;
    if (requiredQuantity <= 0) continue;

    const craftCount = Math.ceil(requiredQuantity / recipe.output.quantity);
    const producedQuantity = craftCount * recipe.output.quantity;
    const surplus = producedQuantity - requiredQuantity;
    const entity = index.entitiesById.get(entityId)!;

    const ingredients: Requirement[] = recipe.ingredients
      .map((ing) => {
        const ingEntity = index.entitiesById.get(ing.entityId);
        if (!ingEntity) {
          warnings.push({
            code: 'missing_entity',
            message: `Missing ingredient entity: ${ing.entityId}`,
            entityId: ing.entityId,
            recipeId: recipe.id,
          });
          return null;
        }
        const qty = ing.quantity * craftCount;
        demand.set(ing.entityId, (demand.get(ing.entityId) ?? 0) + qty);
        return { entityId: ing.entityId, quantity: qty, entity: ingEntity };
      })
      .filter((x): x is Requirement => x !== null)
      .sort((a, b) => a.entityId.localeCompare(b.entityId));

    stepByEntity.set(entityId, {
      entityId,
      entity,
      recipe,
      requiredQuantity,
      craftCount,
      producedQuantity,
      surplus,
      ingredients,
    });
  }

  // Dependency-first display: reverse consumers-first order
  const steps = [...order]
    .reverse()
    .map((id) => stepByEntity.get(id))
    .filter((s): s is CraftingStep => Boolean(s));

  const rawMaterials: Requirement[] = [];
  for (const [entityId, quantity] of demand) {
    if (recipeByOutput.has(entityId)) continue;
    if (quantity <= 0) continue;
    const entity = index.entitiesById.get(entityId);
    if (!entity) {
      warnings.push({
        code: 'missing_entity',
        message: `Missing raw material entity: ${entityId}`,
        entityId,
      });
      continue;
    }
    rawMaterials.push({ entityId, quantity, entity });
  }
  rawMaterials.sort((a, b) => a.entityId.localeCompare(b.entityId));

  return {
    target: targetRequirement,
    rawMaterials,
    steps,
    warnings,
  };
}
