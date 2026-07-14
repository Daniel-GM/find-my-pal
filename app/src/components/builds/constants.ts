import {
  Swords,
  Shield,
  Pickaxe,
  TreePine,
  Heart,
  Zap,
  Crosshair,
  Footprints,
  Thermometer,
  GraduationCap,
  BrainCircuit,
  Plane,
  Mountain,
  Tractor,
  Package,
  Hammer,
  HelpCircle,
} from 'lucide-react';
import { PALS } from '@/data/pals';
import type { PartnerSkill, BuildSuggestion, SkillCategory } from '@/data/partnerSkills';

export const EASE_BEZIER = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

export const CATEGORY_ICONS: Record<SkillCategory, React.ComponentType<{ size?: number; className?: string }>> = {
  elemental_damage: Zap,
  active_attack: Crosshair,
  damage: Swords,
  mount: Mountain,
  loot: Package,
  ranch: Tractor,
  defense: Shield,
  carrying: Package,
  healing: Heart,
  utility: HelpCircle,
  mining: Pickaxe,
  glider: Plane,
  logging: TreePine,
  speed: Footprints,
  temperature: Thermometer,
  melee_damage: Swords,
  work_speed: Hammer,
  experience: GraduationCap,
  sanity: BrainCircuit,
};

export const CATEGORY_COLORS: Record<SkillCategory, { bg: string; text: string; border: string }> = {
  elemental_damage: { bg: 'rgba(234,179,8,0.12)', text: '#eab308', border: 'rgba(234,179,8,0.25)' },
  active_attack: { bg: 'rgba(239,68,68,0.12)', text: '#ef4444', border: 'rgba(239,68,68,0.25)' },
  damage: { bg: 'rgba(239,68,68,0.12)', text: '#f87171', border: 'rgba(239,68,68,0.25)' },
  mount: { bg: 'rgba(59,130,246,0.12)', text: '#60a5fa', border: 'rgba(59,130,246,0.25)' },
  loot: { bg: 'rgba(168,85,247,0.12)', text: '#a855f7', border: 'rgba(168,85,247,0.25)' },
  ranch: { bg: 'rgba(34,197,94,0.12)', text: '#34d399', border: 'rgba(34,197,94,0.25)' },
  defense: { bg: 'rgba(59,130,246,0.12)', text: '#3b82f6', border: 'rgba(59,130,246,0.25)' },
  carrying: { bg: 'rgba(217,119,6,0.12)', text: '#d97706', border: 'rgba(217,119,6,0.25)' },
  healing: { bg: 'rgba(34,197,94,0.12)', text: '#22c55e', border: 'rgba(34,197,94,0.25)' },
  utility: { bg: 'rgba(156,163,175,0.12)', text: '#9ca3af', border: 'rgba(156,163,175,0.25)' },
  mining: { bg: 'rgba(120,113,108,0.12)', text: '#78716c', border: 'rgba(120,113,108,0.25)' },
  glider: { bg: 'rgba(14,165,233,0.12)', text: '#0ea5e9', border: 'rgba(14,165,233,0.25)' },
  logging: { bg: 'rgba(22,163,74,0.12)', text: '#16a34a', border: 'rgba(22,163,74,0.25)' },
  speed: { bg: 'rgba(14,165,233,0.12)', text: '#38bdf8', border: 'rgba(14,165,233,0.25)' },
  temperature: { bg: 'rgba(236,72,153,0.12)', text: '#ec4899', border: 'rgba(236,72,153,0.25)' },
  melee_damage: { bg: 'rgba(185,28,28,0.12)', text: '#dc2626', border: 'rgba(185,28,28,0.25)' },
  work_speed: { bg: 'rgba(217,119,6,0.12)', text: '#f59e0b', border: 'rgba(217,119,6,0.25)' },
  experience: { bg: 'rgba(99,102,241,0.12)', text: '#6366f1', border: 'rgba(99,102,241,0.25)' },
  sanity: { bg: 'rgba(107,33,168,0.12)', text: '#9333ea', border: 'rgba(107,33,168,0.25)' },
};

export const BUILD_ICON_COLORS = [
  { bg: 'rgba(239,68,68,0.1)', icon: '#ef4444' },
  { bg: 'rgba(59,130,246,0.1)', icon: '#3b82f6' },
  { bg: 'rgba(34,197,94,0.1)', icon: '#22c55e' },
  { bg: 'rgba(168,85,247,0.1)', icon: '#a855f7' },
  { bg: 'rgba(234,179,8,0.1)', icon: '#eab308' },
  { bg: 'rgba(236,72,153,0.1)', icon: '#ec4899' },
];

export function findPalByName(palName: string) {
  return PALS.find((p) => p.name === palName) || null;
}

export interface SkillWithContext extends PartnerSkill {
  buildContext?: string[];
}

export interface BuildCardProps {
  build: BuildSuggestion;
  index: number;
  onSelectBuild: (build: BuildSuggestion) => void;
}
