import activeSkillsData from './json/activeSkills.json';
import type { Locale } from '@/i18n/types';
import type { PalElement } from '@/data/pals';

export interface ActiveSkill {
  id: string;
  sourceId: string;
  slug: string;
  names: Record<Locale, string>;
  descriptions: Record<Locale, string>;
  element: PalElement;
  cooldown: number;
  power: number;
  exclusive: boolean;
}

export type ActiveSkillElementFilter = 'all' | PalElement;

export const ACTIVE_SKILLS: ActiveSkill[] = activeSkillsData as ActiveSkill[];

const ACTIVE_SKILL_BY_ID = new Map(ACTIVE_SKILLS.map((skill) => [skill.id, skill]));

export function findActiveSkillById(id: string): ActiveSkill | undefined {
  return ACTIVE_SKILL_BY_ID.get(id);
}

function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim();
}

export function searchActiveSkills(
  query: string,
  locale: Locale,
  element: ActiveSkillElementFilter = 'all',
): ActiveSkill[] {
  const normalized = normalizeSearch(query);
  return ACTIVE_SKILLS.filter((skill) => {
    if (element !== 'all' && skill.element !== element) return false;
    if (!normalized) return true;
    const haystack = [
      skill.names[locale],
      skill.names.en,
      skill.descriptions[locale],
      skill.descriptions.en,
      skill.element,
    ].join(' ');
    return normalizeSearch(haystack).includes(normalized);
  });
}
