import { useState } from 'react';
import { Package, X, Check, ChevronUp, ChevronDown, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/i18n';
import { PALS } from '@/data/pals';
import PalImage from '@/components/PalImage';
import { ElementBadge, WorkSuitabilityGrid } from '@/components/breeding';
import type { PalElement } from '@/data/pals';
import type { Package as PkgType } from '@/hooks/useAppState';
import type { AppState } from '@/hooks/useAppState';

interface PackageDetailProps {
  pkg: PkgType;
  appState: AppState;
  onClose: () => void;
}

const EASE_BEZIER = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

function parseCombinationId(comboId: string) {
  const parts = comboId.split('=');
  if (parts.length !== 2) return null;
  const parents = parts[0].split('+');
  if (parents.length !== 2) return null;
  const parentA = PALS.find((p) => p.id === parents[0]);
  const parentB = PALS.find((p) => p.id === parents[1]);
  const baby = PALS.find((p) => p.id === parts[1]);
  if (!parentA || !parentB || !baby) return null;
  return { parentA, parentB, baby };
}

export default function PackageDetail({
  pkg,
  appState,
  onClose,
}: PackageDetailProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(pkg.name);
  const [editDesc, setEditDesc] = useState(pkg.description || '');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
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
          maxWidth: 700,
          width: '90%',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 24,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder={t('packages.packageName')}
                  className="w-full text-[18px] font-bold outline-none"
                  style={{
                    backgroundColor: 'var(--bg-base)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    padding: '6px 10px',
                    color: 'var(--text-primary)',
                  }}
                  autoFocus
                />
                <input
                  type="text"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder={t('packages.packageDescription')}
                  className="w-full text-[13px] outline-none"
                  style={{
                    backgroundColor: 'var(--bg-base)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    padding: '6px 10px',
                    color: 'var(--text-primary)',
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      appState.editPackage(pkg.id, editName.trim(), editDesc.trim() || undefined);
                      setIsEditing(false);
                    }}
                    className="text-[12px] font-medium px-3 py-1 rounded"
                    style={{ backgroundColor: 'var(--accent-violet)', color: '#FFFFFF' }}
                  >
                    {t('app.save')}
                  </button>
                  <button
                    onClick={() => {
                      setEditName(pkg.name);
                      setEditDesc(pkg.description || '');
                      setIsEditing(false);
                    }}
                    className="text-[12px] font-medium px-3 py-1 rounded"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {t('app.cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-[20px] font-bold" style={{ color: 'var(--text-primary)' }}>
                    {pkg.name}
                  </h2>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center justify-center rounded transition-all duration-150 hover:scale-110"
                    style={{
                      width: 28,
                      height: 28,
                      backgroundColor: 'var(--bg-hover)',
                      color: 'var(--text-secondary)',
                    }}
                    title={t('app.edit')}
                  >
                    <Pencil size={13} />
                  </button>
                </div>
                {pkg.description && (
                  <p className="text-[13px] mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {pkg.description}
                  </p>
                )}
                <p className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  {pkg.combinationIds.length} {t('packages.items')}
                  {' \u00b7 '}
                  {t('packages.completedOf', { completed: pkg.completedCombinationIds.length, total: pkg.combinationIds.length })}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-lg"
            style={{ width: 32, height: 32, backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
            title={t('app.close')}
          >
            <X size={16} />
          </button>
        </div>

        {/* Combinations List */}
        <div className="flex-1 overflow-y-auto" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {pkg.combinationIds.length === 0 && (
            <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
              <Package size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, margin: '0 auto' }} />
              <p className="mt-3">{t('packages.emptyPackageDesc')}</p>
            </div>
          )}
          {pkg.combinationIds.map((comboId, i) => {
            const combo = parseCombinationId(comboId);
            if (!combo) return null;
            const isCompleted = pkg.completedCombinationIds.includes(comboId);
            return (
              <motion.div
                key={comboId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderRadius: 12,
                  border: '1px solid var(--border-subtle)',
                  borderLeft: isCompleted ? '3px solid var(--accent-emerald)' : '1px solid var(--border-subtle)',
                  padding: 14,
                  opacity: isCompleted ? 0.7 : 1,
                }}
              >
                {/* Action buttons */}
                <div className="flex items-center justify-end gap-1 mb-2">
                  {/* Complete toggle */}
                  <button
                    onClick={() => appState.toggleCompleteInPackage(pkg.id, comboId)}
                    className="flex items-center justify-center rounded-full transition-all duration-150"
                    style={{
                      width: 28,
                      height: 28,
                      backgroundColor: isCompleted ? 'var(--accent-emerald)' : 'var(--bg-hover)',
                    }}
                    title={isCompleted ? t('breeding.markIncomplete') : t('breeding.markCompleted')}
                  >
                    <Check size={13} color={isCompleted ? '#FFFFFF' : 'var(--text-secondary)'} />
                  </button>
                  {/* Move up */}
                  <button
                    onClick={() => appState.moveCombinationUp(pkg.id, comboId)}
                    disabled={i === 0}
                    className="flex items-center justify-center rounded transition-all duration-150 disabled:opacity-30"
                    style={{ width: 28, height: 28, backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
                    title={t('packages.moveUp')}
                  >
                    <ChevronUp size={14} />
                  </button>
                  {/* Move down */}
                  <button
                    onClick={() => appState.moveCombinationDown(pkg.id, comboId)}
                    disabled={i === pkg.combinationIds.length - 1}
                    className="flex items-center justify-center rounded transition-all duration-150 disabled:opacity-30"
                    style={{ width: 28, height: 28, backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
                    title={t('packages.moveDown')}
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>

                {/* Parents + Result */}
                <div className="flex items-start gap-3">
                  {/* Parent A */}
                  <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                    <PalImage iconName={combo.parentA.iconName} name={combo.parentA.name} size="md" />
                    <span className="text-[12px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{combo.parentA.name}</span>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>#{String(combo.parentA.number).padStart(3, '0')}</span>
                    <div className="flex flex-wrap justify-center gap-1">{combo.parentA.elements.map((el: PalElement) => <ElementBadge key={el} element={el} />)}</div>
                    <WorkSuitabilityGrid pal={combo.parentA} />
                  </div>

                  {/* Plus */}
                  <div className="flex flex-col items-center justify-center shrink-0 self-stretch">
                    <div style={{ width: 1, flex: 1, backgroundColor: 'var(--border-subtle)' }} />
                    <span className="text-[14px] font-light my-1" style={{ color: 'var(--text-muted)' }}>+</span>
                    <div style={{ width: 1, flex: 1, backgroundColor: 'var(--border-subtle)' }} />
                  </div>

                  {/* Parent B */}
                  <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                    <PalImage iconName={combo.parentB.iconName} name={combo.parentB.name} size="md" />
                    <span className="text-[12px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{combo.parentB.name}</span>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>#{String(combo.parentB.number).padStart(3, '0')}</span>
                    <div className="flex flex-wrap justify-center gap-1">{combo.parentB.elements.map((el: PalElement) => <ElementBadge key={el} element={el} />)}</div>
                    <WorkSuitabilityGrid pal={combo.parentB} />
                  </div>

                  {/* Equals */}
                  <div className="flex flex-col items-center justify-center shrink-0 self-stretch">
                    <div style={{ width: 1, flex: 1, backgroundColor: 'var(--border-subtle)' }} />
                    <span className="text-[14px] font-light my-1" style={{ color: 'var(--accent-violet)' }}>=</span>
                    <div style={{ width: 1, flex: 1, backgroundColor: 'var(--border-subtle)' }} />
                  </div>

                  {/* Result / Baby */}
                  <div className="flex flex-col items-center gap-1 flex-1 min-w-0" style={{ background: 'rgba(139,92,246,0.04)', borderRadius: 8, padding: '6px 4px' }}>
                    <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--accent-violet)' }}>{t('breeding.result')}</span>
                    <PalImage iconName={combo.baby.iconName} name={combo.baby.name} size="md" style={{ border: '2px solid var(--accent-violet)' }} />
                    <span className="text-[12px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{combo.baby.name}</span>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>#{String(combo.baby.number).padStart(3, '0')}</span>
                    <div className="flex flex-wrap justify-center gap-1">{combo.baby.elements.map((el: PalElement) => <ElementBadge key={el} element={el} />)}</div>
                    <WorkSuitabilityGrid pal={combo.baby} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
