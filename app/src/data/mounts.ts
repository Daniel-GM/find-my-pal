import mountsData from './json/mounts.json';

export type MountType = 'flying' | 'ground' | 'water';

export interface MountInfo {
  palId: string;
  name: string;
  number: number;
  iconName: string;
  elements: string[];
  type: MountType;
  saddleLevel: number;
  runSpeed: number;
  sprintSpeed: number;
  stamina: number;
  skill: string;
}

export const MOUNTS: MountInfo[] = mountsData as MountInfo[];

export function getMountsByType(type: MountType): MountInfo[] {
  return MOUNTS.filter((m) => m.type === type).sort((a, b) => a.saddleLevel - b.saddleLevel);
}

export const LEVEL_RANGES = [
  { min: 11, max: 20, label: 'Early Game', color: '#22c55e' },
  { min: 21, max: 40, label: 'Mid Game', color: '#3b82f6' },
  { min: 41, max: 60, label: 'Late Game', color: '#a855f7' },
  { min: 61, max: 80, label: 'End Game', color: '#f59e0b' },
];
