import { useState, useMemo } from 'react';
import { Package, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/i18n';
import {
  PackageCard,
  PackageDetail,
  InlinePackageEditor,
} from '@/components/packages';
import type { AppState } from '@/hooks/useAppState';

interface PackagesProps {
  appState: AppState;
}

export default function Packages({ appState }: PackagesProps) {
  const { t } = useTranslation();
  const { packages, deletePackage, addPackage } = appState;
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [viewingPackageId, setViewingPackageId] = useState<string | null>(null);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);

  const viewingPackage = useMemo(
    () => packages.find((p) => p.id === viewingPackageId) || null,
    [packages, viewingPackageId]
  );

  const handleCreate = () => {
    if (!name.trim()) return;
    addPackage({ name: name.trim(), description: desc.trim() || undefined, combinationIds: [] });
    setName('');
    setDesc('');
    setShowCreate(false);
  };

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
            {t('packages.title')}
          </h1>
          <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            {t('packages.noPackagesDesc')}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 text-[13px] font-medium transition-all duration-150 hover:scale-[1.02]"
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            backgroundColor: 'var(--accent-violet)',
            color: '#FFFFFF',
          }}
        >
          <Plus size={16} />
          {t('packages.createPackage')}
        </button>
      </div>

      <div style={{ padding: '24px' }}>
        {packages.length === 0 && !showCreate ? (
          <div
            className="flex flex-col items-center justify-center py-24 gap-4"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Package size={64} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
            <h3
              className="text-[18px] font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              {t('packages.noPackages')}
            </h3>
            <p className="text-[14px] text-center" style={{ maxWidth: 360 }}>
              {t('packages.noPackagesDesc')}
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="text-[13px] font-medium mt-2 transition-all duration-150 hover:scale-[1.02]"
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                backgroundColor: 'var(--accent-violet)',
                color: '#FFFFFF',
              }}
            >
              {t('packages.createPackage')}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {showCreate && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 16,
                  border: '1px solid var(--border-subtle)',
                  padding: 20,
                }}
              >
                <h3
                  className="text-[16px] font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {t('packages.createPackage')}
                </h3>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('packages.packageName')}
                  maxLength={50}
                  className="w-full text-[14px] outline-none"
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    backgroundColor: 'var(--bg-base)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                />
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder={t('packages.packageDescription')}
                  maxLength={200}
                  rows={2}
                  className="w-full text-[14px] outline-none resize-none"
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    backgroundColor: 'var(--bg-base)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setShowCreate(false);
                      setName('');
                      setDesc('');
                    }}
                    className="text-[13px] font-medium"
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {t('app.cancel')}
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!name.trim()}
                    className="text-[13px] font-medium transition-all duration-150 disabled:opacity-50"
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      backgroundColor: 'var(--accent-violet)',
                      color: '#FFFFFF',
                    }}
                  >
                    {t('app.create')}
                  </button>
                </div>
              </motion.div>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fill, minmax(320px, 1fr))',
                gap: 16,
              }}
            >
              {packages.map((pkg) => (
                editingPackageId === pkg.id ? (
                  <InlinePackageEditor
                    key={pkg.id}
                    pkg={pkg}
                    onSave={(editName, editDesc) => {
                      appState.editPackage(pkg.id, editName, editDesc);
                      setEditingPackageId(null);
                    }}
                    onCancel={() => setEditingPackageId(null)}
                  />
                ) : (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg}
                    onDelete={deletePackage}
                    onClick={() => setViewingPackageId(pkg.id)}
                    onEdit={() => setEditingPackageId(pkg.id)}
                  />
                )
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Package Detail Modal */}
      <AnimatePresence>
        {viewingPackage && (
          <PackageDetail
            pkg={viewingPackage}
            appState={appState}
            onClose={() => setViewingPackageId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
