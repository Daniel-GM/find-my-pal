import { Package, Calendar, Trash2, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/i18n';
import { PALS } from '@/data/pals';
import PalImage from '@/components/PalImage';
import type { Package as PkgType } from '@/hooks/useAppState';

interface PackageCardProps {
  pkg: PkgType;
  onDelete: (id: string) => void;
  onClick: () => void;
  onEdit: (pkg: PkgType) => void;
}

function getBabyFromCombinationId(comboId: string) {
  const parts = comboId.split('=');
  if (parts.length !== 2) return null;
  const babyId = parts[1];
  return PALS.find((p) => p.id === babyId) || null;
}

export default function PackageCard({
  pkg,
  onDelete,
  onClick,
  onEdit,
}: PackageCardProps) {
  const { t } = useTranslation();
  const completedCount = pkg.completedCombinationIds.length;
  const total = pkg.combinationIds.length;
  const pct = total > 0 ? (completedCount / total) * 100 : 0;
  const babyPals = pkg.combinationIds
    .map(getBabyFromCombinationId)
    .filter((p): p is NonNullable<typeof p> => p !== null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex flex-col gap-3 cursor-pointer"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 16,
        border: '1px solid var(--border-subtle)',
        padding: 20,
      }}
      onClick={onClick}
      whileHover={{
        y: -2,
        boxShadow: '0 4px 16px rgba(139,92,246,0.08)',
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-xl"
            style={{
              width: 48,
              height: 48,
              background:
                'linear-gradient(135deg, var(--accent-violet), var(--accent-violet-hover))',
            }}
          >
            <Package size={22} color="#FFFFFF" />
          </div>
          <div>
            <h3
              className="text-[16px] font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              {pkg.name}
            </h3>
            <div
              className="flex items-center gap-1 text-[12px] mt-0.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Calendar size={12} />
              {new Date(pkg.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
        <span onClick={(e) => e.stopPropagation()} className="flex items-center gap-1">
          <button
            onClick={() => onEdit(pkg)}
            className="flex items-center justify-center rounded-lg transition-all duration-150 hover:scale-110"
            style={{
              width: 32,
              height: 32,
              backgroundColor: 'var(--bg-hover)',
              color: 'var(--text-secondary)',
            }}
            title={t('app.edit')}
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(pkg.id)}
            className="flex items-center justify-center rounded-lg transition-all duration-150 hover:scale-110"
            style={{
              width: 32,
              height: 32,
              backgroundColor: 'var(--bg-hover)',
              color: 'var(--text-secondary)',
            }}
            title={t('app.delete')}
          >
            <Trash2 size={14} />
          </button>
        </span>
      </div>

      {pkg.description && (
        <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
          {pkg.description}
        </p>
      )}

      <div className="flex items-center justify-between text-[12px]">
        <span style={{ color: 'var(--text-secondary)' }}>
          {total} {t('packages.items')}
        </span>
        <span style={{ color: 'var(--text-secondary)' }}>
          {t('packages.completedOf', { completed: completedCount, total })}
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: 6,
          borderRadius: 3,
          backgroundColor: 'var(--bg-hover)',
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
          style={{
            height: '100%',
            borderRadius: 3,
            backgroundColor: 'var(--accent-emerald)',
          }}
        />
      </div>

      {/* Baby Pal Thumbnails */}
      {babyPals.length > 0 && (
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] font-medium shrink-0" style={{ color: 'var(--text-muted)' }}>
            {t('breeding.result')}:
          </span>
          <div className="flex flex-wrap gap-1">
            {babyPals.slice(0, 12).map((pal, i) => (
              <PalImage
                key={`${pal.id}-${i}`}
                iconName={pal.iconName}
                name={pal.name}
                size="sm"
              />
            ))}
            {babyPals.length > 12 && (
              <span className="text-[11px] font-medium self-center" style={{ color: 'var(--text-muted)' }}>
                +{babyPals.length - 12}
              </span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
