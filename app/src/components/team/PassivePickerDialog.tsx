import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { useTranslation } from '@/i18n';
import {
  PASSIVE_TIER_FILTERS,
  searchPassives,
  type PassiveTierFilter,
} from '@/data/passives';
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
  const [tierFilter, setTierFilter] = useState<PassiveTierFilter>('all');

  const handleClose = () => {
    setSearch('');
    setTierFilter('all');
    onClose();
  };

  const filtered = searchPassives(search, tierFilter);
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
              maxHeight: '78vh',
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
            <div className="mb-3 flex flex-wrap items-center gap-1.5" aria-label="Tier">
              <button
                type="button"
                onClick={() => setTierFilter('all')}
                aria-pressed={tierFilter === 'all'}
                className="text-[11px] font-semibold transition-colors"
                style={{
                  minHeight: 27,
                  padding: '4px 9px',
                  borderRadius: 999,
                  border: tierFilter === 'all'
                    ? '1px solid var(--accent-violet)'
                    : '1px solid var(--border-subtle)',
                  backgroundColor: tierFilter === 'all'
                    ? 'rgba(139, 92, 246, 0.18)'
                    : 'var(--bg-base)',
                  color: tierFilter === 'all'
                    ? 'var(--text-primary)'
                    : 'var(--text-secondary)',
                }}
              >
                {t('app.all')}
              </button>
              {PASSIVE_TIER_FILTERS.map((tier) => {
                const selected = tierFilter === tier;
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setTierFilter(tier)}
                    aria-pressed={selected}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold transition-colors"
                    style={{
                      minHeight: 27,
                      padding: '4px 9px',
                      borderRadius: 999,
                      border: selected
                        ? '1px solid var(--accent-violet)'
                        : '1px solid var(--border-subtle)',
                      backgroundColor: selected
                        ? 'rgba(139, 92, 246, 0.18)'
                        : 'var(--bg-base)',
                      color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    }}
                  >
                    <img
                      src={`/assets/passives/rank-arrow-${tier}.webp`}
                      alt=""
                      aria-hidden="true"
                      className="h-3.5 w-3.5 object-contain"
                    />
                    Tier {tier}
                  </button>
                );
              })}
            </div>
            <div
              className="flex-1 overflow-y-auto"
              style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 4 }}
            >
              {filtered.map((passive) => {
                const isSelected = selectedIds.includes(passive.id);
                const disabled = !isSelected && isFull;
                return (
                  <button
                    key={passive.id}
                    onClick={() => onToggle(passive.id)}
                    disabled={disabled}
                    className="flex items-center gap-3 text-left w-full transition-all duration-150 disabled:opacity-40"
                    style={{
                      padding: 6,
                      borderRadius: 6,
                      backgroundColor: 'rgba(5, 12, 14, 0.78)',
                      border: isSelected
                        ? '1px solid var(--accent-violet)'
                        : '1px solid rgba(112, 142, 143, 0.42)',
                    }}
                    onMouseEnter={(e) => {
                      if (!disabled) e.currentTarget.style.backgroundColor = 'rgba(24, 42, 44, 0.92)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(5, 12, 14, 0.78)';
                    }}
                  >
                    <span
                      className="relative shrink-0 flex items-center justify-center overflow-hidden"
                      style={{
                        width: 52,
                        height: 52,
                        border: '1px solid rgba(119, 151, 151, 0.56)',
                        background: 'linear-gradient(145deg, rgba(32, 53, 55, 0.78), rgba(6, 13, 15, 0.96))',
                        boxShadow: 'inset 0 0 12px rgba(75, 230, 239, 0.08)',
                      }}
                    >
                      <img
                        src={Math.abs(passive.tier) >= 4
                          ? '/assets/passives/passive-implant-consumable.webp'
                          : '/assets/passives/passive-implant.webp'}
                        alt=""
                        aria-hidden="true"
                        className="w-[46px] h-[46px] object-contain"
                      />
                    </span>
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <PassiveChip passive={passive} />
                      <span
                        className="text-[11px] line-clamp-2 px-1"
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
