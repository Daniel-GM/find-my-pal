import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Sparkles, Users, X } from 'lucide-react';
import { ALL_WORK_TYPES, ELEMENTS, PALS, getPalName } from '@/data/pals';
import type { Pal, PalElement, WorkType } from '@/data/pals';
import {
  findPartnerSkillByPalName,
  getPartnerSkillDescription,
  getPartnerSkillName,
} from '@/data/partnerSkills';
import { getElementIconUrl, getWorkSkillIconUrl } from '@/lib/images';
import { useTranslation } from '@/i18n';
import type { TranslationKey } from '@/i18n/types';
import PalImage from '@/components/PalImage';
import { ElementBadge } from '@/components/breeding';
import { PalDetailDialog } from '@/components/pals/PalDetailDialog';
import { getElementBg, getElementColor } from '@/lib/elements';

const EASE_BEZIER = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

function WorkBadge({ type, level }: { type: WorkType; level: number }) {
  const { t } = useTranslation();
  return (
    <div
      className="inline-flex items-center gap-1 text-[10px] font-semibold"
      title={t(`work.${type}` as TranslationKey)}
      style={{
        padding: '2px 7px',
        borderRadius: 6,
        backgroundColor: level >= 3 ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${level >= 3 ? 'rgba(139,92,246,0.25)' : 'var(--border-subtle)'}`,
        color: level >= 3 ? 'var(--accent-violet)' : 'var(--text-secondary)',
      }}
    >
      <img
        src={getWorkSkillIconUrl(type)}
        alt=""
        className="h-3.5 w-3.5 shrink-0 object-contain"
        loading="lazy"
      />
      <span>{t(`work.${type}` as TranslationKey)}</span>
      <span
        className="ml-0.5 font-bold"
        style={{ color: level >= 3 ? 'var(--accent-violet)' : 'var(--text-primary)' }}
      >
        {level}
      </span>
    </div>
  );
}

function PalCard({
  pal,
  index,
  onSelect,
}: {
  pal: Pal;
  index: number;
  onSelect: (pal: Pal) => void;
}) {
  const { t, locale } = useTranslation();
  const partnerSkill = findPartnerSkillByPalName(pal.name);
  const activeWork = useMemo(
    () => (Object.entries(pal.workSuitability) as [WorkType, number][])
      .filter(([, level]) => level > 0)
      .sort((a, b) => b[1] - a[1]),
    [pal],
  );
  const totalWorkLevel = useMemo(
    () => activeWork.reduce((sum, [, level]) => sum + level, 0),
    [activeWork],
  );
  const palName = getPalName(pal, locale);

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.015, 0.5), duration: 0.2, ease: EASE_BEZIER }}
      className="flex min-h-[168px] w-full flex-col gap-2 p-3 text-left outline-none focus-visible:ring-2"
      aria-label={t('pals.openDetails', { pal: palName })}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 12,
        border: '1px solid var(--border-subtle)',
        transition: 'border-color 0.15s ease',
        '--tw-ring-color': 'var(--accent-violet)',
      } as React.CSSProperties}
      whileHover={{ y: -1, boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}
      onClick={() => onSelect(pal)}
      onMouseEnter={(event) => {
        event.currentTarget.style.borderColor = 'var(--accent-violet)';
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.borderColor = 'var(--border-subtle)';
      }}
    >
      <div className="flex items-center gap-3">
        <PalImage
          iconName={pal.iconName}
          name={pal.name}
          iconUrl={pal.iconUrl}
          size="lg"
          style={{ border: '2px solid var(--border-subtle)' }}
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-bold" style={{ color: 'var(--text-primary)' }}>
            {palName}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
              #{String(pal.number).padStart(3, '0')}
            </span>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>|</span>
            <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              BP: {pal.breedingPower}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {pal.elements.map((element) => (
              <ElementBadge key={element} element={element} />
            ))}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-0.5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(139,92,246,0.1)' }}
          >
            <span className="text-[13px] font-bold" style={{ color: 'var(--accent-violet)' }}>
              {totalWorkLevel}
            </span>
          </div>
          <span className="text-[8px] uppercase" style={{ color: 'var(--text-muted)' }}>
            {t('pals.workSkills')}
          </span>
        </div>
      </div>

      {activeWork.length > 0 && (
        <div
          className="flex flex-wrap gap-1.5 pt-1.5"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          {activeWork.map(([type, level]) => (
            <WorkBadge key={type} type={type} level={level} />
          ))}
        </div>
      )}

      {partnerSkill && (
        <div
          className="mt-auto flex min-w-0 items-start gap-2 rounded-lg px-2.5 py-2"
          style={{
            border: '1px solid rgba(34,211,238,0.18)',
            background: 'linear-gradient(110deg, rgba(34,211,238,0.07), rgba(139,92,246,0.06))',
          }}
        >
          <Sparkles size={13} className="mt-0.5 shrink-0" style={{ color: 'var(--accent-cyan)' }} />
          <div className="min-w-0">
            <div
              className="truncate text-[10px] font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              {getPartnerSkillName(partnerSkill, locale)}
            </div>
            <p
              className="mt-0.5 line-clamp-1 text-[9px] leading-relaxed"
              style={{ color: 'var(--text-muted)' }}
            >
              {getPartnerSkillDescription(partnerSkill, locale)}
            </p>
          </div>
        </div>
      )}
    </motion.button>
  );
}

const WORK_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function PalsPage() {
  const { t, locale } = useTranslation();
  const [search, setSearch] = useState('');
  const [elementFilter, setElementFilter] = useState<PalElement | null>(null);
  const [sortBy, setSortBy] = useState<'number' | 'name' | 'work'>('number');
  const [workFilter, setWorkFilter] = useState<WorkType | null>(null);
  const [workLevelFilter, setWorkLevelFilter] = useState(0);
  const [selectedPal, setSelectedPal] = useState<Pal | null>(null);

  const filteredPals = useMemo(() => {
    let list = [...PALS];
    if (search.trim()) {
      const query = search.toLocaleLowerCase(locale);
      list = list.filter((pal) => (
        pal.name.toLocaleLowerCase(locale).includes(query)
        || getPalName(pal, locale).toLocaleLowerCase(locale).includes(query)
        || String(pal.number).includes(query)
      ));
    }
    if (elementFilter) {
      list = list.filter((pal) => pal.elements.includes(elementFilter));
    }
    if (workFilter) {
      list = list.filter((pal) => pal.workSuitability[workFilter] > 0);
      if (workLevelFilter > 0) {
        list = list.filter((pal) => pal.workSuitability[workFilter] >= workLevelFilter);
      }
    }
    switch (sortBy) {
      case 'number':
        list.sort((a, b) => a.number - b.number || a.name.localeCompare(b.name));
        break;
      case 'name':
        list.sort((a, b) => getPalName(a, locale).localeCompare(getPalName(b, locale)));
        break;
      case 'work':
        list.sort((a, b) => (
          Object.values(b.workSuitability).reduce((sum, value) => sum + value, 0)
          - Object.values(a.workSuitability).reduce((sum, value) => sum + value, 0)
        ));
        break;
    }
    return list;
  }, [elementFilter, locale, search, sortBy, workFilter, workLevelFilter]);

  return (
    <div className="pals-page mx-auto max-w-6xl p-6">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="pals-page-header mb-5"
      >
        <div className="mb-2 flex items-center gap-3">
          <Users size={22} style={{ color: 'var(--accent-violet)' }} />
          <h1 className="text-[22px] font-bold" style={{ color: 'var(--text-primary)' }}>
            {t('pals.title')}
          </h1>
          <span className="ml-2 text-[13px] font-medium" style={{ color: 'var(--text-muted)' }}>
            {filteredPals.length} / {PALS.length}
          </span>
        </div>
        <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
          {t('pals.description')}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="pals-filter-panel mb-5 flex flex-col gap-3"
      >
        <div className="pals-filter-top flex flex-wrap items-center gap-2">
          <div className="pals-search relative min-w-[200px] flex-1">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('pals.searchPals')}
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
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={14} />
              </button>
            )}
          </div>
          {([
            ['number', t('pals.sortNumber')],
            ['name', t('pals.sortName')],
            ['work', t('pals.sortWork')],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSortBy(key)}
              className="text-[11px] font-semibold transition-all duration-150"
              style={{
                padding: '7px 12px',
                borderRadius: 8,
                backgroundColor: sortBy === key ? 'rgba(139,92,246,0.12)' : 'var(--bg-surface)',
                color: sortBy === key ? 'var(--accent-violet)' : 'var(--text-secondary)',
                border: `1px solid ${sortBy === key ? 'var(--accent-violet)' : 'var(--border-subtle)'}`,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="pals-filter-row pals-element-filters flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setElementFilter(null)}
            className="text-[10px] font-semibold uppercase transition-all duration-150"
            style={{
              padding: '4px 10px',
              borderRadius: 9999,
              backgroundColor: elementFilter === null ? 'var(--accent-violet)' : 'var(--bg-surface)',
              color: elementFilter === null ? '#FFFFFF' : 'var(--text-secondary)',
              border: `1px solid ${elementFilter === null ? 'var(--accent-violet)' : 'var(--border-subtle)'}`,
            }}
          >
            {t('app.all')}
          </button>
          {ELEMENTS.map((element) => {
            const selected = elementFilter === element;
            return (
              <button
                key={element}
                type="button"
                onClick={() => setElementFilter(selected ? null : element)}
                className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase transition-all duration-150"
                style={{
                  padding: '3px 8px',
                  borderRadius: 9999,
                  backgroundColor: selected ? getElementBg(element) : 'var(--bg-surface)',
                  color: selected ? getElementColor(element) : 'var(--text-secondary)',
                  border: `1px solid ${selected ? getElementColor(element) : 'var(--border-subtle)'}`,
                }}
              >
                <img
                  src={getElementIconUrl(element)}
                  alt=""
                  className="h-3.5 w-3.5 object-contain"
                  loading="lazy"
                />
                {t(`element.${element}` as TranslationKey)}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2">
          <div className="pals-filter-row pals-work-filters flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setWorkFilter(null);
                setWorkLevelFilter(0);
              }}
              className="text-[10px] font-semibold uppercase transition-all duration-150"
              style={{
                padding: '3px 10px',
                borderRadius: 9999,
                backgroundColor: workFilter === null ? 'var(--accent-emerald)' : 'var(--bg-surface)',
                color: workFilter === null ? '#FFFFFF' : 'var(--text-secondary)',
                border: `1px solid ${workFilter === null ? 'var(--accent-emerald)' : 'var(--border-subtle)'}`,
              }}
            >
              {t('pals.anyWork')}
            </button>
            {ALL_WORK_TYPES.map((workType) => (
              <button
                key={workType}
                type="button"
                onClick={() => setWorkFilter(workType === workFilter ? null : workType)}
                className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase transition-all duration-150"
                style={{
                  padding: '3px 8px',
                  borderRadius: 9999,
                  backgroundColor: workFilter === workType ? 'rgba(34,197,94,0.12)' : 'var(--bg-surface)',
                  color: workFilter === workType ? '#22c55e' : 'var(--text-secondary)',
                  border: `1px solid ${workFilter === workType ? '#22c55e' : 'var(--border-subtle)'}`,
                }}
              >
                <img
                  src={getWorkSkillIconUrl(workType)}
                  alt=""
                  className="h-3.5 w-3.5 shrink-0 object-contain"
                  loading="lazy"
                />
                {t(`work.${workType}` as TranslationKey)}
              </button>
            ))}
          </div>
          {workFilter && (
            <div className="pals-filter-row pals-work-levels flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                {t('pals.minLevel')}
              </span>
              <button
                type="button"
                onClick={() => setWorkLevelFilter(0)}
                className="text-[10px] font-semibold transition-all duration-150"
                style={{
                  padding: '2px 8px',
                  borderRadius: 6,
                  backgroundColor: workLevelFilter === 0 ? 'rgba(34,197,94,0.12)' : 'var(--bg-surface)',
                  color: workLevelFilter === 0 ? '#22c55e' : 'var(--text-secondary)',
                  border: `1px solid ${workLevelFilter === 0 ? '#22c55e' : 'var(--border-subtle)'}`,
                }}
              >
                {t('app.all')}
              </button>
              {WORK_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setWorkLevelFilter(level === workLevelFilter ? 0 : level)}
                  className="text-[10px] font-semibold transition-all duration-150"
                  style={{
                    padding: '2px 8px',
                    borderRadius: 6,
                    backgroundColor: workLevelFilter === level ? 'rgba(34,197,94,0.12)' : 'var(--bg-surface)',
                    color: workLevelFilter === level ? '#22c55e' : 'var(--text-secondary)',
                    border: `1px solid ${workLevelFilter === level ? '#22c55e' : 'var(--border-subtle)'}`,
                  }}
                >
                  ≥{level}
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        {filteredPals.length === 0 ? (
          <div className="py-16 text-center">
            <Users
              size={48}
              style={{ color: 'var(--text-muted)', opacity: 0.3, margin: '0 auto' }}
            />
            <p className="mt-3 text-[14px]" style={{ color: 'var(--text-secondary)' }}>
              {t('pals.noPals')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
            {filteredPals.map((pal, index) => (
              <PalCard key={pal.id} pal={pal} index={index} onSelect={setSelectedPal} />
            ))}
          </div>
        )}
      </motion.div>

      <PalDetailDialog
        pal={selectedPal}
        onOpenChange={(open) => {
          if (!open) setSelectedPal(null);
        }}
      />
    </div>
  );
}
