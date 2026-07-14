import { describe, it, expect } from 'vitest';
import { PARTNER_SKILLS, SKILL_CATEGORIES, searchSkills, getSkillsByCategory, getBuildSuggestions } from '@/data/partnerSkills';

describe('partner skills data', () => {
  it('has skill entries', () => {
    expect(PARTNER_SKILLS.length).toBeGreaterThan(0);
  });

  it('only contains known categories', () => {
    for (const skill of PARTNER_SKILLS) {
      expect(SKILL_CATEGORIES).toContain(skill.category);
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
