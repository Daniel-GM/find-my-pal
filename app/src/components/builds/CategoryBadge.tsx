import { useTranslation } from '@/i18n';
import type { TranslationKey } from '@/i18n/types';
import { CATEGORY_LABELS } from '@/data/partnerSkills';
import { CATEGORY_ICONS, CATEGORY_COLORS } from './constants';
import { HelpCircle } from 'lucide-react';

import type { SkillCategory } from '@/data/partnerSkills';

interface CategoryBadgeProps {
  category: SkillCategory;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const { t } = useTranslation();
  const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.utility;
  const Icon = CATEGORY_ICONS[category] || HelpCircle;

  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-semibold"
      style={{
        padding: '2px 7px',
        borderRadius: 6,
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
      }}
    >
      <Icon size={12} />
      {t(`builds.category.${category}` as TranslationKey) || CATEGORY_LABELS[category] || category}
    </span>
  );
}
