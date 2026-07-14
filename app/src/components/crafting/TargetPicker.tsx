import { Search, X } from 'lucide-react';
import type { CraftingEntity } from '@/data/crafting';
import { EntityIcon } from './EntityIcon';
import { entityDisplayName, type TargetCategory } from './crafting-ui';
import { useTranslation } from '@/i18n';

interface TargetPickerProps {
  entities: CraftingEntity[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  category: TargetCategory;
  onCategoryChange: (category: TargetCategory) => void;
  filtered: CraftingEntity[];
}

export function TargetPicker({
  selectedId,
  onSelect,
  search,
  onSearchChange,
  category,
  onCategoryChange,
  filtered,
}: TargetPickerProps) {
  const { t, locale } = useTranslation();
  const categories: { id: TargetCategory; label: string }[] = [
    { id: 'all', label: t('crafting.categoryAll') },
    { id: 'items', label: t('crafting.categoryItems') },
    { id: 'structures', label: t('crafting.categoryStructures') },
  ];

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--text-muted)' }}
        />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('crafting.search')}
          aria-label={t('crafting.search')}
          className="w-full pl-9 pr-9 py-2.5 text-[13px] outline-none"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 10,
            color: 'var(--text-primary)',
          }}
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            aria-label="Clear"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((c) => {
          const active = category === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onCategoryChange(c.id)}
              className="text-[12px] font-medium px-3 py-1.5"
              style={{
                borderRadius: 9999,
                border: `1px solid ${active ? 'var(--border-active)' : 'var(--border-subtle)'}`,
                backgroundColor: active ? 'var(--bg-active)' : 'var(--bg-surface)',
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <div
        className="max-h-56 overflow-y-auto"
        style={{
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          backgroundColor: 'var(--bg-surface)',
        }}
        role="listbox"
        aria-label={t('crafting.selectTarget')}
      >
        {filtered.length === 0 ? (
          <p className="p-4 text-[13px]" style={{ color: 'var(--text-muted)' }}>
            {t('crafting.noResults')}
          </p>
        ) : (
          filtered.map((entity) => {
            const active = selectedId === entity.id;
            return (
              <button
                key={entity.id}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => onSelect(entity.id)}
                className="w-full flex items-center gap-3 px-3 py-2 text-left"
                style={{
                  backgroundColor: active ? 'var(--bg-active)' : 'transparent',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <EntityIcon entity={entity} size={28} />
                <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                  {entityDisplayName(entity, locale)}
                </span>
                <span className="ml-auto text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {entity.kind}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
