import { motion } from 'framer-motion';
import { useTranslation } from '@/i18n';
import type { TranslationKey } from '@/i18n/types';

export interface InfoSection {
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
}

interface InfoPageProps {
  titleKey: TranslationKey;
  subtitleKey?: TranslationKey;
  sections: InfoSection[];
}

/** Shared layout for static content pages (About, Privacy Policy). */
export default function InfoPage({ titleKey, subtitleKey, sections }: InfoPageProps) {
  const { t } = useTranslation();

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <h1
          className="text-[24px] font-bold mb-1"
          style={{ color: 'var(--text-primary)' }}
        >
          {t(titleKey)}
        </h1>
        {subtitleKey && (
          <p className="text-[12px] mb-6" style={{ color: 'var(--text-muted)' }}>
            {t(subtitleKey)}
          </p>
        )}
        <div className="flex flex-col gap-4 mt-6">
          {sections.map((section) => (
            <section
              key={section.titleKey}
              className="p-4"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 12,
              }}
            >
              <h2
                className="text-[15px] font-semibold mb-1.5"
                style={{ color: 'var(--text-primary)' }}
              >
                {t(section.titleKey)}
              </h2>
              <p
                className="text-[13px] leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                {t(section.bodyKey)}
              </p>
            </section>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
