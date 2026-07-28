import { useMemo, useState } from 'react';
import { ExternalLink, MapPinned, Moon, Sun } from 'lucide-react';
import type { PalDetail } from '@/data/pals';
import { useTranslation } from '@/i18n';

type MapId = 'palpagos' | 'worldTree';
type TimeId = 'day' | 'night';

const MAPS: Record<MapId, { slug: string; tiles: string[] }> = {
  palpagos: {
    slug: 'Palpagos_Islands',
    tiles: [
      '/assets/maps/palpagos-z1-x0-y0.webp',
      '/assets/maps/palpagos-z1-x1-y0.webp',
      '/assets/maps/palpagos-z1-x0-y1.webp',
      '/assets/maps/palpagos-z1-x1-y1.webp',
    ],
  },
  worldTree: {
    slug: 'The_World_Tree',
    tiles: [
      '/assets/maps/worldTree-z1-x0-y0.webp',
      '/assets/maps/worldTree-z1-x1-y0.webp',
      '/assets/maps/worldTree-z1-x0-y1.webp',
      '/assets/maps/worldTree-z1-x1-y1.webp',
    ],
  },
};

interface PalHabitatMapProps {
  detail: PalDetail;
}

export function PalHabitatMap({ detail }: PalHabitatMapProps) {
  const { t, locale } = useTranslation();
  const availableMaps = useMemo(
    () => (Object.keys(MAPS) as MapId[]).filter((mapId) => {
      const habitat = detail.habitats[mapId];
      return habitat.day.count > 0 || habitat.night.count > 0;
    }),
    [detail],
  );
  const [mapId, setMapId] = useState<MapId>(availableMaps[0] ?? 'palpagos');
  const [time, setTime] = useState<TimeId>(
    detail.habitats[availableMaps[0] ?? 'palpagos']?.day.count > 0 ? 'day' : 'night',
  );

  if (availableMaps.length === 0) {
    return (
      <div
        className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center"
        style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
      >
        <MapPinned size={28} opacity={0.55} />
        <span className="text-[12px]">{t('pals.habitatEmpty')}</span>
      </div>
    );
  }

  const resolvedMapId = availableMaps.includes(mapId) ? mapId : availableMaps[0];
  const habitat = detail.habitats[resolvedMapId];
  const availableTimes = (['day', 'night'] as TimeId[]).filter(
    (period) => habitat[period].count > 0,
  );
  const resolvedTime = availableTimes.includes(time) ? time : availableTimes[0];
  const period = habitat[resolvedTime];
  const maxWeight = Math.max(1, ...period.points.map((point) => point[2]));
  const localePath = locale === 'pt-BR' ? 'pt' : 'en';
  const mapUrl = `https://paldb.cc/${localePath}/${MAPS[resolvedMapId].slug}?pal=${encodeURIComponent(detail.sourceId)}&t=${resolvedTime}TimeLocations`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {availableMaps.map((candidate) => (
            <button
              key={candidate}
              type="button"
              onClick={() => {
                setMapId(candidate);
                const nextHabitat = detail.habitats[candidate];
                if (nextHabitat[time].count === 0) {
                  setTime(nextHabitat.day.count > 0 ? 'day' : 'night');
                }
              }}
              className="rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors"
              style={{
                border: `1px solid ${resolvedMapId === candidate ? 'var(--accent-violet)' : 'var(--border-subtle)'}`,
                backgroundColor: resolvedMapId === candidate
                  ? 'rgba(139,92,246,0.14)'
                  : 'var(--bg-surface)',
                color: resolvedMapId === candidate
                  ? 'var(--accent-violet)'
                  : 'var(--text-secondary)',
              }}
            >
              {t(candidate === 'palpagos' ? 'pals.palpagos' : 'pals.worldTree')}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {availableTimes.map((candidate) => {
            const Icon = candidate === 'day' ? Sun : Moon;
            return (
              <button
                key={candidate}
                type="button"
                onClick={() => setTime(candidate)}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors"
                style={{
                  border: `1px solid ${resolvedTime === candidate ? (candidate === 'day' ? '#F59E0B' : '#8B5CF6') : 'var(--border-subtle)'}`,
                  backgroundColor: resolvedTime === candidate
                    ? (candidate === 'day' ? 'rgba(245,158,11,0.14)' : 'rgba(139,92,246,0.14)')
                    : 'var(--bg-surface)',
                  color: resolvedTime === candidate
                    ? (candidate === 'day' ? '#FBBF24' : '#A78BFA')
                    : 'var(--text-secondary)',
                }}
              >
                <Icon size={12} />
                {t(candidate === 'day' ? 'pals.day' : 'pals.night')}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="relative mx-auto aspect-square w-full max-w-[560px] overflow-hidden rounded-xl"
        style={{
          border: '1px solid var(--border-subtle)',
          backgroundColor: '#0b1015',
          boxShadow: 'inset 0 0 28px rgba(0,0,0,0.45)',
        }}
      >
        <div className="absolute inset-0 grid grid-cols-2 opacity-80">
          {MAPS[resolvedMapId].tiles.map((tile) => (
            <img
              key={tile}
              src={tile}
              alt=""
              className="block h-full w-full object-cover"
              draggable={false}
            />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(1,5,9,0.45)_100%)]" />
        <svg
          viewBox="0 0 100 100"
          className="pointer-events-none absolute inset-0 h-full w-full"
          role="img"
          aria-label={t('pals.spawnPoints', { count: period.count })}
        >
          <defs>
            <filter id={`heat-blur-${resolvedMapId}-${resolvedTime}`} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="1.5" />
            </filter>
            <radialGradient id={`heat-gradient-${resolvedMapId}-${resolvedTime}`}>
              <stop offset="0%" stopColor="#FFF7AE" stopOpacity="0.98" />
              <stop offset="28%" stopColor="#FBBF24" stopOpacity="0.92" />
              <stop offset="62%" stopColor="#F97316" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
            </radialGradient>
          </defs>
          <g filter={`url(#heat-blur-${resolvedMapId}-${resolvedTime})`}>
            {period.points.map((point, index) => {
              const intensity = Math.sqrt(point[2] / maxWeight);
              const radius = 2.2 + intensity * 5.2;
              return (
                <circle
                  key={`${point[0]}-${point[1]}-${index}`}
                  cx={point[0] * 100}
                  cy={point[1] * 100}
                  r={radius}
                  fill={`url(#heat-gradient-${resolvedMapId}-${resolvedTime})`}
                  opacity={0.5 + intensity * 0.48}
                />
              );
            })}
          </g>
          {period.points.map((point, index) => (
            <circle
              key={`center-${point[0]}-${point[1]}-${index}`}
              cx={point[0] * 100}
              cy={point[1] * 100}
              r={0.28 + Math.sqrt(point[2] / maxWeight) * 0.35}
              fill="#FFF7C2"
              opacity={0.8}
            >
              <title>
                {point[3] !== undefined
                  ? t('pals.wildLevel', {
                      min: point[3],
                      max: point[4] ?? point[3],
                    })
                  : t('pals.spawnPoints', { count: point[2] })}
              </title>
            </circle>
          ))}
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-[10px]">
        <span style={{ color: 'var(--text-secondary)' }}>
          {t('pals.spawnPoints', { count: period.count })}
        </span>
        <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
          <span>{t('pals.low')}</span>
          <span className="h-2 w-24 rounded-full bg-gradient-to-r from-red-500/30 via-orange-400 to-yellow-100" />
          <span>{t('pals.high')}</span>
        </div>
        <a
          href={mapUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-semibold transition-colors hover:underline"
          style={{ color: 'var(--accent-cyan)' }}
        >
          {t('pals.openOnPaldb')}
          <ExternalLink size={11} />
        </a>
      </div>
    </div>
  );
}
