import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/i18n';
import { getGearByKind, getRaritySlotStyle } from '@/data/gear';
import type { GearKind } from '@/data/gear';

const EASE_BEZIER = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

interface GearPickerDialogProps {
  isOpen: boolean;
  kind: GearKind;
  selectedIds: string[];
  onToggle: (gearId: string) => void;
  onClose: () => void;
}

export function GearPickerDialog({
  isOpen,
  kind,
  selectedIds,
  onToggle,
  onClose,
}: GearPickerDialogProps) {
  const { t, locale } = useTranslation();
  const [search, setSearch] = useState('');

  const handleClose = () => {
    setSearch('');
    onClose();
  };

  const q = search.trim().toLowerCase();
  const items = getGearByKind(kind).filter(
    (g) =>
      !q ||
      g.names.en.toLowerCase().includes(q) ||
      g.names['pt-BR'].toLowerCase().includes(q),
  );

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
              maxWidth: 560,
              width: '90%',
              maxHeight: '75vh',
              display: 'flex',
              flexDirection: 'column',
              padding: 24,
            }}
          >
            <h3 className="text-[18px] font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              {t('team.selectItem')}
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
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
                alignContent: 'start',
              }}
            >
              {items.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const name = item.names[locale] || item.names.en;
                return (
                  <button
                    key={item.id}
                    onClick={() => onToggle(item.id)}
                    className="flex flex-col items-center gap-1.5 transition-all duration-150"
                    style={{
                      padding: 10,
                      borderRadius: 10,
                      backgroundColor: 'var(--bg-base)',
                      border: isSelected
                        ? '2px solid var(--accent-violet)'
                        : '1px solid var(--border-subtle)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-base)';
                    }}
                    title={item.effects ? item.effects[locale] || item.effects.en : name}
                  >
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 8,
                        padding: 5,
                        ...getRaritySlotStyle(item),
                      }}
                    >
                      {item.iconUrl ? (
                        <img
                          src={item.iconUrl}
                          alt={name}
                          width={46}
                          height={46}
                          loading="lazy"
                          style={{ objectFit: 'contain' }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span
                          className="text-[8px] font-medium text-center leading-tight"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {name}
                        </span>
                      )}
                    </div>
                    <span
                      className="text-[11px] font-medium text-center leading-tight w-full"
                      style={{
                        color: 'var(--text-primary)',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {name}
                    </span>
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
