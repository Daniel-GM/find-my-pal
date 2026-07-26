import passivesData from './json/passives.json';
import type { Locale } from '@/i18n/types';

export type PassiveTier = 1 | 2 | 3 | -1;

/** Game-accurate passive chip style (matches paldb banner classes) */
export type PassiveStyle = 'blue' | 'gold' | 'rainbow' | 'gray';

export const PASSIVE_STYLE_GRADIENTS: Record<PassiveStyle, string> = {
  blue: 'linear-gradient(135deg, #3182CE 0%, #1E3A5F 100%)',
  gold: 'linear-gradient(135deg, #D69E2E 0%, #7A4E00 100%)',
  rainbow: 'linear-gradient(135deg, #8B5CF6 0%, #D946EF 55%, #F43F5E 100%)',
  gray: 'linear-gradient(135deg, #6B7280 0%, #374151 100%)',
};

export interface Passive {
  id: string;
  tier: PassiveTier;
  names: Record<Locale, string>;
  effects: Record<Locale, string>;
  style?: PassiveStyle;
}

export function getPassiveStyle(passive: Passive): PassiveStyle {
  return passive.style ?? (passive.tier === -1 ? 'gray' : 'blue');
}

export const PASSIVES: Passive[] = passivesData as Passive[];

const PASSIVE_BY_ID = new Map<string, Passive>(PASSIVES.map((p) => [p.id, p]));

export function findPassiveById(id: string): Passive | undefined {
  return PASSIVE_BY_ID.get(id);
}

export function searchPassives(query: string): Passive[] {
  const q = query.trim().toLowerCase();
  if (!q) return PASSIVES;
  return PASSIVES.filter(
    (p) =>
      p.names.en.toLowerCase().includes(q) ||
      p.names['pt-BR'].toLowerCase().includes(q),
  );
}
