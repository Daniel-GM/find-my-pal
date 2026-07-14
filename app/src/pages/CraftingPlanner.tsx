import { useMemo, useState } from 'react';
import { Factory } from 'lucide-react';
import {
  CRAFTING_CATALOG,
  getSelectableEntities,
  getEntityName,
} from '@/data/crafting';
import { buildCraftingPlan } from '@/lib/crafting';
import {
  TargetPicker,
  filterTargets,
  RawMaterialsPanel,
  CraftingSteps,
  EntityIcon,
  type TargetCategory,
} from '@/components/crafting';
import { useTranslation } from '@/i18n';

export default function CraftingPlanner() {
  const { t, locale } = useTranslation();
  const selectable = useMemo(() => getSelectableEntities(CRAFTING_CATALOG), []);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<TargetCategory>('all');
  const [targetId, setTargetId] = useState<string | null>(null);
  const [quantityInput, setQuantityInput] = useState('1');
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<Record<string, string>>({});

  const filtered = useMemo(
    () => filterTargets(selectable, search, category, locale),
    [selectable, search, category, locale],
  );

  const quantity = useMemo(() => {
    const n = Number.parseInt(quantityInput, 10);
    return Number.isInteger(n) && n >= 1 ? n : null;
  }, [quantityInput]);

  const plan = useMemo(() => {
    if (!targetId || quantity == null) return null;
    return buildCraftingPlan(CRAFTING_CATALOG, {
      targetId,
      quantity,
      selectedRecipeIds,
    });
  }, [targetId, quantity, selectedRecipeIds]);

  const selectedEntity = targetId
    ? selectable.find((e) => e.id === targetId) ?? null
    : null;

  const hasFatal =
    plan != null &&
    plan.warnings.some((w) =>
      ['cycle_detected', 'invalid_recipe_selection', 'invalid_target', 'invalid_quantity'].includes(
        w.code,
      ),
    );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <Factory size={22} style={{ color: 'var(--accent-violet)' }} />
          <h1 className="text-[22px] font-bold tracking-[-0.02em]" style={{ color: 'var(--text-primary)' }}>
            {t('crafting.title')}
          </h1>
        </div>
        <p className="text-[13px] max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
          {t('crafting.description')}
        </p>
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {t('crafting.versionLabel', { version: CRAFTING_CATALOG.gameVersion })}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_180px] gap-4 items-start">
        <TargetPicker
          entities={selectable}
          selectedId={targetId}
          onSelect={(id) => {
            setTargetId(id);
            setSelectedRecipeIds({});
          }}
          search={search}
          onSearchChange={setSearch}
          category={category}
          onCategoryChange={setCategory}
          filtered={filtered}
        />
        <label className="block text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>
          {t('crafting.quantity')}
          <input
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={quantityInput}
            onChange={(e) => setQuantityInput(e.target.value)}
            aria-invalid={quantity == null}
            className="mt-1 w-full px-3 py-2.5 text-[13px] outline-none"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: `1px solid ${quantity == null ? 'var(--accent-red)' : 'var(--border-subtle)'}`,
              borderRadius: 10,
              color: 'var(--text-primary)',
            }}
          />
        </label>
      </div>

      {!targetId && (
        <div
          className="flex flex-col items-center justify-center text-center py-16 px-6"
          style={{
            border: '1px dashed var(--border-subtle)',
            borderRadius: 12,
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <Factory size={36} style={{ color: 'var(--text-muted)' }} className="mb-3" />
          <p className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            {t('crafting.emptyState')}
          </p>
          <p className="text-[13px] mt-1 max-w-md" style={{ color: 'var(--text-muted)' }}>
            {t('crafting.emptyStateDesc')}
          </p>
        </div>
      )}

      {targetId && quantity == null && (
        <p className="text-[13px]" style={{ color: 'var(--accent-red)' }}>
          {t('crafting.invalidData')}
        </p>
      )}

      {plan && hasFatal && (
        <p className="text-[13px]" style={{ color: 'var(--accent-red)' }}>
          {t('crafting.invalidData')}
        </p>
      )}

      {plan && !hasFatal && selectedEntity && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <EntityIcon entity={selectedEntity} size={40} />
            <div>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {t('crafting.selectTarget')}
              </p>
              <p className="text-[16px] font-bold" style={{ color: 'var(--text-primary)' }}>
                {getEntityName(selectedEntity, locale)} × {quantity}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(260px,340px)_minmax(0,1fr)] gap-4 items-start">
            <RawMaterialsPanel materials={plan.rawMaterials} />
            <CraftingSteps
              steps={plan.steps}
              selectedRecipeIds={selectedRecipeIds}
              onRecipeChange={(outputId, recipeId) => {
                setSelectedRecipeIds((prev) => ({ ...prev, [outputId]: recipeId }));
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
