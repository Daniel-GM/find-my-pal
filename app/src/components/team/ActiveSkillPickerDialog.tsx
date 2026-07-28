import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Clock3, Sparkles } from 'lucide-react';
import { useTranslation } from '@/i18n';
import {
  searchActiveSkills,
  type ActiveSkillElementFilter,
} from '@/data/activeSkills';
import { ELEMENTS } from '@/data/pals';
import { MAX_SLOT_ACTIVE_SKILLS } from '@/hooks/useAppState';
import { ElementBadge } from '@/components/breeding';

const EASE_BEZIER = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

interface ActiveSkillPickerDialogProps {
  isOpen: boolean;
  selectedIds: string[];
  onToggle: (activeSkillId: string) => void;
  onClose: () => void;
}

export function ActiveSkillPickerDialog({
  isOpen,
  selectedIds,
  onToggle,
  onClose,
}: ActiveSkillPickerDialogProps) {
  const { t, locale } = useTranslation();
  const [search, setSearch] = useState('');
  const [elementFilter, setElementFilter] = useState<ActiveSkillElementFilter>('all');

  const handleClose = () => {
    setSearch('');
    setElementFilter('all');
    onClose();
  };

  const filtered = searchActiveSkills(search, locale, elementFilter);
  const isFull = selectedIds.length >= MAX_SLOT_ACTIVE_SKILLS;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.68)', backdropFilter: 'blur(4px)' }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE_BEZIER }}
            onClick={(event) => event.stopPropagation()}
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 16,
              border: '1px solid var(--border-subtle)',
              maxWidth: 620,
              width: '92%',
              maxHeight: '78vh',
              display: 'flex',
              flexDirection: 'column',
              padding: 24,
            }}
          >
            <h3 className="mb-3 text-[18px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('team.selectActiveSkill')}
              <span className="ml-2 text-[12px] font-normal" style={{ color: 'var(--text-muted)' }}>
                {selectedIds.length}/{MAX_SLOT_ACTIVE_SKILLS}
              </span>
            </h3>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('app.search')}
              className="mb-3 w-full text-[14px] outline-none"
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                backgroundColor: 'var(--bg-base)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
              autoFocus
            />
            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setElementFilter('all')}
                aria-pressed={elementFilter === 'all'}
                className="text-[11px] font-semibold transition-colors"
                style={{
                  minHeight: 27,
                  padding: '4px 10px',
                  borderRadius: 999,
                  border: elementFilter === 'all'
                    ? '1px solid var(--accent-violet)'
                    : '1px solid var(--border-subtle)',
                  backgroundColor: elementFilter === 'all'
                    ? 'rgba(139, 92, 246, 0.18)'
                    : 'var(--bg-base)',
                  color: elementFilter === 'all'
                    ? 'var(--text-primary)'
                    : 'var(--text-secondary)',
                }}
              >
                {t('app.all')}
              </button>
              {ELEMENTS.map((element) => {
                const selected = elementFilter === element;
                return (
                  <button
                    key={element}
                    type="button"
                    onClick={() => setElementFilter(element)}
                    aria-pressed={selected}
                    aria-label={t(`element.${element}`)}
                    className="rounded-full transition-colors"
                    style={{
                      border: selected
                        ? '1px solid var(--accent-violet)'
                        : '1px solid transparent',
                      backgroundColor: selected ? 'rgba(139, 92, 246, 0.18)' : 'transparent',
                    }}
                  >
                    <ElementBadge element={element} />
                  </button>
                );
              })}
            </div>
            <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto pr-1">
              {filtered.map((skill) => {
                const isSelected = selectedIds.includes(skill.id);
                const disabled = !isSelected && isFull;
                return (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => onToggle(skill.id)}
                    disabled={disabled}
                    className="flex w-full items-center gap-3 text-left transition-all duration-150 disabled:opacity-40"
                    style={{
                      padding: 9,
                      borderRadius: 8,
                      backgroundColor: isSelected ? 'var(--bg-hover)' : 'var(--bg-base)',
                      border: isSelected
                        ? '1px solid var(--accent-violet)'
                        : '1px solid var(--border-subtle)',
                    }}
                  >
                    <ElementBadge element={skill.element} />
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[13px] font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {skill.names[locale] || skill.names.en}
                      </span>
                      <span
                        className="mt-0.5 block line-clamp-2 text-[11px]"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {skill.descriptions[locale] || skill.descriptions.en}
                      </span>
                    </span>
                    <span
                      className="flex shrink-0 flex-col items-end gap-1 text-[10px]"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <span className="inline-flex items-center gap-1">
                        <Sparkles size={11} />
                        {t('team.power')} {skill.power}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 size={11} />
                        {t('team.cooldown')} {skill.cooldown}
                      </span>
                    </span>
                    {isSelected && (
                      <Check size={15} className="shrink-0" style={{ color: 'var(--accent-violet)' }} />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="text-[13px] font-medium"
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  backgroundColor: 'var(--accent-violet)',
                  color: '#FFFFFF',
                }}
              >
                {t('app.confirm')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
