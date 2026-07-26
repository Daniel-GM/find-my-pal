import gearData from './json/gear.json';
import type { Locale } from '@/i18n/types';

export type GearKind = 'armor' | 'helmet' | 'accessory' | 'weapon' | 'food';

export interface GearItem {
  id: string;
  kind: GearKind;
  names: Record<Locale, string>;
  effects?: Record<Locale, string>;
  iconUrl?: string;
  sourceId?: string;
  /** 0 common, 1 uncommon, 2 rare, 3 epic, 4 legendary */
  rarity?: number;
}

/** WoW-style rarity colors (same scheme used by paldb.cc bg_rarityN) */
export const RARITY_COLORS: Record<number, string> = {
  0: '#9D9D9D',
  1: '#1EFF00',
  2: '#0070DD',
  3: '#A335EE',
  4: '#FF8000',
};

export function getRarityColor(item: GearItem): string {
  return RARITY_COLORS[item.rarity ?? 0] ?? RARITY_COLORS[0];
}

/** Slot style with rarity-tinted background and border */
export function getRaritySlotStyle(item?: GearItem | null): React.CSSProperties {
  if (!item) return {};
  const color = getRarityColor(item);
  return {
    backgroundColor: `color-mix(in srgb, ${color} 18%, transparent)`,
    border: `1px solid ${color}`,
  };
}

export const GEAR: GearItem[] = gearData as GearItem[];

const GEAR_BY_ID = new Map<string, GearItem>(GEAR.map((g) => [g.id, g]));

export function findGearById(id: string): GearItem | undefined {
  return GEAR_BY_ID.get(id);
}

export function getGearByKind(kind: GearKind): GearItem[] {
  return GEAR.filter((g) => g.kind === kind);
}
