import { useTranslation } from '@/i18n';
import type { TranslationKey } from '@/i18n/types';
import { getActiveWorkSuitability } from '@/lib/images';
import type { Pal } from '@/data/pals';

interface WorkSuitabilityGridProps {
  pal: Pal;
}

export function WorkSuitabilityGrid({ pal }: WorkSuitabilityGridProps) {
  const { t } = useTranslation();
  const activeSkills = getActiveWorkSuitability(pal);
  if (activeSkills.length === 0) return null;
  return (
    <div className="work-suitability-grid">
      {activeSkills.map(({ type, level, iconUrl }) => (
        <div key={type} className="work-skill-badge" title={t(`work.${type}` as TranslationKey)}>
          <img
            src={iconUrl}
            alt={type}
            className="work-skill-icon"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <span>{level}</span>
        </div>
      ))}
    </div>
  );
}
