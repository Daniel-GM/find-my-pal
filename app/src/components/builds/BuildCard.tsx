import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Swords } from 'lucide-react';
import { useTranslation, getBuildTranslation } from '@/i18n';
import PalImage from '@/components/PalImage';
import { CategoryBadge } from './CategoryBadge';
import { EASE_BEZIER, BUILD_ICON_COLORS, findPalByName } from './constants';
import type { BuildCardProps } from './constants';
import type { SkillCategory } from '@/data/partnerSkills';

export function BuildCard({ build, index, onSelectBuild }: BuildCardProps) {
  const { t, locale } = useTranslation();
  const color = BUILD_ICON_COLORS[index % BUILD_ICON_COLORS.length];

  // Get unique categories in this build
  const categories = useMemo(() => {
    const cats = new Set<SkillCategory>();
    build.skills.forEach((s) => cats.add(s.category));
    return Array.from(cats);
  }, [build]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.25, ease: EASE_BEZIER }}
      className="flex flex-col gap-2.5 p-4 cursor-pointer"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 14,
        border: '1px solid var(--border-subtle)',
        transition: 'border-color 0.15s ease',
      }}
      whileHover={{ y: -2, boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent-violet)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
      }}
      onClick={() => onSelectBuild(build)}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-xl"
          style={{ backgroundColor: color.bg }}
        >
          <Swords size={20} style={{ color: color.icon }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>
            {getBuildTranslation(build.name, locale)?.name || build.name}
          </h3>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {t('builds.skillsCount', { count: build.skills.length })}
          </p>
        </div>
      </div>

      {/* Description */}
      <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {getBuildTranslation(build.name, locale)?.description || build.description}
      </p>

      {/* Pal images row */}
      <div className="flex items-center gap-1">
        {build.skills.slice(0, 5).map((s) => {
          const pal = findPalByName(s.palName);
          if (!pal) return null;
          return (
            <PalImage
              key={`${s.palName}-${s.skillName}`}
              iconName={pal.iconName}
              name={pal.name}
              size="sm"
            />
          );
        })}
        {build.skills.length > 5 && (
          <span
            className="text-[10px] font-semibold flex items-center justify-center rounded-full"
            style={{
              width: 28,
              height: 28,
              backgroundColor: 'var(--bg-hover)',
              color: 'var(--text-muted)',
            }}
          >
            +{build.skills.length - 5}
          </span>
        )}
      </div>

      {/* Category badges */}
      <div className="flex flex-wrap gap-1">
        {categories.slice(0, 5).map((cat) => (
          <CategoryBadge key={cat} category={cat} />
        ))}
        {categories.length > 5 && (
          <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
            {t('builds.more', { count: categories.length - 5 })}
          </span>
        )}
      </div>

      {/* Skill names preview */}
      <div className="flex flex-wrap gap-1 pt-1" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        {build.skills.slice(0, 4).map((s) => (
          <span
            key={`${s.palName}-${s.skillName}`}
            className="text-[9px] font-medium"
            style={{
              padding: '1px 6px',
              borderRadius: 4,
              backgroundColor: 'var(--bg-hover)',
              color: 'var(--text-muted)',
            }}
          >
            {s.palName}
          </span>
        ))}
        {build.skills.length > 4 && (
          <span className="text-[9px] font-medium" style={{ color: 'var(--text-muted)' }}>
            {t('builds.more', { count: build.skills.length - 4 })}
          </span>
        )}
      </div>
    </motion.div>
  );
}
