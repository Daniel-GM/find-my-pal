import palsData from './json/pals.json';
import { ELEMENTS, type PalElement } from '@/lib/elements';
import type { Locale } from '@/i18n/types';
export { ELEMENTS, type PalElement };

export interface Pal {
  id: string;
  iconName: string;
  name: string;
  names?: Partial<Record<Locale, string>>;
  number: number;
  elements: PalElement[];
  breedingPower: number;
  workSuitability: Record<string, number>;
  hp?: number;
  attack?: number;
  defense?: number;
  iconUrl?: string;
}

export type PalStatRange = [number, number];

export interface PalLevelStats {
  hp?: PalStatRange;
  attack?: PalStatRange;
  defense?: PalStatRange;
}

export interface PalDrop {
  itemId: string;
  slug: string;
  names: Record<Locale, string>;
  quantity: string;
  probability: number;
  iconUrl?: string;
}

/** [normalized x, normalized y, spawn weight, minimum level?, maximum level?] */
export type PalHeatPoint = [number, number, number, number?, number?];

export interface PalHabitatPeriod {
  count: number;
  points: PalHeatPoint[];
}

export interface PalHabitat {
  day: PalHabitatPeriod;
  night: PalHabitatPeriod;
}

export interface PalDetail {
  slug: string;
  sourceId: string;
  summaries: Record<Locale, string>;
  stats: {
    size?: string;
    rarity?: number;
    hp?: number;
    attack?: number;
    defense?: number;
    food?: number;
    meleeAttack?: number;
    workSpeed?: number;
    support?: number;
    captureRate?: number;
    maleProbability?: number;
    egg?: Partial<Record<Locale, string>>;
  };
  level1: PalLevelStats;
  level80: PalLevelStats;
  drops: PalDrop[];
  habitats: {
    palpagos: PalHabitat;
    worldTree: PalHabitat;
  };
}

export type WorkType = 'kindling' | 'watering' | 'planting' | 'generatingElectricity' | 'handiwork' | 'gathering' | 'lumbering' | 'mining' | 'medicineProduction' | 'cooling' | 'transporting' | 'farming';

export const ALL_WORK_TYPES: WorkType[] = [
  'kindling', 'watering', 'planting', 'generatingElectricity', 'handiwork',
  'gathering', 'lumbering', 'mining', 'medicineProduction', 'cooling',
  'transporting', 'farming',
];

export const PALS: Pal[] = palsData as Pal[];

const PAL_BY_NAME: Record<string, Pal> = {};
for (const pal of PALS) {
  PAL_BY_NAME[pal.name] = pal;
}

export function findPalByName(name: string): Pal | undefined {
  return PAL_BY_NAME[name];
}

export function getPalName(pal: Pal, locale: Locale): string {
  return pal.names?.[locale] || pal.name;
}
