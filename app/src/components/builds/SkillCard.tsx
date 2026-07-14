import { motion } from 'framer-motion';
import { Swords } from 'lucide-react';
import { useTranslation, getSkillName, getSkillDescription, getBuildTranslation } from '@/i18n';
import PalImage from '@/components/PalImage';
import { CategoryBadge } from './CategoryBadge';
import { EASE_BEZIER, findPalByName } from './constants';
import type { SkillWithContext } from './constants';

interface SkillCardProps {
  skill: SkillWithContext;
  index: number;
  buildContext?: string[];
}

export function SkillCard({ skill, index, buildContext }: SkillCardProps) {
  const { locale } = useTranslation();
  const pal = findPalByName(skill.palName);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.008, 0.4), duration: 0.2, ease: EASE_BEZIER }}
      className="flex flex-col gap-2 p-3"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 12,
        border: '1px solid var(--border-subtle)',
        transition: 'border-color 0.15s ease',
      }}
      whileHover={{ y: -1, boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent-violet)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
      }}
    >
      {/* Header: Pal image + name + Category */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {pal && (
            <PalImage
              iconName={pal.iconName}
              name={pal.name}
              size="sm"
            />
          )}
          <span className="text-[14px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>
            {skill.palName}
          </span>
        </div>
        <CategoryBadge category={skill.category} />
      </div>

      {/* Skill name */}
      <div className="flex items-center gap-1.5">
        <Swords size={13} style={{ color: 'var(--accent-violet)' }} />
        <span className="text-[12px] font-semibold" style={{ color: 'var(--accent-violet)' }}>
          {getSkillName(skill.skillName, locale)}
        </span>
      </div>

      {/* Description */}
      <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {getSkillDescription(skill.description, locale)}
      </p>

      {/* Build context badges */}
      {buildContext && buildContext.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          {buildContext.map((buildName) => (
            <span
              key={buildName}
              className="text-[9px] font-semibold"
              style={{
                padding: '1px 6px',
                borderRadius: 9999,
                backgroundColor: 'rgba(139,92,246,0.1)',
                color: 'var(--accent-violet)',
              }}
            >
              {getBuildTranslation(buildName, locale)?.name || buildName}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}
