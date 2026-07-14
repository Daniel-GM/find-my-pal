import type { Requirement } from '@/lib/crafting';
import { EntityIcon } from './EntityIcon';
import { entityDisplayName } from './crafting-ui';
import { useTranslation } from '@/i18n';

interface RawMaterialsPanelProps {
  materials: Requirement[];
}

export function RawMaterialsPanel({ materials }: RawMaterialsPanelProps) {
  const { t, locale } = useTranslation();
  const format = new Intl.NumberFormat(locale);

  return (
    <section
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
      }}
      className="p-4"
    >
      <h2 className="text-[14px] font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
        {t('crafting.rawMaterials')}
      </h2>
      <ul className="space-y-2">
        {materials.map((mat) => (
          <li key={mat.entityId} className="flex items-center gap-3">
            <EntityIcon entity={mat.entity} size={28} />
            <span className="flex-1 text-[13px]" style={{ color: 'var(--text-primary)' }}>
              {entityDisplayName(mat.entity, locale)}
            </span>
            <span className="text-[13px] font-semibold tabular-nums" style={{ color: 'var(--text-secondary)' }}>
              {format.format(mat.quantity)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
