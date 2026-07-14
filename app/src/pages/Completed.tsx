import { useState } from 'react';
import { CheckCircle2, RotateCcw, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/i18n';
import type { TranslationKey } from '@/i18n/types';
import type { AppState } from '@/hooks/useAppState';
import { PALS } from '@/data/pals';
import { getElementIconUrl } from '@/lib/images';
import PalImage from '@/components/PalImage';

interface CompletedProps {
  appState: AppState;
}

function getRelativeTime(timestamp: string, t: (key: TranslationKey, params?: Record<string, string | number>) => string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 1) return t('completed.justNow');
  if (minutes < 60) return t('completed.minutesAgo', { n: minutes });
  if (hours < 24) return t('completed.hoursAgo', { n: hours });
  return t('completed.daysAgo', { n: days });
}

function CompletedCard({
  entry,
  onUndo,
}: {
  entry: {
    combinationId: string;
    parentAId: string;
    parentBId: string;
    babyId: string;
    completedAt: string;
  };
  onUndo: (comboId: string) => void;
}) {
  const { t } = useTranslation();
  const parentA = PALS.find((p) => p.id === entry.parentAId);
  const parentB = PALS.find((p) => p.id === entry.parentBId);
  const baby = PALS.find((p) => p.id === entry.babyId);

  if (!parentA || !parentB || !baby) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-4"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 14,
        border: '1px solid var(--border-subtle)',
        borderLeft: '4px solid var(--accent-emerald)',
        padding: '14px 16px',
      }}
    >
      {/* Baby Icon */}
      <PalImage
        iconName={baby.iconName}
        name={baby.name}
        size="md"
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="text-[14px] font-semibold truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {baby.name}
          </span>
          <div className="flex gap-0.5">
            {baby.elements.map((el) => (
              <img
                key={el}
                src={getElementIconUrl(el)}
                alt={el}
                className="element-icon"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
                title={t(`element.${el as string}` as TranslationKey)}
              />
            ))}
          </div>
          <span
            className="shrink-0 text-[10px] font-semibold uppercase"
            style={{
              padding: '2px 8px',
              borderRadius: 9999,
              backgroundColor: 'rgba(52,211,153,0.15)',
              color: 'var(--accent-emerald)',
            }}
          >
            {t('completed.total')}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <PalImage
            iconName={parentA.iconName}
            name={parentA.name}
            size="sm"
          />
          <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
            {parentA.name}
          </span>
          <span className="text-[12px] mx-0.5" style={{ color: 'var(--text-muted)' }}>+</span>
          <PalImage
            iconName={parentB.iconName}
            name={parentB.name}
            size="sm"
          />
          <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
            {parentB.name}
          </span>
        </div>
        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {getRelativeTime(entry.completedAt, t)}
        </p>
      </div>

      {/* Undo */}
      <button
        onClick={() => onUndo(entry.combinationId)}
        className="flex items-center gap-1.5 text-[12px] font-medium shrink-0 transition-all duration-150 hover:scale-105"
        style={{
          padding: '6px 12px',
          borderRadius: 8,
          backgroundColor: 'var(--bg-hover)',
          color: 'var(--text-secondary)',
        }}
      >
        <RotateCcw size={13} />
        {t('completed.undo')}
      </button>
    </motion.div>
  );
}

export default function Completed({ appState }: CompletedProps) {
  const { t } = useTranslation();
  const { completed, unmarkCompleted } = appState;
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCompleted = searchQuery.trim()
    ? completed.filter((entry) => {
        const baby = PALS.find((p) => p.id === entry.babyId);
        const parentA = PALS.find((p) => p.id === entry.parentAId);
        const parentB = PALS.find((p) => p.id === entry.parentBId);
        const q = searchQuery.toLowerCase();
        return (
          baby?.name.toLowerCase().includes(q) ||
          parentA?.name.toLowerCase().includes(q) ||
          parentB?.name.toLowerCase().includes(q)
        );
      })
    : completed;

  return (
    <div>
      {/* Top Bar */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between"
        style={{
          height: 60,
          padding: '0 24px',
          backgroundColor: 'var(--bg-base)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <h1
            className="text-[20px] font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            {t('completed.title')}
          </h1>
          <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            {completed.length} {t('completed.total')}
          </p>
        </div>
      </div>

      <div style={{ padding: '24px' }}>
        {completed.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-24 gap-4"
            style={{ color: 'var(--text-secondary)' }}
          >
            <CheckCircle2
              size={64}
              style={{ color: 'var(--text-muted)', opacity: 0.3 }}
            />
            <h3
              className="text-[18px] font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              {t('completed.noCompleted')}
            </h3>
            <p className="text-[14px] text-center" style={{ maxWidth: 360 }}>
              {t('completed.noCompletedDesc')}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 max-w-[700px]">
            {/* Search */}
            <div
              className="flex items-center gap-2 mb-2"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 10,
                border: '1px solid var(--border-subtle)',
                padding: '8px 12px',
              }}
            >
              <Search size={16} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('completed.searchCompleted')}
                className="flex-1 text-[13px] outline-none bg-transparent"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>

            {filteredCompleted.length === 0 ? (
              <p className="text-center text-[13px] py-8" style={{ color: 'var(--text-muted)' }}>
                {t('app.noPalsFound')}
              </p>
            ) : (
              filteredCompleted.map((entry) => (
                <CompletedCard
                  key={entry.combinationId}
                  entry={entry}
                  onUndo={unmarkCompleted}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
