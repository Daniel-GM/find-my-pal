import palsData from './json/pals.json';
import { ELEMENTS, type PalElement } from '@/lib/elements';
export { ELEMENTS, type PalElement };

export interface Pal {
  id: string;
  iconName: string;
  name: string;
  number: number;
  elements: PalElement[];
  breedingPower: number;
  workSuitability: Record<string, number>;
  hp?: number;
  attack?: number;
  defense?: number;
  iconUrl?: string;
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
