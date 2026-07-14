import partnerSkillsData from './json/partnerSkills.json';

// Categories for filtering
export const SKILL_CATEGORIES = [
  'active_attack', 'carrying', 'damage', 'defense', 'elemental_damage', 'experience', 'glider', 'healing', 'logging', 'loot', 'melee_damage', 'mining', 'mount', 'ranch', 'sanity', 'speed', 'temperature', 'utility', 'work_speed'
] as const;

export type SkillCategory = typeof SKILL_CATEGORIES[number];

export interface PartnerSkill {
  palName: string;
  skillName: string;
  description: string;
  category: SkillCategory;
}

export const PARTNER_SKILLS: PartnerSkill[] = partnerSkillsData as PartnerSkill[];

export const CATEGORY_LABELS: Record<SkillCategory, string> = {
  active_attack: 'Active Attack',
  carrying: 'Carrying',
  damage: 'Damage Buff',
  defense: 'Defense',
  elemental_damage: 'Elemental Damage',
  experience: 'Experience',
  glider: 'Glider',
  healing: 'Healing',
  logging: 'Logging',
  loot: 'Loot',
  melee_damage: 'Melee Damage',
  mining: 'Mining',
  mount: 'Mount',
  ranch: 'Ranch',
  sanity: 'Sanity',
  speed: 'Speed',
  temperature: 'Temperature',
  utility: 'Utility',
  work_speed: 'Work Speed',
};

// Pre-made build suggestions
export interface BuildSuggestion {
  name: string;
  description: string;
  skills: PartnerSkill[];
}

export function getBuildSuggestions(): BuildSuggestion[] {
  return [
    {
      name: 'Melee Warrior',
      description: 'Maximize melee weapon damage with Pupperai and support Pals.',
      skills: [
        { palName: 'Pupperai', skillName: 'Best Boy', description: 'While in party, increases the player\'s melee weapon damage by 10~35%. (Does not stack)', category: 'melee_damage' },
        { palName: 'Bushi Noct', skillName: 'Void Blade', description: 'When activated, attacks targeted enemy with Iaigiri. When this Pal uses Iaigiri, it has a x1.1~2.5 damage multiplier. While in party, increases the player\'s melee weapon damage by 30~65% but only when not in combat. (Does not stack)', category: 'melee_damage' },
        { palName: 'Knocklem', skillName: 'Steel Guardian Mode', description: 'When activated, a steel resolve increases Knocklem\'s Attack by 50~200% and Defense by 50~200% for a limited time.', category: 'defense' },
        { palName: 'Lamball', skillName: 'Fluffy Shield', description: 'When activated, equips to the player and becomes a shield. Sometimes drops Wool when assigned to Ranch.', category: 'ranch' },
        { palName: 'Lifmunk', skillName: 'Lifmunk Recoil', description: 'When activated, leaps onto the player\'s head and uses a submachine gun to follows up player attacks.', category: 'active_attack' },
        { palName: 'Arsox', skillName: 'Warm Body', description: 'Can be ridden. While in party, the player gains Cold Resistance +2. (Does not stack)', category: 'temperature' },
      ],
    },
    {
      name: 'Sniper Build',
      description: 'Focus on bow damage and weak point damage with Robinquill and Vanwyrm.',
      skills: [
        { palName: 'Robinquill', skillName: 'Grounded Archer', description: 'While in party, increases the player\'s bow damage by 10~35%. (Does not stack)', category: 'melee_damage' },
        { palName: 'Penking Lux', skillName: 'Unyielding Storm Commander', description: 'While in party, improves player\'s and Pals\'Water damage to enemy weak points by 25~40%. (Does not stack)', category: 'utility' },
        { palName: 'Robinquill Terra', skillName: 'Master Archer', description: 'While in party, increases the player\'s bow charge speed by 15~30%. (Does not stack)', category: 'melee_damage' },
        { palName: 'Vanwyrm', skillName: 'Aerial Marauder', description: 'Can be ridden as a flying mount. While in party, increases damage player deals to enemy weak points by 20~40%. (Does not stack)', category: 'mount' },
        { palName: 'Vanwyrm Cryst', skillName: 'Aerial Marauder', description: 'Can be ridden as a flying mount. While in party, increases damage player deals to enemy weak points by 30~50%. (Does not stack)', category: 'mount' },
      ],
    },
    {
      name: 'Miner Build',
      description: 'Maximize mining efficiency for resource gathering.',
      skills: [
        { palName: 'Astegon', skillName: 'Black Ankylosaur', description: 'Can be ridden as a flying mount. Increases the damage dealt to ores by 1100~3300%, and you can obtain 150~300% more Ore while mounted.', category: 'mining' },
        { palName: 'Digtoise', skillName: 'Drill Crusher', description: 'When activated, enters the Shell Spin state. Follows the player while spinning, increasing ore mining efficiency by 800~2000%.', category: 'mining' },
        { palName: 'Broncherry', skillName: 'Love\'s First Blossom', description: 'Can be ridden. While in party, Pal Eggs you pick up have a 35~45% chance of becoming an Alpha Pal Egg. (Does not stack)', category: 'mount' },
        { palName: 'Reptyro', skillName: 'Ore-Loving Beast', description: 'Can be ridden. While in party, reduces weight of all types of ore by 30~60%. (Does not stack)', category: 'mining' },
        { palName: 'Reptyro Cryst', skillName: 'Ice-Loving Beast', description: 'Can be ridden. While in party, reduces weight of all types of ore by 35~65%. (Does not stack)', category: 'mining' },
      ],
    },
    {
      name: 'Lumberjack Build',
      description: 'Maximize logging and wood collection.',
      skills: [
        { palName: 'Eikthyrdeer', skillName: 'Guardian of the Forest', description: 'Can be ridden. Can perform a double jump while mounted and increases lumbering efficiency by 220~500%.', category: 'logging' },
        { palName: 'Eikthyrdeer Terra', skillName: 'Guardian of the Golden Forest', description: 'Can be ridden. Can perform a double jump while mounted. While at a base, increases the Lumbering Work Suitability Level for all other Base Pals by +1 (Does not stack)', category: 'work_speed' },
        { palName: 'Gumoss', skillName: 'Logging Assistance', description: 'While in party, improves logging efficiency by 30~50% and reduces weight of all types of wood by 40~60%. (Does not stack)', category: 'logging' },
        { palName: 'Mammorest', skillName: 'Gaia Crusher', description: 'Can be ridden. While mounted, increases logging efficiency by 220~500% and mining efficiency by 500~2000%.', category: 'mining' },
        { palName: 'Mammorest Cryst', skillName: 'Ice Crusher', description: 'Can be ridden. While mounted, increases logging efficiency by 220~500% and mining efficiency by 500~2000%.', category: 'mining' },
      ],
    },
    {
      name: 'Tank Build',
      description: 'Maximum defense and survivability.',
      skills: [
        { palName: 'Gorirat Terra', skillName: 'Full-Power Gorilla Pound', description: 'While in party, increases the player\'s climbing speed by 50~100%. (Does not stack)', category: 'speed' },
        { palName: 'Knocklem', skillName: 'Steel Guardian Mode', description: 'When activated, a steel resolve increases Knocklem\'s Attack by 50~200% and Defense by 50~200% for a limited time.', category: 'defense' },
        { palName: 'Lamball', skillName: 'Fluffy Shield', description: 'When activated, equips to the player and becomes a shield. Sometimes drops Wool when assigned to Ranch.', category: 'ranch' },
        { palName: 'Silvegis', skillName: 'Aegis Shield', description: 'Can be ridden. While in party, reduces shield regeneration delay by 30~60% and reduces damage taken by your shield by 65~80%. (Does not stack)', category: 'mount' },
        { palName: 'Menasting', skillName: 'Steel Scorpion', description: 'While in party, player\'s Defense increases by 5~10%, andElectric Pals drop 40~80% more items when defeated. (Does not stack)', category: 'loot' },
        { palName: 'Warsect', skillName: 'Cast-Iron Shell', description: 'While in your party, generates a barrier around the player after 5 melee hits are landed within 5~9 seconds. (Does not stack)', category: 'defense' },
      ],
    },
    {
      name: 'Speedrunner',
      description: 'Maximum movement speed for exploration.',
      skills: [
        { palName: 'Dazemu', skillName: 'Sand Sprint', description: 'Can be ridden. Movement Speed is increased by 50~100% while mounted on sand.', category: 'speed' },
        { palName: 'Starryon', skillName: 'Night Dancer', description: 'Can be ridden. Boosts jumping ability while mounted. This Pal\'s movement speed increases by +50~100% at night.', category: 'speed' },
        { palName: 'Verdash', skillName: 'Grassland Gymnast', description: 'While in party, grants 1 additional jump and 1 additional mid-air dash. (Does not stack)', category: 'utility' },
        { palName: 'Fenglope', skillName: 'Wind and Clouds', description: 'Can be ridden. Can double jump while mounted.', category: 'mount' },
        { palName: 'Necromus', skillName: 'Dark Knight of the Abyss', description: 'Can be ridden. Can double jump while mounted. When Twin Spears skill is activated, a Paladius in your party will appear and attack alongside you.', category: 'mount' },
      ],
    },
  ];
}

export function searchSkills(query: string): (PartnerSkill & { buildContext?: string[] })[] {
  const q = query.toLowerCase();
  return PARTNER_SKILLS.filter(
    (s) =>
      s.palName.toLowerCase().includes(q) ||
      s.skillName.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q),
  ).map((s) => ({ ...s }));
}

export function getSkillsByCategory(category: SkillCategory): PartnerSkill[] {
  return PARTNER_SKILLS.filter((s) => s.category === category);
}
