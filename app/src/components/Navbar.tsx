import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitBranch,
  Package,
  Swords,
  TrendingUp,
  Users,
  Crown,
  Sun,
  Moon,
  Search,
  X,
  Wrench,
  Factory,
  LogIn,
  LogOut,
} from 'lucide-react';
import type { AppState, View } from '@/hooks/useAppState';
import { PALS, ELEMENTS } from '@/data/pals';
import type { PalElement } from '@/data/pals';
import { getElementColor } from '@/lib/elements';
import { getElementIconUrl } from '@/lib/images';
import type { Locale, TranslationKey } from '@/i18n/types';
import PalImage from '@/components/PalImage';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';

function LanguageFlag({ locale }: { locale: Locale }) {
  if (locale === 'pt-BR') {
    return (
      <svg
        width={16}
        height={16}
        viewBox="0 0 16 16"
        aria-hidden
        className="shrink-0 rounded-sm overflow-hidden"
      >
        <rect width="16" height="16" fill="#009C3B" />
        <polygon points="8,2.5 13.5,8 8,13.5 2.5,8" fill="#FFDF00" />
        <circle cx="8" cy="8" r="3" fill="#002776" />
        <path
          d="M5.2 8.4c1.6-1.1 3.9-1.1 5.6 0"
          fill="none"
          stroke="#fff"
          strokeWidth="0.7"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 16 16"
      aria-hidden
      className="shrink-0 rounded-sm overflow-hidden"
    >
      <rect width="16" height="16" fill="#B22234" />
      {[2.15, 4.3, 6.45, 8.6, 10.75, 12.9].map((y) => (
        <rect key={y} y={y} width="16" height="1.05" fill="#fff" />
      ))}
      <rect width="7.2" height="8.6" fill="#3C3B6E" />
      {[1.2, 2.8, 4.4, 6].map((x) =>
        [1.4, 3.2, 5, 6.8].map((y) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="0.45" fill="#fff" />
        )),
      )}
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" aria-hidden className="shrink-0">
      <path
        fill="#4285F4"
        d="M15.68 8.18c0-.57-.05-1.11-.14-1.64H8v3.1h4.3a3.68 3.68 0 0 1-1.6 2.42v2h2.59c1.52-1.4 2.39-3.46 2.39-5.88z"
      />
      <path
        fill="#34A853"
        d="M8 16c2.16 0 3.97-.72 5.29-1.94l-2.59-2c-.72.48-1.64.77-2.7.77-2.08 0-3.84-1.4-4.47-3.29H.85v2.07A8 8 0 0 0 8 16z"
      />
      <path
        fill="#FBBC05"
        d="M3.53 9.54A4.8 4.8 0 0 1 3.28 8c0-.54.09-1.06.25-1.54V4.39H.85a8 8 0 0 0 0 7.22l2.68-2.07z"
      />
      <path
        fill="#EA4335"
        d="M8 3.18c1.17 0 2.23.4 3.06 1.2l2.29-2.3A7.98 7.98 0 0 0 8 0 8 8 0 0 0 .85 4.39l2.68 2.07C4.16 4.58 5.92 3.18 8 3.18z"
      />
    </svg>
  );
}

function useNavItems(): { view: View; labelKey: string; icon: typeof GitBranch }[] {
  const { t } = useTranslation();
  return [
    { view: 'breeding', labelKey: t('nav.breeding'), icon: GitBranch },
    { view: 'packages', labelKey: t('nav.packages'), icon: Package },
    { view: 'team', labelKey: t('nav.team'), icon: Swords },
    { view: 'mounts', labelKey: t('nav.mounts'), icon: TrendingUp },
    { view: 'pals', labelKey: t('nav.pals'), icon: Users },
    { view: 'bossdrops', labelKey: t('nav.bossDrops'), icon: Crown },
    { view: 'crafting', labelKey: t('nav.crafting'), icon: Factory },
    { view: 'builds', labelKey: t('nav.builds'), icon: Wrench },
  ];
}

interface NavbarProps {
  appState: AppState;
}

export default function Navbar({ appState }: NavbarProps) {
  const {
    currentView,
    theme,
    selectedPalId,
    setView,
    selectPal,
    toggleTheme,
  } = appState;
  const { t, locale, setLocale } = useTranslation();
  const { user, loading: authLoading, signInWithGoogle, logout } = useAuth();
  const NAV_ITEMS = useNavItems();

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      // User closed the popup — nothing to report.
      if ((error as { code?: string }).code === 'auth/popup-closed-by-user') return;
      console.warn('Google sign-in failed:', error);
    }
  };

  const [search, setSearch] = useState('');
  const [activeElement, setActiveElement] = useState<PalElement | 'all'>('all');

  const filteredPals = useMemo(() => {
    let result = [...PALS];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          String(p.number).includes(q) ||
          p.id.toLowerCase().includes(q),
      );
    }

    if (activeElement !== 'all') {
      result = result.filter((p) => p.elements.includes(activeElement));
    }

    return result;
  }, [search, activeElement]);

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-[280px] flex flex-col overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-subtle)',
        zIndex: 50,
      }}
    >
      {/* App Title */}
      <div
        className="flex items-center gap-3 px-5 py-4 shrink-0"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg overflow-hidden"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          <img
            src="/favicon.png"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-contain"
          />
        </div>
        <h1
          className="text-[18px] font-bold leading-tight tracking-[-0.02em]"
          style={{ color: 'var(--text-primary)' }}
        >
          {t('app.title')}
        </h1>
      </div>

      {/* Nav Items */}
      <nav className="flex flex-col gap-1 px-3 py-3 shrink-0">
        {NAV_ITEMS.map((item) => {
          const isActive = currentView === item.view;
          const Icon = item.icon;
          return (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              className="flex items-center gap-3 w-full text-left transition-all duration-150 ease-out"
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                backgroundColor: isActive
                  ? 'var(--bg-active)'
                  : 'transparent',
                color: isActive
                  ? 'var(--text-primary)'
                  : 'var(--text-secondary)',
                borderLeft: isActive
                  ? '3px solid var(--accent-violet)'
                  : '3px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <Icon size={18} />
              <span className="text-[14px] font-medium">{item.labelKey}</span>
            </button>
          );
        })}
      </nav>

      {/* Theme Toggle */}
      <div className="px-3 pb-2 shrink-0">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full transition-all duration-150"
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
          }}
        >
          <motion.div
            key={theme}
            initial={{ rotate: -180, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
          </motion.div>
          <span className="text-[13px] font-medium">
            {theme === 'dark' ? t('theme.dark') : t('theme.light')}
          </span>
        </button>
      </div>

      {/* Language Toggle */}
      <div className="px-3 pb-2 shrink-0">
        <button
          onClick={() => setLocale(locale === 'pt-BR' ? 'en' : 'pt-BR')}
          className="flex items-center gap-3 w-full transition-all duration-150"
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
          }}
        >
          <LanguageFlag locale={locale} />
          <span className="text-[13px] font-medium">
            {locale === 'pt-BR' ? t('lang.pt-BR') : t('lang.en')}
          </span>
        </button>
      </div>

      {/* Account */}
      {!authLoading && (
        <div className="px-3 pb-2 shrink-0">
          {user ? (
            <div
              className="flex items-center gap-3 w-full"
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-4 h-4 rounded-full shrink-0"
                />
              ) : (
                <LogIn size={16} className="shrink-0" />
              )}
              <span className="flex-1 truncate text-[13px] font-medium">
                {user.displayName || user.email}
              </span>
              <button
                onClick={() => void logout()}
                title={t('auth.signOut')}
                aria-label={t('auth.signOut')}
                style={{ color: 'var(--text-muted)' }}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => void handleSignIn()}
              className="flex items-center gap-3 w-full transition-all duration-150"
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
            >
              <GoogleIcon />
              <span className="text-[13px] font-medium">{t('auth.signInGoogle')}</span>
            </button>
          )}
        </div>
      )}

      {/* Divider */}
      <div
        className="mx-3 shrink-0"
        style={{
          height: 1,
          backgroundColor: 'var(--border-subtle)',
        }}
      />

      {/* Search */}
      <div className="px-3 py-3 shrink-0">
        <div
          className="flex items-center gap-2 px-3 transition-all duration-150"
          style={{
            height: 40,
            borderRadius: 8,
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('app.searchPals')}
            className="flex-1 bg-transparent outline-none text-[14px]"
            style={{ color: 'var(--text-primary)' }}
          />
          <AnimatePresence>
            {search && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setSearch('')}
              >
                <X size={14} style={{ color: 'var(--text-muted)' }} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Element Filter Chips */}
      <div className="px-3 pb-2 shrink-0">
        <div className="flex gap-1 flex-wrap">
          {(['all', ...ELEMENTS] as const).map((el) => {
            const isActive = activeElement === el;
            const isAll = el === 'all';
            const color = isAll ? '#8b5cf6' : getElementColor(el);
            return (
              <button
                key={`el-${el}`}
                onClick={() => setActiveElement(isAll ? 'all' : (isActive ? 'all' : el as PalElement | 'all'))}
                className="shrink-0 text-[11px] font-semibold rounded-full border transition-all"
                style={{
                  padding: '4px 10px',
                  backgroundColor: isActive ? color : 'transparent',
                  color: isActive ? '#0E0E12' : color,
                  borderColor: isActive ? color : 'rgba(255,255,255,0.1)',
                }}
              >
                {isAll ? t('app.all') : t(`element.${el}` as TranslationKey)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Pal List */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 min-h-0">
        <div className="grid grid-cols-2 gap-1.5">
          {filteredPals.map((pal, index) => {
            const isSelected = selectedPalId === pal.id;

            return (
              <motion.button
                key={pal.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.005, duration: 0.15 }}
                onClick={() =>
                  selectPal(isSelected ? null : pal.id)
                }
                className="flex flex-col items-center gap-1 cursor-pointer transition-all duration-100"
                style={{
                  padding: 8,
                  borderRadius: 8,
                  backgroundColor: isSelected
                    ? 'var(--bg-active)'
                    : 'transparent',
                  borderLeft: isSelected
                    ? '3px solid var(--accent-violet)'
                    : '3px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {/* Pal Icon */}
                <PalImage
                  iconName={pal.iconName}
                  name={pal.name}
                  size="sm"
                  style={{
                    border: isSelected
                      ? '2px solid var(--accent-violet)'
                      : '2px solid transparent',
                  }}
                />

                {/* Pal Name */}
                <span
                  className="text-[12px] font-medium text-center w-full truncate"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {pal.name}
                </span>

                {/* Pal Number */}
                <span
                  className="text-[10px]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {pal.number === 0 ? '???' : `#${String(pal.number).padStart(3, '0')}`}
                </span>

                {/* Element Icons */}
                <div className="flex gap-0.5">
                  {pal.elements.map((el) => (
                    <img
                      key={el}
                      src={getElementIconUrl(el)}
                      alt=""
                      className="element-icon"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ))}
                </div>
              </motion.button>
            );
          })}
        </div>

        {filteredPals.length === 0 && (
          <div className="flex flex-col items-center py-8 gap-2">
            <Search size={24} style={{ color: 'var(--text-muted)' }} />
            <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              {t('app.noPalsFound')}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
