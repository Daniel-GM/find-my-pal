import { describe, expect, it } from 'vitest';
import {
  findPassiveById,
  getPassiveStyle,
  PASSIVES,
  searchPassives,
} from '@/data/passives';

describe('Pal passive catalog', () => {
  it('contains only the 114 Pal passives from the dedicated PalDB tab', () => {
    expect(PASSIVES).toHaveLength(114);
    expect(PASSIVES.some((passive) => passive.id === 'pal_attack_up_lv_4')).toBe(false);
    expect(PASSIVES.some((passive) => passive.id === 'cold_resistance_lv_3')).toBe(false);
    expect(PASSIVES.some((passive) => /\bLv\.\s*\d/i.test(passive.names.en))).toBe(false);
  });

  it('preserves the in-game arrow rank, including negative and special ranks', () => {
    expect(findPassiveById('insomnia')?.tier).toBe(1);
    expect(findPassiveById('musclehead')?.tier).toBe(2);
    expect(findPassiveById('vanguard')?.tier).toBe(3);
    expect(findPassiveById('legend')?.tier).toBe(4);
    expect(findPassiveById('demon_s_hand')?.tier).toBe(5);
    expect(findPassiveById('mercy_hit')?.tier).toBe(-1);
    expect(findPassiveById('bottomless_stomach')?.tier).toBe(-2);
    expect(findPassiveById('slacker')?.tier).toBe(-3);
  });

  it('maps each rank to the game-style treatment', () => {
    expect(getPassiveStyle(findPassiveById('insomnia')!)).toBe('neutral');
    expect(getPassiveStyle(findPassiveById('musclehead')!)).toBe('blue');
    expect(getPassiveStyle(findPassiveById('vanguard')!)).toBe('gold');
    expect(getPassiveStyle(findPassiveById('legend')!)).toBe('rainbow');
    expect(getPassiveStyle(findPassiveById('mercy_hit')!)).toBe('red');
  });

  it('filters tiers by their displayed rank, including negative passives', () => {
    const tierThree = searchPassives('', 3);
    expect(tierThree.length).toBeGreaterThan(0);
    expect(tierThree.every((passive) => Math.abs(passive.tier) === 3)).toBe(true);
    expect(tierThree.some((passive) => passive.tier === -3)).toBe(true);
    expect(tierThree.some((passive) => passive.tier === 3)).toBe(true);
  });
});
