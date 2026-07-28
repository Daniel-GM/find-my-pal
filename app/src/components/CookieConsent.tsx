import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/i18n';
import { getCookieConsent, setCookieConsent } from '@/lib/cookie-consent';
import type { ConsentChoice } from '@/lib/cookie-consent';

export default function CookieConsent() {
  const { t } = useTranslation();
  const [choice, setChoice] = useState<ConsentChoice | null>(getCookieConsent);

  const choose = (value: ConsentChoice) => {
    setCookieConsent(value);
    setChoice(value);
  };

  return (
    <AnimatePresence>
      {choice === null && (
        <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-2xl pointer-events-auto"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 12,
              boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
              padding: 16,
            }}
            role="dialog"
            aria-label={t('consent.message')}
          >
            <p
              className="text-[13px] leading-relaxed mb-3"
              style={{ color: 'var(--text-secondary)' }}
            >
              {t('consent.message')}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => choose('rejected')}
                className="text-[13px] font-medium"
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {t('consent.reject')}
              </button>
              <button
                onClick={() => choose('accepted')}
                className="text-[13px] font-semibold"
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: 'var(--accent-violet)',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                {t('consent.accept')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
