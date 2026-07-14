import palDropsData from './json/drops.json';

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

// Item image mapping from Palpedia CDN
const ITEM_IMAGE_MAP: Record<string, string> = {
  Arrow: 'items/T_itemicon_Arrow.png',
  Berries: 'items/T_itemicon_Food_Berries.png',
  BerrySeeds: 'items/T_itemicon_BerrySeeds.png',
  Bone: 'items/T_itemicon_Material_Bone.png',
  Cake: 'items/T_itemicon_Food_Cake.png',
  CarbonFiber: 'items/T_itemicon_Material_CarbonFiber.png',
  Cloth: 'items/T_itemicon_Material_Cloth.png',
  Cloth2: 'items/T_itemicon_Material_Cloth2.png',
  Coal: 'items/T_itemicon_Material_Coal.png',
  CopperIngot: 'items/T_itemicon_Material_CopperIngot.png',
  CopperOre: 'items/T_itemicon_Material_CopperOre.png',
  CrudeOil: 'items/T_itemicon_Material_CrudeOil.png',
  Diamond: 'items/T_itemicon_Material_Diamond.png',
  DogCoin: 'items/T_itemicon_Accessory_DogCoin.png',
  Egg: 'items/T_itemicon_Food_Egg.png',
  ElectricOrgan: 'items/T_itemicon_Material_ElectricOrgan.png',
  ExpBoost_04: 'items/T_itemicon_ExpBoost_04.png',
  Fiber: 'items/T_itemicon_Material_Fiber.png',
  FireOrgan: 'items/T_itemicon_Material_FireOrgan.png',
  Gunpowder2: 'items/T_itemicon_Material_Gunpowder2.png',
  Herbs: 'items/T_itemicon_Food_Herbs.png',
  Honey: 'items/T_itemicon_Material_Honey.png',
  Horn: 'items/T_itemicon_Material_Horn.png',
  IceOrgan: 'items/T_itemicon_Material_IceOrgan.png',
  Leather: 'items/T_itemicon_Material_Leather.png',
  LettuceSeeds: 'items/T_itemicon_LettuceSeeds.png',
  Meat_BerryGoat: 'items/T_itemicon_Food_Meat_BerryGoat.png',
  Meat_Boar: 'items/T_itemicon_Food_Meat_Boar.png',
  Meat_ChickenPal: 'items/T_itemicon_Food_Meat_ChickenPal.png',
  Meat_CowPal: 'items/T_itemicon_Food_Meat_CowPal.png',
  Meat_Deer: 'items/T_itemicon_Food_Meat_Deer.png',
  Meat_Eagle: 'items/T_itemicon_Food_Meat_Eagle.png',
  Meat_GrassMammoth: 'items/T_itemicon_Food_Meat_GrassMammoth.png',
  Meat_IceDeer: 'items/T_itemicon_Food_Meat_IceDeer.png',
  Meat_Kelpie: 'items/T_itemicon_Food_Meat_Kelpie.png',
  Meat_LazyCatfish: 'items/T_itemicon_Food_Meat_LazyCatfish.png',
  Meat_SakuraSaurus: 'items/T_itemicon_Food_Meat_SakuraSaurus.png',
  Meat_SheepBall: 'items/T_itemicon_Food_Meat_SheepBall.png',
  MeteorDrop: 'items/T_itemicon_Material_MeteorDrop.png',
  Milk: 'items/T_itemicon_Food_Milk.png',
  Money: 'items/T_itemicon_Material_Money.png',
  Mushroom: 'items/T_itemicon_Food_Mushroom.png',
  Narcotic: 'items/T_itemicon_Material_Narcotic.png',
  Opium: 'items/T_itemicon_Material_Opium.png',
  PalFluid: 'items/T_itemicon_Material_PalFluid.png',
  PalItem_CaptainPenguin: 'items/T_itemicon_PalItem_CaptainPenguin.png',
  PalItem_CatMage: 'items/T_itemicon_PalItem_CatMage.png',
  PalItem_ColorfulBird: 'items/T_itemicon_PalItem_ColorfulBird.png',
  PalItem_LizardMan: 'items/T_itemicon_PalItem_LizardMan.png',
  PalItem_MopBaby: 'items/T_itemicon_PalItem_MopBaby.png',
  PalItem_NegativeOctopus: 'items/T_itemicon_PalItem_NegativeOctopus.png',
  PalItem_PinkRabbit: 'items/T_itemicon_PalItem_PinkRabbit.png',
  PalItem_PlantSlime: 'items/T_itemicon_PalItem_PlantSlime.png',
  PalItem_RaijinDaughter: 'items/T_itemicon_PalItem_RaijinDaughter.png',
  PalItem_ToSell_04: 'items/T_itemicon_PalItem_ToSell_04.png',
  PalOil: 'items/T_itemicon_Material_PalOil.png',
  PalUpgradeStone: 'items/T_itemicon_PalUpgradeStone.png',
  PalUpgradeStone2: 'items/T_itemicon_PalUpgradeStone2.png',
  PalUpgradeStone3: 'items/T_itemicon_PalUpgradeStone3.png',
  Pal_crystal_S: 'items/T_itemicon_Pal_crystal_S.png',
  Polymer: 'items/T_itemicon_Material_Polymer.png',
  Poppy: 'items/T_itemicon_Food_Poppy.png',
  Quartz: 'items/T_itemicon_Material_Quartz.png',
  Ruby: 'items/T_itemicon_Material_Ruby.png',
  Sapphire: 'items/T_itemicon_Material_Sapphire.png',
  Spear_QueenBee: 'items/T_itemicon_Weapon_Spear_QueenBee.png',
  StatusPointResetSan: 'items/T_itemicon_StatusPointResetSan.png',
  StealIngot: 'items/T_itemicon_Material_StealIngot.png',
  Sweet: 'items/T_itemicon_Food_Sweet.png',
  TechnologyBook_G1: 'items/T_itemicon_TechnologyBook_G1.png',
  TechnologyBook_G2: 'items/T_itemicon_TechnologyBook_G2.png',
  TomatoSeeds: 'items/T_itemicon_TomatoSeeds.png',
  TreasureBoxKey01: 'items/T_itemicon_TreasureBoxKey01.png',
  TreasureBoxKey02: 'items/T_itemicon_TreasureBoxKey02.png',
  Venom: 'items/T_itemicon_Material_Venom.png',
  VenomGland: 'items/T_itemicon_Material_VenomGland.png',
  WheatSeeds: 'items/T_itemicon_WheatSeeds.png',
  Wool: 'items/T_itemicon_Material_Wool.png',
};

export function getItemImageUrl(itemId: string): string {
  const path = ITEM_IMAGE_MAP[itemId];
  if (path) {
    return `https://palpedia.azrocdn.com/${path}`;
  }
  // Fallback: try common pattern
  return `https://palpedia.azrocdn.com/items/T_itemicon_Material_${itemId}.png`;
}
