import type { CraftingEntity } from '@/data/crafting';
import { getEntityName } from '@/data/crafting';
import type { Locale } from '@/i18n';

export function entityDisplayName(entity: CraftingEntity, locale: Locale): string {
  return getEntityName(entity, locale);
}

export type TargetCategory = 'all' | 'items' | 'structures';

function matchesCategory(entity: CraftingEntity, category: TargetCategory): boolean {
  if (category === 'all') return true;
  if (category === 'structures') return entity.kind === 'structure';
  return entity.kind === 'item' || entity.kind === 'material';
}

export function filterTargets(
  entities: CraftingEntity[],
  search: string,
  category: TargetCategory,
  locale: Locale,
): CraftingEntity[] {
  const q = search.trim().toLowerCase();
  return entities.filter((entity) => {
    if (!matchesCategory(entity, category)) return false;
    if (!q) return true;
    const en = entity.names.en.toLowerCase();
    const pt = entity.names['pt-BR']?.toLowerCase() ?? '';
    const id = entity.id.toLowerCase();
    const localized = entityDisplayName(entity, locale).toLowerCase();
    return en.includes(q) || pt.includes(q) || id.includes(q) || localized.includes(q);
  });
}
