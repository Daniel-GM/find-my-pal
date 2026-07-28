import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useState } from 'react';
import {
  Activity,
  BriefcaseBusiness,
  ChevronRight,
  Crosshair,
  Dna,
  Gauge,
  Heart,
  PackageOpen,
  Shield,
  Sparkles,
  Star,
  Sword,
  Utensils,
  X,
} from 'lucide-react';
import PalImage from '@/components/PalImage';
import { ElementBadge } from '@/components/breeding';
import { PalHabitatMap } from './PalHabitatMap';
import type { Pal, PalLevelStats, PalStatRange, WorkType } from '@/data/pals';
import type { PalDetail } from '@/data/pals';
import { getPalName } from '@/data/pals';
import { getPalDetail } from '@/data/palDetails';
import {
  findPartnerSkillByPalName,
  getPartnerSkillDescription,
  getPartnerSkillName,
} from '@/data/partnerSkills';
import { getWorkSkillIconUrl } from '@/lib/images';
import { useTranslation } from '@/i18n';
import type { TranslationKey } from '@/i18n/types';

interface PalDetailDialogProps {
  pal: Pal | null;
  onOpenChange: (open: boolean) => void;
}

function DetailSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-xl p-4"
      style={{
        border: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-surface)',
      }}
    >
      <h3
        className="mb-3 flex items-center gap-2 text-[13px] font-bold"
        style={{ color: 'var(--text-primary)' }}
      >
        <span style={{ color: 'var(--accent-cyan)' }}>{icon}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function formatRange(range?: PalStatRange) {
  if (!range) return '—';
  return range[0] === range[1]
    ? range[0].toLocaleString()
    : `${range[0].toLocaleString()} – ${range[1].toLocaleString()}`;
}

const STAT_ROWS: Array<{
  key: keyof PalLevelStats;
  label: TranslationKey;
  icon: React.ReactNode;
  color: string;
}> = [
  { key: 'hp', label: 'pals.hp', icon: <Heart size={14} />, color: '#F87171' },
  { key: 'attack', label: 'pals.attack', icon: <Sword size={14} />, color: '#FBBF24' },
  { key: 'defense', label: 'pals.defense', icon: <Shield size={14} />, color: '#60A5FA' },
];

function LevelStatsCard({
  title,
  stats,
}: {
  title: string;
  stats: PalLevelStats;
}) {
  const { t } = useTranslation();
  return (
    <div
      className="overflow-hidden rounded-lg"
      style={{ border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-elevated)' }}
    >
      <div
        className="px-3 py-2 text-[12px] font-bold"
        style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--accent-cyan)' }}
      >
        {title}
      </div>
      <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
        {STAT_ROWS.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-3 px-3 py-2">
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              <span style={{ color: row.color }}>{row.icon}</span>
              {t(row.label)}
            </span>
            <strong className="text-[12px]" style={{ color: 'var(--text-primary)' }}>
              {formatRange(stats[row.key])}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkBadge({ type, level }: { type: WorkType; level: number }) {
  const { t } = useTranslation();
  return (
    <div
      className="flex items-center gap-2 rounded-lg px-2.5 py-2"
      style={{
        border: `1px solid ${level >= 3 ? 'rgba(139,92,246,0.35)' : 'var(--border-subtle)'}`,
        backgroundColor: level >= 3 ? 'rgba(139,92,246,0.1)' : 'var(--bg-elevated)',
      }}
    >
      <img src={getWorkSkillIconUrl(type)} alt="" className="h-5 w-5 object-contain" />
      <span className="min-w-0 flex-1 truncate text-[11px]" style={{ color: 'var(--text-secondary)' }}>
        {t(`work.${type}` as TranslationKey)}
      </span>
      <strong
        className="text-[12px]"
        style={{ color: level >= 3 ? 'var(--accent-violet)' : 'var(--text-primary)' }}
      >
        {level}
      </strong>
    </div>
  );
}

export function PalDetailDialog({ pal, onOpenChange }: PalDetailDialogProps) {
  const { t, locale } = useTranslation();
  const [loadedDetail, setLoadedDetail] = useState<{
    palName: string;
    detail?: PalDetail;
  }>();
  const detail =
    loadedDetail && loadedDetail.palName === pal?.name ? loadedDetail.detail : undefined;
  useEffect(() => {
    let active = true;
    if (pal) {
      const palName = pal.name;
      void getPalDetail(palName).then(
        (nextDetail) => {
          if (active) setLoadedDetail({ palName, detail: nextDetail });
        },
        () => {
          if (active) setLoadedDetail({ palName });
        },
      );
    }
    return () => {
      active = false;
    };
  }, [pal]);
  const partnerSkill = pal ? findPartnerSkillByPalName(pal.name) : undefined;
  const activeWork = pal
    ? (Object.entries(pal.workSuitability) as [WorkType, number][])
      .filter(([, level]) => level > 0)
      .sort((a, b) => b[1] - a[1])
    : [];

  return (
    <Dialog.Root open={Boolean(pal)} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-[3px]" />
        <Dialog.Content
          className="fixed inset-x-2 top-1/2 z-[81] mx-auto max-h-[94vh] w-auto max-w-[1080px] -translate-y-1/2 overflow-hidden rounded-2xl outline-none sm:inset-x-5"
          style={{
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-primary)',
            boxShadow: '0 28px 90px rgba(0,0,0,0.62)',
          }}
        >
          {pal && (
            <>
              <header
                className="relative flex items-start gap-4 px-5 py-4 sm:px-6"
                style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  background:
                    'linear-gradient(120deg, rgba(139,92,246,0.14), rgba(34,211,238,0.06) 48%, transparent)',
                }}
              >
                <PalImage
                  iconName={pal.iconName}
                  name={pal.name}
                  iconUrl={pal.iconUrl}
                  size="lg"
                  style={{
                    width: 76,
                    height: 76,
                    border: '2px solid var(--accent-violet)',
                    boxShadow: '0 0 24px rgba(139,92,246,0.2)',
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Dialog.Title
                      className="text-[22px] font-bold sm:text-[26px]"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {getPalName(pal, locale)}
                    </Dialog.Title>
                    <span className="text-[12px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                      #{String(pal.number).padStart(3, '0')}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {pal.elements.map((element) => (
                      <ElementBadge key={element} element={element} />
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
                    <span className="inline-flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                      <Dna size={12} style={{ color: 'var(--accent-violet)' }} />
                      {t('pals.breedingPower')}: <strong>{pal.breedingPower}</strong>
                    </span>
                    {detail?.stats.rarity !== undefined && (
                      <span className="inline-flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                        <Star size={12} fill="#EAB308" style={{ color: '#EAB308' }} />
                        {t('pals.rarity')}: <strong>{detail.stats.rarity}</strong>
                      </span>
                    )}
                  </div>
                </div>
                <Dialog.Close
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/10"
                  aria-label={t('app.close')}
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X size={18} />
                </Dialog.Close>
              </header>

              <div className="max-h-[calc(94vh-109px)] overflow-y-auto p-4 sm:p-6">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-4">
                    <DetailSection title={t('pals.summary')} icon={<Sparkles size={16} />}>
                      <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {detail?.summaries[locale] || t('pals.noSummary')}
                      </p>
                    </DetailSection>

                    <DetailSection title={t('pals.partnerSkill')} icon={<Activity size={16} />}>
                      {partnerSkill ? (
                        <>
                          <div className="text-[14px] font-bold" style={{ color: 'var(--text-primary)' }}>
                            {getPartnerSkillName(partnerSkill, locale)}
                          </div>
                          <p className="mt-1.5 text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            {getPartnerSkillDescription(partnerSkill, locale)}
                          </p>
                          {partnerSkill.rankProgression && partnerSkill.rankProgression.length > 0 && (
                            <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-5">
                              {partnerSkill.rankProgression.map((rank) => (
                                <div
                                  key={`${rank.stars}-${rank.level}`}
                                  className="rounded-lg px-2 py-2 text-center"
                                  style={{
                                    border: '1px solid var(--border-subtle)',
                                    backgroundColor: 'var(--bg-elevated)',
                                  }}
                                  title={rank.values.join(' · ')}
                                >
                                  <div
                                    className="inline-flex items-center gap-0.5 text-[10px] font-semibold"
                                    style={{ color: '#EAB308' }}
                                  >
                                    {rank.stars}<Star size={9} fill="currentColor" />
                                  </div>
                                  <div
                                    className="mt-0.5 truncate text-[11px] font-bold"
                                    style={{ color: 'var(--text-primary)' }}
                                  >
                                    {rank.values.join(' · ') || `Lv. ${rank.level}`}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                          {t('team.noPartnerSkill')}
                        </span>
                      )}
                    </DetailSection>

                    <DetailSection title={t('pals.workSuitability')} icon={<BriefcaseBusiness size={16} />}>
                      {activeWork.length > 0 ? (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {activeWork.map(([type, level]) => (
                            <WorkBadge key={type} type={type} level={level} />
                          ))}
                        </div>
                      ) : (
                        <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </DetailSection>

                    {detail && (
                      <DetailSection title={t('pals.stats')} icon={<Gauge size={16} />}>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <LevelStatsCard title={t('pals.level1')} stats={detail.level1} />
                          <LevelStatsCard title={t('pals.level80')} stats={detail.level80} />
                        </div>
                        <p className="mt-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          {t('pals.ivRange')}
                        </p>
                      </DetailSection>
                    )}

                    {detail && (
                      <DetailSection title={t('pals.otherStats')} icon={<Crosshair size={16} />}>
                        <div className="grid grid-cols-2 gap-x-5 gap-y-2 sm:grid-cols-3">
                          {([
                            ['pals.size', detail.stats.size],
                            ['pals.food', detail.stats.food],
                            ['pals.meleeAttack', detail.stats.meleeAttack],
                            ['pals.workSpeed', detail.stats.workSpeed],
                            ['pals.support', detail.stats.support],
                            ['pals.captureRate', detail.stats.captureRate],
                            [
                              'pals.maleProbability',
                              detail.stats.maleProbability !== undefined
                                ? `${detail.stats.maleProbability}%`
                                : undefined,
                            ],
                            ['pals.egg', detail.stats.egg?.[locale] || detail.stats.egg?.en],
                          ] as Array<[TranslationKey, string | number | undefined]>)
                            .filter(([, value]) => value !== undefined && value !== '')
                            .map(([label, value]) => (
                              <div key={label} className="min-w-0">
                                <div className="truncate text-[9px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                                  {t(label)}
                                </div>
                                <div className="mt-0.5 truncate text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                                  {value}
                                </div>
                              </div>
                            ))}
                        </div>
                      </DetailSection>
                    )}
                  </div>

                  <div className="space-y-4">
                    {detail && (
                      <DetailSection title={t('pals.drops')} icon={<PackageOpen size={16} />}>
                        {detail.drops.length > 0 ? (
                          <div className="space-y-1.5">
                            {detail.drops.map((drop) => (
                              <div
                                key={`${drop.itemId}-${drop.slug}`}
                                className="flex items-center gap-3 rounded-lg px-2.5 py-2"
                                style={{
                                  border: '1px solid var(--border-subtle)',
                                  backgroundColor: 'var(--bg-elevated)',
                                }}
                              >
                                {drop.iconUrl ? (
                                  <img
                                    src={drop.iconUrl}
                                    alt=""
                                    className="h-10 w-10 rounded-md object-contain"
                                    style={{
                                      border: '1px solid var(--border-subtle)',
                                      backgroundColor: 'rgba(255,255,255,0.035)',
                                    }}
                                  />
                                ) : (
                                  <div className="flex h-10 w-10 items-center justify-center rounded-md">
                                    <Utensils size={16} style={{ color: 'var(--text-muted)' }} />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                                    {drop.names[locale] || drop.names.en}
                                  </div>
                                  <div className="mt-0.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                    {t('pals.quantity')}: {drop.quantity}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-[13px] font-bold" style={{ color: '#34D399' }}>
                                    {drop.probability}%
                                  </div>
                                  <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                                    {t('pals.probability')}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                            {t('pals.noDrops')}
                          </p>
                        )}
                      </DetailSection>
                    )}

                    {detail && (
                      <DetailSection title={t('pals.habitat')} icon={<MapPinnedIcon />}>
                        <PalHabitatMap detail={detail} />
                      </DetailSection>
                    )}

                    <a
                      href={`https://paldb.cc/${locale === 'pt-BR' ? 'pt' : 'en'}/${detail?.slug || pal.name}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-xl px-4 py-3 text-[11px] font-semibold transition-colors hover:bg-white/5"
                      style={{
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      PalDB
                      <ChevronRight size={14} />
                    </a>
                  </div>
                </div>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function MapPinnedIcon() {
  return (
    <span className="inline-flex">
      <Crosshair size={16} />
    </span>
  );
}
