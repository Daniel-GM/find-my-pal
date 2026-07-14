import palDropsData from './json/drops.json';
export { getItemImageUrl } from '@/lib/game-entity-images';

export interface DropEntry {
  itemId: string;
  itemName: string;
  rate: number;
  min: number;
  max: number;
}

export const PAL_DROPS: Record<string, DropEntry[]> = palDropsData as Record<string, DropEntry[]>;

// Rare/golden items that players seek
export const RARE_DROP_ITEMS = [
  'Diamond',
  'Sapphire',
  'Ruby',
  'Emerald',
  'Predator Core',
  'Dark Fragment',
  'Gold Coin',
  'Ancient Civilization Parts',
  'Pal Metal Ingot',
  'Carbon Fiber',
  'Polymer',
  'Pure Quartz',
];

export function isRareDrop(itemName: string): boolean {
  return RARE_DROP_ITEMS.some(rare => itemName.toLowerCase().includes(rare.toLowerCase()));
}

// Get all unique items that pals drop
export function getAllDropItems(): { itemName: string; itemId: string; pals: string[] }[] {
  const itemMap: Record<string, { itemName: string; itemId: string; pals: string[] }> = {};

  for (const [palName, drops] of Object.entries(PAL_DROPS)) {
    for (const drop of drops) {
      if (!itemMap[drop.itemName]) {
        itemMap[drop.itemName] = { itemName: drop.itemName, itemId: drop.itemId, pals: [] };
      }
      if (!itemMap[drop.itemName].pals.includes(palName)) {
        itemMap[drop.itemName].pals.push(palName);
      }
    }
  }

  return Object.values(itemMap).sort((a, b) => b.pals.length - a.pals.length);
}

// Get pals that drop a specific item
export function getPalsByDropItem(itemName: string): { palName: string; rate: number; min: number; max: number }[] {
  const result: { palName: string; rate: number; min: number; max: number }[] = [];

  for (const [palName, drops] of Object.entries(PAL_DROPS)) {
    const drop = drops.find(d => d.itemName.toLowerCase() === itemName.toLowerCase());
    if (drop) {
      result.push({ palName, rate: drop.rate, min: drop.min, max: drop.max });
    }
  }

  return result.sort((a, b) => b.rate - a.rate);
}
