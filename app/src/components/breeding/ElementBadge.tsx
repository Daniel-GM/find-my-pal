import { getElementColor, getElementBg } from '@/lib/elements';
import { getElementIconUrl } from '@/lib/images';
import { useTranslation } from '@/i18n';
import type { TranslationKey } from '@/i18n/types';
import type { PalElement } from '@/data/pals';

interface ElementBadgeProps {
  element: PalElement;
}

export function ElementBadge({ element }: ElementBadgeProps) {
  const { t } = useTranslation();
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.04em]"
      style={{
        padding: '2px 8px',
        borderRadius: 9999,
        backgroundColor: getElementBg(element),
        color: getElementColor(element),
        whiteSpace: 'nowrap',
      }}
    >
      <img
        src={getElementIconUrl(element)}
        alt={element}
        className="element-icon"
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
      {t(`element.${element}` as TranslationKey)}
    </span>
  );
}
