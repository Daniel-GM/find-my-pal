import type { Pal, PalElement, WorkType } from '../data/pals';
import { getWorkTypeLabel } from '@/i18n';
import type { Locale } from '@/i18n/types';

// Pal images - try wiki.gg first, then palpedia as fallback
export function getPalImageUrl(iconName: string): string {
  return `https://palworld.wiki.gg/images/${iconName}_icon.png`;
}

// Element type icons from palworld-icons repo (JSDelivr CDN)
const elementIconMap: Record<PalElement, string> = {
  neutral: 'neutral',
  fire: 'fire',
  water: 'water',
  grass: 'grass',
  electric: 'electric',
  ice: 'ice',
  ground: 'ground',
  dark: 'dark',
  dragon: 'dragon',
};

export function getElementIconUrl(element: PalElement): string {
  return `https://cdn.jsdelivr.net/gh/camilledtr/palworld-icons@main/pal_types/${elementIconMap[element]}.webp`;
}

// Work skill icons from palworld-icons repo (JSDelivr CDN)
const workSkillIconMap: Record<WorkType, string> = {
  kindling: 'Kindling',
  watering: 'Watering',
  planting: 'Planting',
  generatingElectricity: 'GeneratingElectricity',
  handiwork: 'Handiwork',
  gathering: 'Gathering',
  lumbering: 'Lumbering',
  mining: 'Mining',
  medicineProduction: 'MedicineProduction',
  cooling: 'Cooling',
  transporting: 'Transporting',
  farming: 'Farming',
};

export function getWorkSkillIconUrl(workType: WorkType): string {
  return `https://cdn.jsdelivr.net/gh/camilledtr/palworld-icons@main/work_skills/${workSkillIconMap[workType]}.webp`;
}

// Get work suitability entries that have level > 0
export function getActiveWorkSuitability(pal: Pal): { type: WorkType; level: number; iconUrl: string }[] {
  const entries: { type: WorkType; level: number; iconUrl: string }[] = [];
  
  (Object.entries(pal.workSuitability) as [WorkType, number][]).forEach(([type, level]) => {
    if (level > 0) {
      entries.push({ type, level, iconUrl: getWorkSkillIconUrl(type) });
    }
  });
  
  return entries;
}

// Work type labels based on locale
export function getWorkTypeLabels(locale: Locale): Record<WorkType, string> {
  return {
    kindling: getWorkTypeLabel('kindling', locale),
    watering: getWorkTypeLabel('watering', locale),
    planting: getWorkTypeLabel('planting', locale),
    generatingElectricity: getWorkTypeLabel('generatingElectricity', locale),
    handiwork: getWorkTypeLabel('handiwork', locale),
    gathering: getWorkTypeLabel('gathering', locale),
    lumbering: getWorkTypeLabel('lumbering', locale),
    mining: getWorkTypeLabel('mining', locale),
    medicineProduction: getWorkTypeLabel('medicineProduction', locale),
    cooling: getWorkTypeLabel('cooling', locale),
    transporting: getWorkTypeLabel('transporting', locale),
    farming: getWorkTypeLabel('farming', locale),
  };
}

// Deprecated: static labels kept for backward compatibility
export const workTypeLabels: Record<WorkType, string> = {
  kindling: 'Kindling',
  watering: 'Watering',
  planting: 'Planting',
  generatingElectricity: 'Generating Electricity',
  handiwork: 'Handiwork',
  gathering: 'Gathering',
  lumbering: 'Lumbering',
  mining: 'Mining',
  medicineProduction: 'Medicine Production',
  cooling: 'Cooling',
  transporting: 'Transporting',
  farming: 'Farming',
};
