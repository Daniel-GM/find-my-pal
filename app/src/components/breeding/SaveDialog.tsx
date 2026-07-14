import { motion, AnimatePresence } from 'framer-motion';
import { Package } from 'lucide-react';
import { useTranslation } from '@/i18n';
import type { BreedingCombination } from '@/lib/breeding';
import type { Package as PackageType } from '@/hooks/useAppState';

const EASE_BEZIER = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

interface SaveDialogProps {
  isOpen: boolean;
  combo: BreedingCombination | null;
  showCreate: boolean;
  packages: PackageType[];
  newPackageName: string;
  newPackageDesc: string;
  onClose: () => void;
  onPackageNameChange: (value: string) => void;
  onPackageDescChange: (value: string) => void;
  onCreateAndSave: () => void;
  onSaveToExisting: (pkgId: string) => void;
  onShowCreatePackage: () => void;
  onBackToList: () => void;
}

export function SaveDialog({
  isOpen,
  combo,
  showCreate,
  packages,
  newPackageName,
  newPackageDesc,
  onClose,
  onPackageNameChange,
  onPackageDescChange,
  onCreateAndSave,
  onSaveToExisting,
  onShowCreatePackage,
  onBackToList,
}: SaveDialogProps) {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {isOpen && combo && (
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
              maxWidth: 480,
              width: '90%',
              padding: 24,
            }}
          >
            <h3
              className="text-[18px] font-semibold mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              {showCreate || packages.length === 0
                ? 'Create Your First Package'
                : 'Save Combination'}
            </h3>

            <p
              className="text-[14px] mb-4"
              style={{ color: 'var(--text-secondary)' }}
            >
              Saving:{" "}
              <strong style={{ color: 'var(--text-primary)' }}>
                {combo.parentA.name}
              </strong>{" "}+
              <strong style={{ color: 'var(--text-primary)' }}>
                {combo.parentB.name}
              </strong>{" "}={" "}
              <strong style={{ color: 'var(--accent-violet)' }}>
                {combo.baby.name}
              </strong>
            </p>

            {showCreate || packages.length === 0 ? (
              <div className="flex flex-col gap-4">
                <div>
                  <label
                    className="block text-[13px] font-medium mb-1.5"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Package Name *
                  </label>
                  <input
                    type="text"
                    value={newPackageName}
                    onChange={(e) => onPackageNameChange(e.target.value)}
                    placeholder="e.g., Breed Plantacao"
                    maxLength={50}
                    className="w-full text-[14px] outline-none transition-all duration-150"
                    style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      backgroundColor: 'var(--bg-base)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                <div>
                  <label
                    className="block text-[13px] font-medium mb-1.5"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Description (optional)
                  </label>
                  <textarea
                    value={newPackageDesc}
                    onChange={(e) => onPackageDescChange(e.target.value)}
                    placeholder="What is this package for?"
                    maxLength={200}
                    rows={3}
                    className="w-full text-[14px] outline-none resize-none transition-all duration-150"
                    style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      backgroundColor: 'var(--bg-base)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  {packages.length > 0 && (
                    <button
                      onClick={onBackToList}
                      className="text-[13px] font-medium transition-colors duration-150"
                      style={{
                        padding: '8px 16px',
                        borderRadius: 8,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      Back
                    </button>
                  )}
                  <button
                    onClick={onCreateAndSave}
                    disabled={!newPackageName.trim()}
                    className="text-[13px] font-medium transition-all duration-150 disabled:opacity-50"
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      backgroundColor: 'var(--accent-violet)',
                      color: '#FFFFFF',
                    }}
                  >
                    {t('breeding.createAndSave')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
                {packages.map((pkg, i) => (
                  <motion.button
                    key={pkg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => onSaveToExisting(pkg.id)}
                    className="flex items-center gap-3 text-left w-full transition-all duration-150"
                    style={{
                      padding: '12px 16px',
                      borderRadius: 10,
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
                    <div
                      className="flex items-center justify-center rounded-lg"
                      style={{
                        width: 32,
                        height: 32,
                        backgroundColor: 'var(--accent-violet)',
                      }}
                    >
                      <Package size={16} color="#FFFFFF" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-[14px] font-medium truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {pkg.name}
                      </div>
                      <div
                        className="text-[12px]"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {pkg.combinationIds.length} {t('breeding.combinations')}
                      </div>
                    </div>
                  </motion.button>
                ))}

                <button
                  onClick={onShowCreatePackage}
                  className="flex items-center gap-2 text-[13px] font-medium transition-colors duration-150 mt-1"
                  style={{
                    padding: '10px 16px',
                    borderRadius: 8,
                    color: 'var(--accent-violet)',
                  }}
                >
                  + {t('breeding.createNewPackage')}
                </button>

                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={onClose}
                    className="text-[13px] font-medium transition-colors duration-150"
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {t('app.cancel')}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
