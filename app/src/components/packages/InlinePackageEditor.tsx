import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/i18n';
import type { Package as PkgType } from '@/hooks/useAppState';

interface InlinePackageEditorProps {
  pkg: PkgType;
  onSave: (name: string, desc?: string) => void;
  onCancel: () => void;
}

export default function InlinePackageEditor({
  pkg,
  onSave,
  onCancel,
}: InlinePackageEditorProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(pkg.name);
  const [desc, setDesc] = useState(pkg.description || '');

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-2"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 16,
        border: '1px solid var(--accent-violet)',
        padding: 16,
      }}
    >
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('packages.packageName')}
        className="w-full text-[14px] font-semibold outline-none"
        style={{
          padding: '8px 10px',
          borderRadius: 8,
          backgroundColor: 'var(--bg-base)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
        autoFocus
      />
      <input
        type="text"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder={t('packages.packageDescription')}
        className="w-full text-[13px] outline-none"
        style={{
          padding: '8px 10px',
          borderRadius: 8,
          backgroundColor: 'var(--bg-base)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
      />
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="text-[12px] font-medium"
          style={{ padding: '6px 12px', borderRadius: 6, color: 'var(--text-secondary)' }}
        >
          {t('app.cancel')}
        </button>
        <button
          onClick={() => onSave(name.trim(), desc.trim() || undefined)}
          disabled={!name.trim()}
          className="text-[12px] font-medium transition-all disabled:opacity-50"
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            backgroundColor: 'var(--accent-violet)',
            color: '#FFFFFF',
          }}
        >
          {t('app.save')}
        </button>
      </div>
    </motion.div>
  );
}
