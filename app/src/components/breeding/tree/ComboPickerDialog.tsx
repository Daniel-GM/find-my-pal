import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { useTranslation } from '@/i18n';
import type { Pal } from '@/data/pals';
import PalImage from '@/components/PalImage';
import { findParentCombinations, sortCombinations } from '@/lib/breeding';
import type { BreedingCombination } from '@/lib/breeding';

const EASE_BEZIER = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

interface ComboPickerDialogProps {
  isOpen: boolean;
  pal: Pal | null;
  currentComboId: string | null;
  onSelect: (combo: BreedingCombination) => void;
  onClose: () => void;
}

export function ComboPickerDialog({
  isOpen,
  pal,
  currentComboId,
  onSelect,
  onClose,
}: ComboPickerDialogProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const combos = useMemo(() => {
    if (!pal) return [];
    const sorted = sortCombinations(findParentCombinations(pal), 'power-asc');
    const q = search.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (c) =>
        c.parentA.name.toLowerCase().includes(q) ||
        c.parentB.name.toLowerCase().includes(q),
    );
  }, [pal, search]);

  const handleClose = () => {
    setSearch('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && pal && (
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
            <h3
              className="text-[18px] font-semibold mb-3"
              style={{ color: 'var(--text-primary)' }}
            >
              {t('breeding.tree.pickCombination', { pal: pal.name })}
            </h3>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('app.searchPals')}
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
              style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
            >
              {combos.map((combo) => {
                const isCurrent = combo.id === currentComboId;
                const maxBP = Math.max(
                  combo.parentA.breedingPower,
                  combo.parentB.breedingPower,
                );
                return (
                  <button
                    key={combo.id}
                    onClick={() => {
                      onSelect(combo);
                      handleClose();
                    }}
                    className="flex items-center gap-2 text-left w-full transition-all duration-150"
                    style={{
                      padding: '8px 12px',
                      borderRadius: 10,
                      backgroundColor: 'var(--bg-base)',
                      border: isCurrent
                        ? '1px solid var(--accent-violet)'
                        : '1px solid var(--border-subtle)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-base)';
                    }}
                  >
                    <PalImage iconName={combo.parentA.iconName} name={combo.parentA.name} size="sm" />
                    <span
                      className="text-[13px] font-medium truncate"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {combo.parentA.name}
                    </span>
                    <span className="text-[13px] font-light" style={{ color: 'var(--text-muted)' }}>
                      +
                    </span>
                    <PalImage iconName={combo.parentB.iconName} name={combo.parentB.name} size="sm" />
                    <span
                      className="text-[13px] font-medium truncate"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {combo.parentB.name}
                    </span>
                    <span
                      className="text-[11px] ml-auto shrink-0"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      BP {maxBP}
                    </span>
                    {isCurrent && (
                      <Check size={14} className="shrink-0" style={{ color: 'var(--accent-violet)' }} />
                    )}
                  </button>
                );
              })}
              {combos.length === 0 && (
                <p className="text-[13px] text-center py-6" style={{ color: 'var(--text-secondary)' }}>
                  {t('breeding.noCombinationsFound')}
                </p>
              )}
            </div>
            <div className="flex justify-end mt-3">
              <button
                onClick={handleClose}
                className="text-[13px] font-medium"
                style={{ padding: '8px 16px', borderRadius: 8, color: 'var(--text-secondary)' }}
              >
                {t('app.cancel')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
