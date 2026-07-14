/* eslint-disable react-refresh/only-export-components -- provider file exports hooks/helpers alongside the root component */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Locale, TranslationKey } from './types';
import { en } from './locales/en';
import { ptBR } from './locales/pt-BR';

const LOCALE_STORAGE_KEY = 'palworld-locale';

const translations: Record<Locale, typeof en> = {
  'en': en,
  'pt-BR': ptBR,
};

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function detectLocale(): Locale {
  // Check localStorage first
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved === 'en' || saved === 'pt-BR') return saved;
  } catch { /* ignore */ }

  // Check browser language
  const browserLang = navigator.language || (navigator as unknown as { userLanguage?: string }).userLanguage || 'en';
  if (browserLang.startsWith('pt')) return 'pt-BR';

  return 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    } catch { /* ignore */ }
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      const messages = translations[locale];
      let text = messages[key] || key;

      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        });
      }

      return text;
    },
    [locale],
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useTranslation must be used within I18nProvider');
  }
  return ctx;
}

// Helper functions for data translations (work types, elements)
export function getWorkTypeLabel(workType: string, locale: Locale): string {
  const key = `work.${workType}` as TranslationKey;
  const messages = translations[locale];
  return messages[key] || workType;
}

export function getElementLabel(element: string, locale: Locale): string {
  const key = `element.${element}` as TranslationKey;
  const messages = translations[locale];
  return messages[key] || element;
}

// Re-export game data translation functions
export {
  getItemName,
  getSkillName,
  getSkillDescription,
  getBuildTranslation,
} from './gameData';
export type { BuildTranslation } from './gameData';
export type { Locale } from './types';
