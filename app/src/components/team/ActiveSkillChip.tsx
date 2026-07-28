import { Clock3, Sparkles, X } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { getElementBg, getElementColor } from '@/lib/elements';
import type { ActiveSkill } from '@/data/activeSkills';

interface ActiveSkillChipProps {
  skill: ActiveSkill;
  onRemove?: () => void;
}

export function ActiveSkillChip({ skill, onRemove }: ActiveSkillChipProps) {
  const { locale } = useTranslation();
  const color = getElementColor(skill.element);

  return (
    <div
      className="flex min-w-0 items-center gap-2"
      style={{
        minHeight: 30,
        padding: '4px 7px',
        borderRadius: 6,
        border: `1px solid ${color}66`,
        borderLeft: `4px solid ${color}`,
        backgroundColor: getElementBg(skill.element),
      }}
      title={skill.descriptions[locale] || skill.descriptions.en}
    >
      <span
        className="min-w-0 flex-1 truncate text-[12px] font-semibold"
        style={{ color: 'var(--text-primary)' }}
      >
        {skill.names[locale] || skill.names.en}
      </span>
      <span
        className="inline-flex shrink-0 items-center gap-0.5 text-[10px]"
        style={{ color: 'var(--text-secondary)' }}
      >
        <Sparkles size={11} aria-hidden="true" />
        {skill.power}
      </span>
      <span
        className="inline-flex shrink-0 items-center gap-0.5 text-[10px]"
        style={{ color: 'var(--text-secondary)' }}
      >
        <Clock3 size={11} aria-hidden="true" />
        {skill.cooldown}
      </span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="flex shrink-0 items-center justify-center rounded-sm"
          style={{ color: 'var(--text-secondary)' }}
          aria-label={`${skill.names[locale] || skill.names.en}: ${locale === 'pt-BR' ? 'remover' : 'remove'}`}
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
