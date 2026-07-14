import type { CraftingStep } from '@/lib/crafting';
import type { CraftingRecipe } from '@/data/crafting';
import { getEntityName, getRecipesForOutput, craftingCatalogIndex } from '@/data/crafting';
import { EntityIcon } from './EntityIcon';
import { entityDisplayName } from './crafting-ui';
import { useTranslation } from '@/i18n';

interface CraftingStepCardProps {
  step: CraftingStep;
  index: number;
  selectedRecipeIds: Record<string, string>;
  onRecipeChange: (outputId: string, recipeId: string) => void;
}

export function CraftingStepCard({
  step,
  index,
  selectedRecipeIds,
  onRecipeChange,
}: CraftingStepCardProps) {
  const { t, locale } = useTranslation();
  const format = new Intl.NumberFormat(locale);
  const alternatives = getRecipesForOutput(step.entityId);
  const stations = step.recipe.stationIds
    .map((id) => craftingCatalogIndex.entitiesById.get(id))
    .filter(Boolean)
    .map((e) => getEntityName(e!, locale));

  return (
    <article
      className="p-4"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
      }}
    >
      <div className="flex items-start gap-3">
        <span
          className="text-[11px] font-bold shrink-0 w-6 h-6 flex items-center justify-center"
          style={{
            borderRadius: 9999,
            backgroundColor: 'var(--bg-active)',
            color: 'var(--text-secondary)',
          }}
        >
          {index + 1}
        </span>
        <EntityIcon entity={step.entity} size={36} />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h3 className="text-[14px] font-bold" style={{ color: 'var(--text-primary)' }}>
              {entityDisplayName(step.entity, locale)}
            </h3>
            <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
              {t('crafting.required', { count: format.format(step.requiredQuantity) })}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
            <span>{t('crafting.crafts', { count: format.format(step.craftCount) })}</span>
            <span>{t('crafting.produces', { count: format.format(step.producedQuantity) })}</span>
            {step.surplus > 0 && (
              <span>{t('crafting.surplus', { count: format.format(step.surplus) })}</span>
            )}
            {step.recipe.technologyLevel != null && (
              <span>{t('crafting.technologyLevel', { level: step.recipe.technologyLevel })}</span>
            )}
          </div>

          {stations.length > 0 && (
            <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
              {t('crafting.station')}: {stations.join(', ')}
            </p>
          )}

          {alternatives.length > 1 && (
            <label className="block text-[12px]" style={{ color: 'var(--text-secondary)' }}>
              <span className="block mb-1">{t('crafting.alternateRecipe')}</span>
              <select
                value={selectedRecipeIds[step.entityId] ?? step.recipe.id}
                onChange={(e) => onRecipeChange(step.entityId, e.target.value)}
                className="w-full max-w-md px-2 py-1.5 text-[12px] outline-none"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  color: 'var(--text-primary)',
                }}
              >
                {alternatives.map((recipe) => (
                  <option key={recipe.id} value={recipe.id}>
                    {recipeLabel(recipe, locale)}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </div>
    </article>
  );
}

function recipeLabel(recipe: CraftingRecipe, locale: 'en' | 'pt-BR'): string {
  return recipe.ingredients
    .map((ing) => {
      const entity = craftingCatalogIndex.entitiesById.get(ing.entityId);
      const name = entity ? getEntityName(entity, locale) : ing.entityId;
      return `${ing.quantity}× ${name}`;
    })
    .join(' + ');
}

interface CraftingStepsProps {
  steps: CraftingStep[];
  selectedRecipeIds: Record<string, string>;
  onRecipeChange: (outputId: string, recipeId: string) => void;
}

export function CraftingSteps({ steps, selectedRecipeIds, onRecipeChange }: CraftingStepsProps) {
  const { t } = useTranslation();
  return (
    <section className="space-y-3">
      <h2 className="text-[14px] font-bold" style={{ color: 'var(--text-primary)' }}>
        {t('crafting.steps')}
      </h2>
      <div className="space-y-3">
        {steps.map((step, index) => (
          <CraftingStepCard
            key={`${step.entityId}-${step.recipe.id}`}
            step={step}
            index={index}
            selectedRecipeIds={selectedRecipeIds}
            onRecipeChange={onRecipeChange}
          />
        ))}
      </div>
    </section>
  );
}
