import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Mountain, Plane, Droplets, TrendingUp, Zap, Gauge, Battery } from 'lucide-react';
import { getMountsByType, LEVEL_RANGES } from '@/data/mounts';
import type { MountType, MountInfo } from '@/data/mounts';
import { getElementIconUrl } from '@/lib/images';
import { useTranslation } from '@/i18n';
import PalImage from '@/components/PalImage';
import { getElementColor, getElementBg } from '@/lib/elements';
import type { PalElement } from '@/data/pals';

const EASE_BEZIER = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

function ElementBadge({ element }: { element: string }) {
  const el = element as PalElement;
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[9px] font-semibold uppercase"
      style={{
        padding: '1px 6px',
        borderRadius: 9999,
        backgroundColor: getElementBg(el),
        color: getElementColor(el),
      }}
    >
      <img
        src={getElementIconUrl(el)}
        alt={element}
        className="w-3 h-3 object-contain"
        loading="lazy"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
      {element}
    </span>
  );
}

function MountCard({ mount, index }: { mount: MountInfo; index: number }) {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25, ease: EASE_BEZIER }}
      className="flex items-center gap-3 p-3"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 12,
        border: '1px solid var(--border-subtle)',
        transition: 'border-color 0.15s ease',
      }}
      whileHover={{ y: -1, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent-violet)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
      }}
    >
      {/* Pal Icon */}
      <div className="shrink-0 flex flex-col items-center gap-1">
        <PalImage
          iconName={mount.iconName}
          name={mount.name}
          size="md"
          style={{ border: '2px solid var(--accent-violet)' }}
        />
        <span className="text-[9px] font-bold" style={{ color: 'var(--accent-violet)' }}>
          {t('mounts.levelRequired', { level: mount.saddleLevel })}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[13px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>
            {mount.name}
          </span>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            #{String(mount.number).padStart(3, '0')}
          </span>
        </div>
        <div className="flex flex-wrap gap-1 mb-1">
          {mount.elements.map((el) => (
            <ElementBadge key={el} element={el} />
          ))}
        </div>
        <p className="text-[10px] truncate" style={{ color: 'var(--text-secondary)' }}>
          {mount.skill}
        </p>
      </div>

      {/* Stats */}
      <div className="shrink-0 flex flex-col gap-1 items-end">
        <div className="flex items-center gap-1" title={t('mounts.sprint')}>
          <Zap size={11} style={{ color: 'var(--accent-amber)' }} />
          <span className="text-[12px] font-bold" style={{ color: 'var(--text-primary)' }}>
            {mount.sprintSpeed}
          </span>
        </div>
        <div className="flex items-center gap-1" title={t('mounts.runSpeed')}>
          <Gauge size={11} style={{ color: 'var(--text-muted)' }} />
          <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
            {mount.runSpeed}
          </span>
        </div>
        <div className="flex items-center gap-1" title={t('mounts.stamina')}>
          <Battery size={11} style={{ color: '#22c55e' }} />
          <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
            {mount.stamina}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function LevelSection({
  label,
  color,
  mounts,
  startIndex,
}: {
  label: string;
  color: string;
  mounts: MountInfo[];
  startIndex: number;
}) {
  const { t } = useTranslation();
  if (mounts.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-3 mt-4">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <h3 className="text-[14px] font-bold uppercase tracking-wide" style={{ color }}>
          {label}
        </h3>
        <div className="flex-1 h-px" style={{ backgroundColor: `${color}30` }} />
        <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
          {t('mounts.mountCount', { count: mounts.length })}
        </span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {mounts.map((m, i) => (
          <MountCard key={m.palId} mount={m} index={startIndex + i} />
        ))}
      </div>
    </div>
  );
}

function MountProgression({ type }: { type: MountType }) {
  const mounts = useMemo(() => getMountsByType(type), [type]);

  const levelGroups = useMemo(() => {
    return LEVEL_RANGES.map((range) => ({
      ...range,
      mounts: mounts.filter((m) => m.saddleLevel >= range.min && m.saddleLevel <= range.max),
    })).filter((g) => g.mounts.length > 0);
  }, [mounts]);

  const groupStarts = useMemo(() => {
    return levelGroups.map((_, index) =>
      levelGroups.slice(0, index).reduce((sum, group) => sum + group.mounts.length, 0),
    );
  }, [levelGroups]);

  return (
    <div>
      {levelGroups.map((group, index) => (
        <LevelSection
          key={group.label}
          label={`${group.label} (Lv.${group.min}-${group.max})`}
          color={group.color}
          mounts={group.mounts}
          startIndex={groupStarts[index]}
        />
      ))}
    </div>
  );
}

export default function Mounts() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'ground' | 'flying' | 'water'>('flying');

  const groundCount = useMemo(() => getMountsByType('ground').length, []);
  const flyingCount = useMemo(() => getMountsByType('flying').length, []);
  const waterCount = useMemo(() => getMountsByType('water').length, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp size={22} style={{ color: 'var(--accent-violet)' }} />
          <h1 className="text-[22px] font-bold" style={{ color: 'var(--text-primary)' }}>
            {t('mounts.title')}
          </h1>
        </div>
        <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
          {t('mounts.description')}
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.1 }}
        className="flex gap-2 mb-6"
      >
        <button
          onClick={() => setActiveTab('flying')}
          className="flex items-center gap-2 text-[14px] font-semibold transition-all duration-150"
          style={{
            padding: '10px 18px',
            borderRadius: 10,
            backgroundColor: activeTab === 'flying' ? 'rgba(139,92,246,0.12)' : 'var(--bg-surface)',
            color: activeTab === 'flying' ? 'var(--accent-violet)' : 'var(--text-secondary)',
            border: `1px solid ${activeTab === 'flying' ? 'var(--accent-violet)' : 'var(--border-subtle)'}`,
          }}
        >
          <Plane size={16} />
          {t('mounts.flying')} ({flyingCount})
        </button>
        <button
          onClick={() => setActiveTab('water')}
          className="flex items-center gap-2 text-[14px] font-semibold transition-all duration-150"
          style={{
            padding: '10px 18px',
            borderRadius: 10,
            backgroundColor: activeTab === 'water' ? 'rgba(139,92,246,0.12)' : 'var(--bg-surface)',
            color: activeTab === 'water' ? 'var(--accent-violet)' : 'var(--text-secondary)',
            border: `1px solid ${activeTab === 'water' ? 'var(--accent-violet)' : 'var(--border-subtle)'}`,
          }}
        >
          <Droplets size={16} />
          {t('mounts.water')} ({waterCount})
        </button>
        <button
          onClick={() => setActiveTab('ground')}
          className="flex items-center gap-2 text-[14px] font-semibold transition-all duration-150"
          style={{
            padding: '10px 18px',
            borderRadius: 10,
            backgroundColor: activeTab === 'ground' ? 'rgba(139,92,246,0.12)' : 'var(--bg-surface)',
            color: activeTab === 'ground' ? 'var(--accent-violet)' : 'var(--text-secondary)',
            border: `1px solid ${activeTab === 'ground' ? 'var(--accent-violet)' : 'var(--border-subtle)'}`,
          }}
        >
          <Mountain size={16} />
          {t('mounts.terrestrial')} ({groundCount})
        </button>
      </motion.div>

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
      >
        {(() => {
          const mounts = getMountsByType(activeTab);
          const fastest = [...mounts].sort((a, b) => b.sprintSpeed - a.sprintSpeed)[0];
          const avgStamina = mounts.length > 0 ? Math.round(mounts.reduce((s, m) => s + m.stamina, 0) / mounts.length) : 0;
          return (
            <>
              <StatCard icon={<Plane size={16} />} label={t('mounts.totalMounts')} value={mounts.length.toString()} />
              <StatCard icon={<Zap size={16} />} label={t('mounts.fastestSprint')} value={fastest ? `${fastest.sprintSpeed}` : '-'} sub={fastest?.name} />
              <StatCard icon={<Gauge size={16} />} label={t('mounts.avgRunSpeed')} value={mounts.length > 0 ? Math.round(mounts.reduce((s, m) => s + m.runSpeed, 0) / mounts.length).toString() : '0'} />
              <StatCard icon={<Battery size={16} />} label={t('mounts.avgStamina')} value={avgStamina.toString()} />
            </>
          );
        })()}
      </motion.div>

      {/* Progression List */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <MountProgression type={activeTab} />
      </motion.div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
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
          backgroundColor: 'rgba(139,92,246,0.1)',
          color: 'var(--accent-violet)',
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
        {sub && (
          <div className="text-[10px] truncate" style={{ color: 'var(--accent-violet)' }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}
