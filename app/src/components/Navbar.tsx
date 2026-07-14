import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitBranch,
  Package,
  CheckCircle2,
  TrendingUp,
  Users,
  Crown,
  Sun,
  Moon,
  Search,
  X,
  Wrench,
  Globe,
  Factory,
} from 'lucide-react';
import type { AppState, View } from '@/hooks/useAppState';
import { PALS, ELEMENTS } from '@/data/pals';
import type { PalElement } from '@/data/pals';
import { getElementColor } from '@/lib/elements';
import { getElementIconUrl } from '@/lib/images';
import type { TranslationKey } from '@/i18n/types';
import PalImage from '@/components/PalImage';
import { useTranslation } from '@/i18n';

function useNavItems(): { view: View; labelKey: string; icon: typeof GitBranch }[] {
  const { t } = useTranslation();
  return [
    { view: 'breeding', labelKey: t('nav.breeding'), icon: GitBranch },
    { view: 'packages', labelKey: t('nav.packages'), icon: Package },
    { view: 'completed', labelKey: t('nav.completed'), icon: CheckCircle2 },
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
  const NAV_ITEMS = useNavItems();

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
          className="flex items-center justify-center w-8 h-8 rounded-lg"
          style={{ backgroundColor: 'var(--accent-violet)' }}
        >
          <GitBranch size={18} color="#FFFFFF" />
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
          <Globe size={16} />
          <span className="text-[13px] font-medium">
            {locale === 'pt-BR' ? t('lang.pt-BR') : t('lang.en')}
          </span>
        </button>
      </div>

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
          <div>
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
