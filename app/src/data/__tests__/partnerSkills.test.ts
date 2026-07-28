import { describe, it, expect } from 'vitest';
import {
  PARTNER_SKILLS,
  SKILL_CATEGORIES,
  findPartnerSkillByPalName,
  searchSkills,
  getSkillsByCategory,
  getBuildSuggestions,
} from '@/data/partnerSkills';

describe('partner skills data', () => {
  it('has skill entries', () => {
    expect(PARTNER_SKILLS.length).toBeGreaterThan(0);
  });

  it('only contains known categories', () => {
    for (const skill of PARTNER_SKILLS) {
      expect(SKILL_CATEGORIES).toContain(skill.category);
    }
  });

  it('includes every PalDB partner skill and exact Hoocrates progression', () => {
    expect(PARTNER_SKILLS).toHaveLength(299);
    expect(findPartnerSkillByPalName('Hoocrates')).toMatchObject({
      skillNames: {
        en: 'Dark Knowledge',
        'pt-BR': 'Sabedoria da Escuridão',
      },
      rankProgression: [
        { stars: 0, level: 1, values: ['15%'] },
        { stars: 1, level: 2, values: ['17%'] },
        { stars: 2, level: 3, values: ['20%'] },
        { stars: 3, level: 4, values: ['24%'] },
        { stars: 4, level: 5, values: ['30%'] },
      ],
    });
  });

  it('keeps at least the 0-star and 4-star endpoints for every percentage range', () => {
    const percentageSkills = PARTNER_SKILLS.filter(
      (skill) => skill.description.includes('~') && skill.description.includes('%'),
    );
    expect(percentageSkills.length).toBeGreaterThan(0);
    for (const skill of percentageSkills) {
      expect(skill.rankProgression?.[0]?.stars, skill.palName).toBe(0);
      expect(skill.rankProgression?.at(-1)?.stars, skill.palName).toBe(4);
    }
  });

  it('searches by pal name', () => {
    const results = searchSkills('Lamball');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((s) => s.palName.toLowerCase().includes('lamball'))).toBe(true);
  });

  it('searches by skill category', () => {
    const results = searchSkills('mining');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((s) =>
      s.palName.toLowerCase().includes('mining') ||
      s.skillName.toLowerCase().includes('mining') ||
      s.description.toLowerCase().includes('mining') ||
      s.category.toLowerCase().includes('mining')
    )).toBe(true);
  });

  it('filters skills by category', () => {
    const miningSkills = getSkillsByCategory('mining');
    expect(miningSkills.every((s) => s.category === 'mining')).toBe(true);
  });

  it('provides build suggestions', () => {
    const builds = getBuildSuggestions();
    expect(builds.length).toBeGreaterThan(0);
    for (const build of builds) {
      expect(build.name).toBeTruthy();
      expect(build.description).toBeTruthy();
      expect(build.skills.length).toBeGreaterThan(0);
    }
  });
});
