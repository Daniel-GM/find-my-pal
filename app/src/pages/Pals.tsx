import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, X } from 'lucide-react';
import { PALS, ALL_WORK_TYPES } from '@/data/pals';
import type { Pal, PalElement, WorkType } from '@/data/pals';
import { getElementIconUrl, getWorkSkillIconUrl } from '@/lib/images';
import { useTranslation } from '@/i18n';
import PalImage from '@/components/PalImage';
import { getElementColor, getElementBg } from '@/lib/elements';

const EASE_BEZIER = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

function ElementBadge({ element }: { element: PalElement }) {
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[9px] font-semibold uppercase"
      style={{
        padding: '1px 6px', borderRadius: 9999,
        backgroundColor: getElementBg(element), color: getElementColor(element),
      }}
    >
      <img src={getElementIconUrl(element)} alt={element} className="w-3 h-3 object-contain" loading="lazy"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      {element}
    </span>
  );
}

function WorkBadge({ type, level }: { type: WorkType; level: number }) {
  const { t } = useTranslation();
  return (
    <div className="inline-flex items-center gap-1 text-[10px] font-semibold" title={t(`work.${type}` as const)}
      style={{
        padding: '2px 7px', borderRadius: 6,
        backgroundColor: level >= 3 ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${level >= 3 ? 'rgba(139,92,246,0.25)' : 'var(--border-subtle)'}`,
        color: level >= 3 ? 'var(--accent-violet)' : 'var(--text-secondary)',
      }}>
      <img src={getWorkSkillIconUrl(type)} alt={type} className="w-3.5 h-3.5 object-contain" loading="lazy"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      <span>{t(`work.${type}` as const)}</span>
      <span className="font-bold ml-0.5" style={{ color: level >= 3 ? 'var(--accent-violet)' : 'var(--text-primary)' }}>{level}</span>
    </div>
  );
}

function PalCard({ pal, index }: { pal: Pal; index: number }) {
  const { t } = useTranslation();
  const activeWork = useMemo(() => {
    return (Object.entries(pal.workSuitability) as [WorkType, number][])
      .filter(([, level]) => level > 0)
      .sort((a, b) => b[1] - a[1]);
  }, [pal]);

  const totalWorkLevel = useMemo(() => activeWork.reduce((s, [, l]) => s + l, 0), [activeWork]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.015, 0.5), duration: 0.2, ease: EASE_BEZIER }}
      className="flex flex-col gap-2 p-3"
      style={{
        backgroundColor: 'var(--bg-surface)', borderRadius: 12,
        border: '1px solid var(--border-subtle)', transition: 'border-color 0.15s ease',
      }}
      whileHover={{ y: -1, boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-violet)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
    >
      {/* Header: Icon + Name */}
      <div className="flex items-center gap-3">
        <PalImage
          iconName={pal.iconName}
          name={pal.name}
          size="lg"
          style={{ border: '2px solid var(--border-subtle)' }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>{pal.name}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>#{String(pal.number).padStart(3, '0')}</span>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>|</span>
            <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>BP: {pal.breedingPower}</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {pal.elements.map((el) => <ElementBadge key={el} element={el} />)}
          </div>
        </div>
        {/* Total work level badge */}
        <div className="shrink-0 flex flex-col items-center gap-0.5">
          <div className="flex items-center justify-center w-9 h-9 rounded-full" style={{ backgroundColor: 'rgba(139,92,246,0.1)' }}>
            <span className="text-[13px] font-bold" style={{ color: 'var(--accent-violet)' }}>{totalWorkLevel}</span>
          </div>
          <span className="text-[8px] uppercase" style={{ color: 'var(--text-muted)' }}>{t('pals.workSkills')}</span>
        </div>
      </div>

      {/* Work Suitability */}
      {activeWork.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          {activeWork.map(([type, level]) => (
            <WorkBadge key={type} type={type} level={level} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

const WORK_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function PalsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [elementFilter, setElementFilter] = useState<PalElement | null>(null);
  const [sortBy, setSortBy] = useState<'number' | 'name' | 'work'>('number');
  const [workFilter, setWorkFilter] = useState<WorkType | null>(null);
  const [workLevelFilter, setWorkLevelFilter] = useState<number>(0);

  const filteredPals = useMemo(() => {
    let list = [...PALS];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) || String(p.number).includes(q)
      );
    }

    // Element filter
    if (elementFilter) {
      list = list.filter((p) => p.elements.includes(elementFilter));
    }

    // Work filter (type + min level)
    if (workFilter) {
      list = list.filter((p) => p.workSuitability[workFilter] > 0);
      if (workLevelFilter > 0) {
        list = list.filter((p) => p.workSuitability[workFilter] >= workLevelFilter);
      }
    }

    // Sort
    switch (sortBy) {
      case 'number':
        list.sort((a, b) => a.number - b.number || a.name.localeCompare(b.name));
        break;
      case 'name':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'work': {
        list.sort((a, b) => {
          const workA = Object.values(a.workSuitability).reduce((s, v) => s + v, 0);
          const workB = Object.values(b.workSuitability).reduce((s, v) => s + v, 0);
          return workB - workA;
        });
        break;
      }
    }

    return list;
  }, [search, elementFilter, sortBy, workFilter, workLevelFilter]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mb-5">
        <div className="flex items-center gap-3 mb-2">
          <Users size={22} style={{ color: 'var(--accent-violet)' }} />
          <h1 className="text-[22px] font-bold" style={{ color: 'var(--text-primary)' }}>{t('pals.title')}</h1>
          <span className="text-[13px] font-medium ml-2" style={{ color: 'var(--text-muted)' }}>{filteredPals.length} / {PALS.length}</span>
        </div>
        <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
          {t('pals.description')}
        </p>
      </motion.div>

      {/* Filters Bar */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col gap-3 mb-5">
        {/* Search + Sort row */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={t('pals.searchPals')}
              className="w-full text-[13px] outline-none"
              style={{
                padding: '8px 12px 8px 32px', borderRadius: 10,
                backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
              }} />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}><X size={14} /></button>
            )}
          </div>
          {/* Sort buttons */}
          {([['number', t('pals.sortNumber')], ['name', t('pals.sortName')], ['work', t('pals.sortWork')]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setSortBy(key)}
              className="text-[11px] font-semibold transition-all duration-150"
              style={{
                padding: '7px 12px', borderRadius: 8,
                backgroundColor: sortBy === key ? 'rgba(139,92,246,0.12)' : 'var(--bg-surface)',
                color: sortBy === key ? 'var(--accent-violet)' : 'var(--text-secondary)',
                border: `1px solid ${sortBy === key ? 'var(--accent-violet)' : 'var(--border-subtle)'}`,
              }}>{label}</button>
          ))}
        </div>

        {/* Element filter chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={() => setElementFilter(null)}
            className="text-[10px] font-semibold uppercase transition-all duration-150"
            style={{
              padding: '3px 10px', borderRadius: 9999,
              backgroundColor: elementFilter === null ? 'var(--accent-violet)' : 'var(--bg-surface)',
              color: elementFilter === null ? '#FFFFFF' : 'var(--text-secondary)',
              border: `1px solid ${elementFilter === null ? 'var(--accent-violet)' : 'var(--border-subtle)'}`,
            }}>{t('app.all')}</button>
          <button onClick={() => setElementFilter(elementFilter === 'neutral' ? null : 'neutral')} className="text-[10px] font-semibold uppercase transition-all duration-150" style={{padding: '3px 8px', borderRadius: 9999, backgroundColor: elementFilter === 'neutral' ? getElementBg('neutral') : '#1a1a24', color: elementFilter === 'neutral' ? getElementColor('neutral') : '#9ca3af', border: `1px solid ${elementFilter === 'neutral' ? getElementColor('neutral') : '#2a2a35'}`}}>{t('element.neutral')}</button>
          <button onClick={() => setElementFilter(elementFilter === 'fire' ? null : 'fire')} className="text-[10px] font-semibold uppercase transition-all duration-150" style={{padding: '3px 8px', borderRadius: 9999, backgroundColor: elementFilter === 'fire' ? getElementBg('fire') : '#1a1a24', color: elementFilter === 'fire' ? getElementColor('fire') : '#9ca3af', border: `1px solid ${elementFilter === 'fire' ? getElementColor('fire') : '#2a2a35'}`}}>{t('element.fire')}</button>
          <button onClick={() => setElementFilter(elementFilter === 'water' ? null : 'water')} className="text-[10px] font-semibold uppercase transition-all duration-150" style={{padding: '3px 8px', borderRadius: 9999, backgroundColor: elementFilter === 'water' ? getElementBg('water') : '#1a1a24', color: elementFilter === 'water' ? getElementColor('water') : '#9ca3af', border: `1px solid ${elementFilter === 'water' ? getElementColor('water') : '#2a2a35'}`}}>{t('element.water')}</button>
          <button onClick={() => setElementFilter(elementFilter === 'grass' ? null : 'grass')} className="text-[10px] font-semibold uppercase transition-all duration-150" style={{padding: '3px 8px', borderRadius: 9999, backgroundColor: elementFilter === 'grass' ? getElementBg('grass') : '#1a1a24', color: elementFilter === 'grass' ? getElementColor('grass') : '#9ca3af', border: `1px solid ${elementFilter === 'grass' ? getElementColor('grass') : '#2a2a35'}`}}>{t('element.grass')}</button>
          <button onClick={() => setElementFilter(elementFilter === 'electric' ? null : 'electric')} className="text-[10px] font-semibold uppercase transition-all duration-150" style={{padding: '3px 8px', borderRadius: 9999, backgroundColor: elementFilter === 'electric' ? getElementBg('electric') : '#1a1a24', color: elementFilter === 'electric' ? getElementColor('electric') : '#9ca3af', border: `1px solid ${elementFilter === 'electric' ? getElementColor('electric') : '#2a2a35'}`}}>{t('element.electric')}</button>
          <button onClick={() => setElementFilter(elementFilter === 'ice' ? null : 'ice')} className="text-[10px] font-semibold uppercase transition-all duration-150" style={{padding: '3px 8px', borderRadius: 9999, backgroundColor: elementFilter === 'ice' ? getElementBg('ice') : '#1a1a24', color: elementFilter === 'ice' ? getElementColor('ice') : '#9ca3af', border: `1px solid ${elementFilter === 'ice' ? getElementColor('ice') : '#2a2a35'}`}}>{t('element.ice')}</button>
          <button onClick={() => setElementFilter(elementFilter === 'ground' ? null : 'ground')} className="text-[10px] font-semibold uppercase transition-all duration-150" style={{padding: '3px 8px', borderRadius: 9999, backgroundColor: elementFilter === 'ground' ? getElementBg('ground') : '#1a1a24', color: elementFilter === 'ground' ? getElementColor('ground') : '#9ca3af', border: `1px solid ${elementFilter === 'ground' ? getElementColor('ground') : '#2a2a35'}`}}>{t('element.ground')}</button>
          <button onClick={() => setElementFilter(elementFilter === 'dark' ? null : 'dark')} className="text-[10px] font-semibold uppercase transition-all duration-150" style={{padding: '3px 8px', borderRadius: 9999, backgroundColor: elementFilter === 'dark' ? getElementBg('dark') : '#1a1a24', color: elementFilter === 'dark' ? getElementColor('dark') : '#9ca3af', border: `1px solid ${elementFilter === 'dark' ? getElementColor('dark') : '#2a2a35'}`}}>{t('element.dark')}</button>
          <button onClick={() => setElementFilter(elementFilter === 'dragon' ? null : 'dragon')} className="text-[10px] font-semibold uppercase transition-all duration-150" style={{padding: '3px 8px', borderRadius: 9999, backgroundColor: elementFilter === 'dragon' ? getElementBg('dragon') : '#1a1a24', color: elementFilter === 'dragon' ? getElementColor('dragon') : '#9ca3af', border: `1px solid ${elementFilter === 'dragon' ? getElementColor('dragon') : '#2a2a35'}`}}>{t('element.dragon')}</button>

        </div>

        {/* Work Suitability Filter */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button onClick={() => { setWorkFilter(null); setWorkLevelFilter(0); }}
              className="text-[10px] font-semibold uppercase transition-all duration-150"
              style={{
                padding: '3px 10px', borderRadius: 9999,
                backgroundColor: workFilter === null ? 'var(--accent-emerald)' : 'var(--bg-surface)',
                color: workFilter === null ? '#FFFFFF' : 'var(--text-secondary)',
                border: `1px solid ${workFilter === null ? 'var(--accent-emerald)' : 'var(--border-subtle)'}`,
              }}>{t('pals.anyWork')}</button>
            {ALL_WORK_TYPES.map((wt) => (
              <button key={wt} onClick={() => setWorkFilter(wt === workFilter ? null : wt)}
                className="text-[10px] font-semibold uppercase transition-all duration-150"
                style={{
                  padding: '3px 8px', borderRadius: 9999,
                  backgroundColor: workFilter === wt ? 'rgba(34,197,94,0.12)' : 'var(--bg-surface)',
                  color: workFilter === wt ? '#22c55e' : 'var(--text-secondary)',
                  border: `1px solid ${workFilter === wt ? '#22c55e' : 'var(--border-subtle)'}`,
                }}>
                {t(`work.${wt}` as const)}
              </button>
            ))}
          </div>
          {/* Work Level Filter (only show when workFilter is active) */}
          {workFilter && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>{t('pals.minLevel')}</span>
              <button onClick={() => setWorkLevelFilter(0)}
                className="text-[10px] font-semibold transition-all duration-150"
                style={{
                  padding: '2px 8px', borderRadius: 6,
                  backgroundColor: workLevelFilter === 0 ? 'rgba(34,197,94,0.12)' : 'var(--bg-surface)',
                  color: workLevelFilter === 0 ? '#22c55e' : 'var(--text-secondary)',
                  border: `1px solid ${workLevelFilter === 0 ? '#22c55e' : 'var(--border-subtle)'}`,
                }}>{t('app.all')}</button>
              {WORK_LEVELS.map((lvl) => (
                <button key={lvl} onClick={() => setWorkLevelFilter(lvl === workLevelFilter ? 0 : lvl)}
                  className="text-[10px] font-semibold transition-all duration-150"
                  style={{
                    padding: '2px 8px', borderRadius: 6,
                    backgroundColor: workLevelFilter === lvl ? 'rgba(34,197,94,0.12)' : 'var(--bg-surface)',
                    color: workLevelFilter === lvl ? '#22c55e' : 'var(--text-secondary)',
                    border: `1px solid ${workLevelFilter === lvl ? '#22c55e' : 'var(--border-subtle)'}`,
                  }}>{'\u2265'}{lvl}</button>
              ))}
            </div>
          )}
        </div>

      </motion.div>

      {/* Pals Grid */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        {filteredPals.length === 0 ? (
          <div className="text-center py-16">
            <Users size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, margin: '0 auto' }} />
            <p className="text-[14px] mt-3" style={{ color: 'var(--text-secondary)' }}>{t('pals.noPals')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
            {filteredPals.map((pal, i) => (
              <PalCard key={pal.id} pal={pal} index={i} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
