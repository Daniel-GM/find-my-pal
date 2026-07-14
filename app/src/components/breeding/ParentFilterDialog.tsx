import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/i18n';
import { PALS } from '@/data/pals';
import { getPalImageUrl } from '@/lib/images';

const EASE_BEZIER = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

interface ParentFilterDialogProps {
  isOpen: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (palId: string) => void;
  onClose: () => void;
}

export function ParentFilterDialog({
  isOpen,
  search,
  onSearchChange,
  onSelect,
  onClose,
}: ParentFilterDialogProps) {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={onClose}
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
              maxWidth: 420,
              width: '90%',
              maxHeight: '70vh',
              display: 'flex',
              flexDirection: 'column',
              padding: 24,
            }}
          >
            <h3
              className="text-[18px] font-semibold mb-1"
              style={{ color: 'var(--text-primary)' }}
            >
              {t('breeding.selectParent')}
            </h3>
            <p
              className="text-[13px] mb-3"
              style={{ color: 'var(--text-secondary)' }}
            >
              {t('breeding.parentFilterHint')}
            </p>
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
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
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 4,
                maxHeight: '40vh',
              }}
            >
              {PALS.filter(
                (p) =>
                  p.name.toLowerCase().includes(search.toLowerCase()) ||
                  String(p.number).includes(search)
              ).map((pal) => (
                <button
                  key={pal.id}
                  onClick={() => onSelect(pal.id)}
                  className="flex items-center gap-2 text-left transition-all duration-150"
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    backgroundColor: 'var(--bg-base)',
                    border: '1px solid var(--border-subtle)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-base)';
                  }}
                >
                  <img
                    src={getPalImageUrl(pal.iconName)}
                    alt={pal.name}
                    className="pal-icon-sm"
                    loading="lazy"
                  />
                  <div className="min-w-0">
                    <div
                      className="text-[12px] font-medium truncate"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {pal.name}
                    </div>
                    <div
                      className="text-[10px]"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      #{String(pal.number).padStart(3, '0')}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-end mt-3">
              <button
                onClick={onClose}
                className="text-[13px] font-medium"
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  color: 'var(--text-secondary)',
                }}
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
