import { describe, expect, it } from 'vitest';
import {
  ACTIVE_SKILLS,
  findActiveSkillById,
  searchActiveSkills,
} from '@/data/activeSkills';

describe('active skills data', () => {
  it('contains the complete PalDB active skill list with stable unique ids', () => {
    expect(ACTIVE_SKILLS).toHaveLength(315);
    expect(new Set(ACTIVE_SKILLS.map((skill) => skill.id)).size).toBe(315);
  });

  it('stores localized names, descriptions and combat values', () => {
    const poisonBlast = ACTIVE_SKILLS.find((skill) => skill.slug === 'Poison_Blast');
    expect(poisonBlast).toMatchObject({
      names: {
        en: 'Poison Blast',
        'pt-BR': 'Disparo de Veneno',
      },
      cooldown: 2,
      power: 30,
      element: 'dark',
    });
    expect(findActiveSkillById(poisonBlast!.id)).toBe(poisonBlast);
    expect(searchActiveSkills('veneno', 'pt-BR')).toContain(poisonBlast);
  });

  it('combines localized search with an element filter', () => {
    const fireSkills = searchActiveSkills('', 'pt-BR', 'fire');
    expect(fireSkills.length).toBeGreaterThan(0);
    expect(fireSkills.every((skill) => skill.element === 'fire')).toBe(true);
    expect(searchActiveSkills('veneno', 'pt-BR', 'fire')).toHaveLength(0);
  });
});
