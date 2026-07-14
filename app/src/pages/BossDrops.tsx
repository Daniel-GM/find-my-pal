import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Crown, Search, X, Sparkles, Package } from 'lucide-react';
import { PAL_DROPS, isRareDrop, getAllDropItems, getItemImageUrl } from '@/data/drops';
import { findPalByName } from '@/data/pals';
import { useTranslation, getItemName } from '@/i18n';
import type { Locale } from '@/i18n';
import PalImage from '@/components/PalImage';

const EASE_BEZIER = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

function DropItemCard({
  itemName,
  itemId,
  palNames,
  index,
  locale,
}: {
  itemName: string;
  itemId: string;
  palNames: string[];
  index: number;
  locale: Locale;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const rare = isRareDrop(itemName);
  const imgUrl = getItemImageUrl(itemId);
  const translatedItemName = getItemName(itemName, locale);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.5), duration: 0.2, ease: EASE_BEZIER }}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 12,
        border: `1px solid ${rare ? 'rgba(234,179,8,0.3)' : 'var(--border-subtle)'}`,
        transition: 'border-color 0.15s ease',
      }}
    >
      {/* Item Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 text-left"
      >
        {/* Item Image */}
        <img
          src={imgUrl}
          alt={translatedItemName}
          className="w-9 h-9 object-contain shrink-0"
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          style={{ imageRendering: 'auto' }}
        />
        <div className="flex-1 min-w-0">
          <span className="text-[13px] font-bold" style={{ color: rare ? 'var(--accent-amber)' : 'var(--text-primary)' }}>
            {translatedItemName}
          </span>
          <span className="text-[11px] ml-2" style={{ color: 'var(--text-muted)' }}>
            {t('drops.palCount', { count: palNames.length })}
          </span>
        </div>
        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {/* Pals that drop this item */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.2 }}
          className="px-3 pb-3"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <div className="flex flex-wrap gap-2 pt-2">
            {palNames.map((palName) => {
              const pal = findPalByName(palName);
              const drops = PAL_DROPS[palName] || [];
              const drop = drops.find((d) => d.itemName === itemName);
              return (
                <div
                  key={palName}
                  className="flex items-center gap-2"
                  style={{
                    padding: '4px 10px',
                    borderRadius: 8,
                    backgroundColor: 'var(--bg-base)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {pal && (
                    <PalImage
                      iconName={pal.iconName}
                      name={pal.name}
                      size="sm"
                    />
                  )}
                  <span className="text-[11px] font-medium" style={{ color: 'var(--text-primary)' }}>
                    {palName}
                  </span>
                  {drop && (
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {drop.rate}%
                      {drop.min !== drop.max ? ` (${drop.min}-${drop.max})` : drop.min > 1 ? ` x${drop.min}` : ''}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function BossDrops() {
  const { t, locale } = useTranslation();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(0);
  const allItems = useMemo(() => getAllDropItems(), []);

  // Category definitions using translation keys
  const itemCategories = useMemo(() => [
    { key: 'all', label: t('drops.allItems'), filter: () => true },
    { key: 'gems', label: t('drops.gemsAndCoins'), filter: (n: string) => /diamond|ruby|sapphire|emerald|gold|ancient/i.test(n) },
    { key: 'organs', label: t('drops.organs'), filter: (n: string) => /organ|gland|core|fragment/i.test(n) },
    { key: 'materials', label: t('drops.materials'), filter: (n: string) => /fiber|leather|bone|horn|claw|oil|quartz|carbon|polymer|ingot/i.test(n) },
    { key: 'food', label: t('drops.food'), filter: (n: string) => /meat|berry|egg|milk|bread|cake|jam|honey|coffee/i.test(n) },
    { key: 'rare', label: t('drops.rareOnly'), filter: (n: string) => isRareDrop(n) },
  ], [t]);

  const filteredItems = useMemo(() => {
    const cat = itemCategories[activeCategory];
    let filtered = allItems.filter((i) => cat.filter(i.itemName));

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.itemName.toLowerCase().includes(q) ||
          i.pals.some((p) => p.toLowerCase().includes(q)),
      );
    }

    // Sort: rare items first, then by number of pals
    return filtered.sort((a, b) => {
      const aRare = isRareDrop(a.itemName) ? 1 : 0;
      const bRare = isRareDrop(b.itemName) ? 1 : 0;
      if (aRare !== bRare) return bRare - aRare;
      return b.pals.length - a.pals.length;
    });
  }, [allItems, activeCategory, search, itemCategories]);

  // Stats
  const stats = useMemo(() => {
    const totalItems = allItems.length;
    const rareCount = allItems.filter((i) => isRareDrop(i.itemName)).length;
    const totalPalsWithDrops = Object.keys(PAL_DROPS).length;
    return { totalItems, rareCount, totalPalsWithDrops };
  }, [allItems]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mb-5">
        <div className="flex items-center gap-3 mb-2">
          <Crown size={22} style={{ color: 'var(--accent-amber)' }} />
          <h1 className="text-[22px] font-bold" style={{ color: 'var(--text-primary)' }}>
            {t('drops.title')}
          </h1>
        </div>
        <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
          {t('drops.description')}
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3 mb-5"
      >
        <StatCard icon={<Package size={16} />} label={t('drops.dropItems')} value={stats.totalItems.toString()} />
        <StatCard icon={<Sparkles size={16} />} label={t('drops.rareItems')} value={stats.rareCount.toString()} />
        <StatCard icon={<Crown size={16} />} label={t('drops.palsWithDrops')} value={stats.totalPalsWithDrops.toString()} />
      </motion.div>

      {/* Search + Categories */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex flex-col gap-3 mb-5">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('drops.searchDrops')}
            className="w-full text-[13px] outline-none"
            style={{
              padding: '8px 12px 8px 32px',
              borderRadius: 10,
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {itemCategories.map((cat, i) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(i)}
              className="text-[10px] font-semibold transition-all duration-150"
              style={{
                padding: '5px 12px',
                borderRadius: 9999,
                backgroundColor: activeCategory === i ? 'rgba(234,179,8,0.12)' : 'var(--bg-surface)',
                color: activeCategory === i ? 'var(--accent-amber)' : 'var(--text-secondary)',
                border: `1px solid ${activeCategory === i ? 'var(--accent-amber)' : 'var(--border-subtle)'}`,
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Items Grid */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <Package size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, margin: '0 auto' }} />
            <p className="text-[14px] mt-3" style={{ color: 'var(--text-secondary)' }}>
              {t('drops.noItems')}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>
                {t('drops.itemCount', { count: filteredItems.length })}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filteredItems.map((item, i) => (
                <DropItemCard
                  key={item.itemName}
                  itemName={item.itemName}
                  itemId={item.itemId}
                  palNames={item.pals}
                  index={i}
                  locale={locale}
                />
              ))}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div
      className="flex items-center gap-3 p-3"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 12,
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div
        className="flex items-center justify-center shrink-0"
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: 'rgba(234,179,8,0.1)',
          color: 'var(--accent-amber)',
        }}
      >
        {icon}
      </div>
      <div>
        <div className="text-[16px] font-bold" style={{ color: 'var(--text-primary)' }}>
          {value}
        </div>
        <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </div>
      </div>
    </div>
  );
}
