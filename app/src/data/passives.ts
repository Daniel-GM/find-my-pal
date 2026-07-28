import passivesData from './json/passives.json';
import type { Locale } from '@/i18n/types';

export type PassiveTier = -3 | -2 | -1 | 1 | 2 | 3 | 4 | 5;
export type PassiveTierFilter = 'all' | 1 | 2 | 3 | 4 | 5;

export const PASSIVE_TIER_FILTERS: Exclude<PassiveTierFilter, 'all'>[] = [1, 2, 3, 4, 5];

export type PassiveStyle = 'neutral' | 'blue' | 'gold' | 'rainbow' | 'red';

export interface PassiveStyleTokens {
  accent: string;
  border: string;
  glow: string;
  overlay: string;
  text: string;
  arrowFilter: string;
}

/** Colors and filters reproduce the in-game passive rank treatment. */
export const PASSIVE_STYLE_TOKENS: Record<PassiveStyle, PassiveStyleTokens> = {
  neutral: {
    accent: '#F0F6F7',
    border: '#849092',
    glow: 'rgba(224, 239, 241, 0.24)',
    overlay: 'linear-gradient(90deg, rgba(43, 52, 54, 0.92), rgba(10, 15, 17, 0.98))',
    text: '#F2F6F7',
    arrowFilter: 'none',
  },
  blue: {
    accent: '#74C7FF',
    border: '#2C84C8',
    glow: 'rgba(70, 168, 235, 0.34)',
    overlay: 'linear-gradient(90deg, rgba(25, 75, 112, 0.9), rgba(9, 25, 38, 0.98))',
    text: '#D9F0FF',
    arrowFilter: 'sepia(1) saturate(8) hue-rotate(165deg) brightness(1.25)',
  },
  gold: {
    accent: '#FFE33F',
    border: '#A78C10',
    glow: 'rgba(255, 220, 34, 0.36)',
    overlay: 'linear-gradient(90deg, rgba(83, 76, 2, 0.94), rgba(31, 31, 5, 0.98))',
    text: '#FFF0A3',
    arrowFilter: 'sepia(1) saturate(12) hue-rotate(359deg) brightness(1.14)',
  },
  rainbow: {
    accent: '#63FFDC',
    border: '#49E9D3',
    glow: 'rgba(84, 255, 218, 0.38)',
    overlay: 'linear-gradient(90deg, rgba(36, 106, 93, 0.83), rgba(68, 48, 135, 0.92))',
    text: '#B9FFF2',
    arrowFilter: 'sepia(1) saturate(10) hue-rotate(106deg) brightness(1.2)',
  },
  red: {
    accent: '#F0444D',
    border: '#7C292D',
    glow: 'rgba(239, 68, 68, 0.28)',
    overlay: 'linear-gradient(90deg, rgba(76, 23, 27, 0.9), rgba(20, 12, 14, 0.98))',
    text: '#F8E8E9',
    arrowFilter: 'invert(0.8) sepia(0.9) saturate(74.56) hue-rotate(359deg) brightness(0.95) contrast(1.15)',
  },
};

export interface Passive {
  id: string;
  tier: PassiveTier;
  names: Record<Locale, string>;
  effects: Record<Locale, string>;
}

export function getPassiveStyle(passive: Passive): PassiveStyle {
  if (passive.tier < 0) return 'red';
  if (passive.tier === 1) return 'neutral';
  if (passive.tier === 2) return 'blue';
  if (passive.tier === 3) return 'gold';
  return 'rainbow';
}

export const PASSIVES: Passive[] = passivesData as Passive[];

const PASSIVE_BY_ID = new Map<string, Passive>(PASSIVES.map((p) => [p.id, p]));

export function findPassiveById(id: string): Passive | undefined {
  return PASSIVE_BY_ID.get(id);
}

export function searchPassives(
  query: string,
  tier: PassiveTierFilter = 'all',
): Passive[] {
  const q = query.trim().toLowerCase();
  return PASSIVES.filter(
    (p) =>
      (tier === 'all' || Math.abs(p.tier) === tier)
      && (
        !q
        || p.names.en.toLowerCase().includes(q)
        || p.names['pt-BR'].toLowerCase().includes(q)
      ),
  );
}
