import { getElementColor, getElementBg } from '@/lib/elements';
import { getElementIconUrl } from '@/lib/images';
import type { PalElement } from '@/data/pals';

interface ElementBadgeProps {
  element: PalElement;
}

export function ElementBadge({ element }: ElementBadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.04em]"
      style={{
        padding: '2px 8px',
        borderRadius: 9999,
        backgroundColor: getElementBg(element),
        color: getElementColor(element),
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
      {element}
    </span>
  );
}
