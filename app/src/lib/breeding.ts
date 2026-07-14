import type { Pal } from '@/data/pals';
import { findPalByName } from '@/data/pals';
import { BREED_DATA } from './breeding-data';

export interface BreedingCombination {
  id: string;
  parentA: Pal;
  parentB: Pal;
  baby: Pal;
}

export function findParentCombinations(targetPal: Pal): BreedingCombination[] {
  const pairs = BREED_DATA[targetPal.name];
  if (!pairs) return [];

  const combinations: BreedingCombination[] = [];
  const seen = new Set<string>();

  for (const [p1Name, p2Name] of pairs) {
    const parentA = findPalByName(p1Name);
    const parentB = findPalByName(p2Name);
    if (!parentA || !parentB) continue;

    const comboId = `${parentA.id}+${parentB.id}=${targetPal.id}`;
    if (!seen.has(comboId)) {
      seen.add(comboId);
      combinations.push({ id: comboId, parentA, parentB, baby: targetPal });
    }
  }

  return combinations;
}

export function generateComboId(parentA: Pal, parentB: Pal, baby: Pal): string {
  return `${parentA.id}+${parentB.id}=${baby.id}`;
}

export type SortOption = 'power-asc' | 'power-desc' | 'alphabetical' | 'element';

export function sortCombinations(
  combinations: BreedingCombination[],
  sort: SortOption,
): BreedingCombination[] {
  const sorted = [...combinations];
  switch (sort) {
    case 'power-asc':
      sorted.sort((a, b) => {
        const maxA = Math.max(a.parentA.breedingPower, a.parentB.breedingPower);
        const maxB = Math.max(b.parentA.breedingPower, b.parentB.breedingPower);
        return maxA - maxB;
      });
      break;
    case 'power-desc':
      sorted.sort((a, b) => {
        const maxA = Math.max(a.parentA.breedingPower, a.parentB.breedingPower);
        const maxB = Math.max(b.parentA.breedingPower, b.parentB.breedingPower);
        return maxB - maxA;
      });
      break;
    case 'alphabetical':
      sorted.sort((a, b) => {
        const nameA = `${a.parentA.name}${a.parentB.name}`;
        const nameB = `${b.parentA.name}${b.parentB.name}`;
        return String(nameA).localeCompare(String(nameB));
      });
      break;
    case 'element':
      sorted.sort((a, b) => {
        const elemA = (a.parentA.elements[0] as string | undefined) ?? '';
        const elemB = (b.parentA.elements[0] as string | undefined) ?? '';
        return elemA.localeCompare(elemB);
      });
      break;
  }
  return sorted;
}
