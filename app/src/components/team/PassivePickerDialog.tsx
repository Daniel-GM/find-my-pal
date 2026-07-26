import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { searchPassives } from '@/data/passives';
import { MAX_SLOT_PASSIVES } from '@/hooks/useAppState';
import { PassiveChip } from './PassiveChip';

const EASE_BEZIER = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

interface PassivePickerDialogProps {
  isOpen: boolean;
  selectedIds: string[];
  onToggle: (passiveId: string) => void;
  onClose: () => void;
}

export function PassivePickerDialog({
  isOpen,
  selectedIds,
  onToggle,
  onClose,
}: PassivePickerDialogProps) {
  const { t, locale } = useTranslation();
  const [search, setSearch] = useState('');

  const handleClose = () => {
    setSearch('');
    onClose();
  };

  const filtered = searchPassives(search);
  const isFull = selectedIds.length >= MAX_SLOT_PASSIVES;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE_BEZIER }}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 16,
              border: '1px solid var(--border-subtle)',
              maxWidth: 480,
              width: '90%',
              maxHeight: '70vh',
              display: 'flex',
              flexDirection: 'column',
              padding: 24,
            }}
          >
            <h3 className="text-[18px] font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              {t('team.selectPassive')}
              <span className="text-[12px] font-normal ml-2" style={{ color: 'var(--text-muted)' }}>
                {selectedIds.length}/{MAX_SLOT_PASSIVES}
              </span>
            </h3>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('app.search')}
              className="w-full text-[14px] outline-none mb-3"
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                backgroundColor: 'var(--bg-base)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
              autoFocus
            />
            <div
              className="flex-1 overflow-y-auto"
              style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
            >
              {filtered.map((passive) => {
                const isSelected = selectedIds.includes(passive.id);
                const disabled = !isSelected && isFull;
                return (
                  <button
                    key={passive.id}
                    onClick={() => onToggle(passive.id)}
                    disabled={disabled}
                    className="flex items-center gap-2 text-left w-full transition-all duration-150 disabled:opacity-40"
                    style={{
                      padding: 4,
                      borderRadius: 8,
                      backgroundColor: 'var(--bg-base)',
                      border: isSelected
                        ? '1px solid var(--accent-violet)'
                        : '1px solid var(--border-subtle)',
                    }}
                    onMouseEnter={(e) => {
                      if (!disabled) e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-base)';
                    }}
                  >
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <PassiveChip passive={passive} />
                      <span
                        className="text-[11px] truncate px-1"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {passive.effects[locale] || passive.effects.en}
                      </span>
                    </div>
                    {isSelected && (
                      <Check size={14} className="shrink-0 me-1" style={{ color: 'var(--accent-violet)' }} />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end mt-3">
              <button
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
