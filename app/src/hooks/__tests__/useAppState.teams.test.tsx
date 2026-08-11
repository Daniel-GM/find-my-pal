import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useAppState,
  TEAM_SIZE,
  MAX_SLOT_PASSIVES,
  MAX_SLOT_ACTIVE_SKILLS,
  MAX_PLAYER_ACCESSORIES,
  MAX_PLAYER_WEAPONS,
  MAX_PLAYER_FOODS,
} from '@/hooks/useAppState';

describe('useAppState teams', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('addTeam creates a team with 5 empty slots and activates it', () => {
    const { result } = renderHook(() => useAppState());
    let id = '';
    act(() => {
      id = result.current.addTeam('Boss Team');
    });

    expect(result.current.teams).toHaveLength(1);
    const team = result.current.teams[0];
    expect(team.id).toBe(id);
    expect(team.name).toBe('Boss Team');
    expect(team.slots).toHaveLength(TEAM_SIZE);
    for (const slot of team.slots) {
      expect(slot).toEqual({ palId: null, passiveIds: [], activeSkillIds: [], stars: 0 });
    }
    expect(team.player).toEqual({
      armorId: null,
      helmetId: null,
      accessoryIds: [],
      weaponIds: [],
      foodIds: [],
    });
    expect(result.current.activeTeamId).toBe(id);
  });

  it('setSlotPal assigns a pal and clearing it resets passives and stars', () => {
    const { result } = renderHook(() => useAppState());
    let id = '';
    act(() => {
      id = result.current.addTeam('T1');
    });
    act(() => {
      result.current.setSlotPal(id, 0, 'lamball');
      result.current.setSlotStars(id, 0, 3);
      result.current.toggleSlotPassive(id, 0, 'lucky');
    });

    let slot = result.current.teams[0].slots[0];
    expect(slot.palId).toBe('lamball');
    expect(slot.stars).toBe(3);
    expect(slot.passiveIds).toEqual(['lucky']);

    act(() => {
      result.current.setSlotPal(id, 0, null);
    });
    slot = result.current.teams[0].slots[0];
    expect(slot).toEqual({ palId: null, passiveIds: [], activeSkillIds: [], stars: 0 });
  });

  it('toggleSlotPassive toggles and caps at the maximum', () => {
    const { result } = renderHook(() => useAppState());
    let id = '';
    act(() => {
      id = result.current.addTeam('T1');
    });
    const passives = ['lucky', 'legend', 'ferocious', 'swift', 'artisan'];
    act(() => {
      result.current.setSlotPal(id, 0, 'lamball');
      for (const p of passives) result.current.toggleSlotPassive(id, 0, p);
    });

    let slot = result.current.teams[0].slots[0];
    expect(slot.passiveIds).toHaveLength(MAX_SLOT_PASSIVES);
    expect(slot.passiveIds).not.toContain('artisan');

    act(() => {
      result.current.toggleSlotPassive(id, 0, 'lucky');
    });
    slot = result.current.teams[0].slots[0];
    expect(slot.passiveIds).not.toContain('lucky');
    expect(slot.passiveIds).toHaveLength(MAX_SLOT_PASSIVES - 1);
  });

  it('setSlotStars clamps between 0 and 4', () => {
    const { result } = renderHook(() => useAppState());
    let id = '';
    act(() => {
      id = result.current.addTeam('T1');
    });
    act(() => {
      result.current.setSlotStars(id, 0, 10);
    });
    expect(result.current.teams[0].slots[0].stars).toBe(4);
    act(() => {
      result.current.setSlotStars(id, 0, -2);
    });
    expect(result.current.teams[0].slots[0].stars).toBe(0);
  });

  it('toggleSlotActiveSkill toggles and caps at three skills', () => {
    const { result } = renderHook(() => useAppState());
    let id = '';
    act(() => {
      id = result.current.addTeam('T1');
      result.current.setSlotPal(id, 0, 'lamball');
      for (const skill of ['poison_shot', 'gravity_shot', 'dragon_cannon', 'air_cannon']) {
        result.current.toggleSlotActiveSkill(id, 0, skill);
      }
    });

    expect(result.current.teams[0].slots[0].activeSkillIds).toHaveLength(
      MAX_SLOT_ACTIVE_SKILLS,
    );
    expect(result.current.teams[0].slots[0].activeSkillIds).not.toContain('air_cannon');

    act(() => {
      result.current.toggleSlotActiveSkill(id, 0, 'poison_shot');
    });
    expect(result.current.teams[0].slots[0].activeSkillIds).not.toContain('poison_shot');
  });

  it('player gear respects slot limits', () => {
    const { result } = renderHook(() => useAppState());
    let id = '';
    act(() => {
      id = result.current.addTeam('T1');
    });
    act(() => {
      result.current.setPlayerGearItem(id, 'armorId', 'pal_metal_armor');
      result.current.setPlayerGearItem(id, 'helmetId', 'iron_helmet');
      for (const w of ['handgun', 'musket', 'sword', 'assault_rifle', 'rocket_launcher', 'grenade_launcher', 'wooden_club']) {
        result.current.togglePlayerWeapon(id, w);
      }
      result.current.togglePlayerAccessory(id, 'attack_pendant');
      result.current.togglePlayerAccessory(id, 'defense_pendant');
      result.current.togglePlayerAccessory(id, 'life_pendant');
      result.current.togglePlayerAccessory(id, 'pendant_of_diligence');
      result.current.togglePlayerAccessory(id, 'ring_of_mercy');
      result.current.togglePlayerFood(id, 'salad');
      result.current.togglePlayerFood(id, 'omelet');
      result.current.togglePlayerFood(id, 'curry');
      result.current.togglePlayerFood(id, 'cake');
    });

    const player = result.current.teams[0].player;
    expect(player.armorId).toBe('pal_metal_armor');
    expect(player.helmetId).toBe('iron_helmet');
    expect(player.weaponIds).toHaveLength(MAX_PLAYER_WEAPONS);
    expect(player.weaponIds).not.toContain('wooden_club');
    expect(player.accessoryIds).toHaveLength(MAX_PLAYER_ACCESSORIES);
    expect(player.accessoryIds).not.toContain('ring_of_mercy');
    expect(player.foodIds).toHaveLength(MAX_PLAYER_FOODS);
    expect(player.foodIds).not.toContain('cake');

    act(() => {
      result.current.togglePlayerAccessory(id, 'attack_pendant');
      result.current.togglePlayerWeapon(id, 'handgun');
    });
    expect(result.current.teams[0].player.accessoryIds).not.toContain('attack_pendant');
    expect(result.current.teams[0].player.weaponIds).not.toContain('handgun');
  });

  it('migrates legacy player gear (weaponId -> weaponIds, adds helmetId)', () => {
    localStorage.setItem(
      'palworld-breeding-manager',
      JSON.stringify({
        packages: [],
        theme: 'dark',
        lastSelectedPalId: null,
        currentView: 'team',
        breedingSearchMode: 'child',
        activeTeamId: 't1',
        teams: [
          {
            id: 't1',
            name: 'Legacy',
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
            slots: Array.from({ length: TEAM_SIZE }, () => ({
              palId: null,
              passiveIds: [],
              stars: 0,
            })),
            player: {
              armorId: 'pal_metal_armor',
              accessoryIds: ['attack_pendant'],
              weaponId: 'assault_rifle',
              foodIds: [],
            },
          },
        ],
      }),
    );

    const { result } = renderHook(() => useAppState());
    const player = result.current.teams[0].player;
    expect(player.armorId).toBe('pal_metal_armor');
    expect(player.helmetId).toBeNull();
    expect(player.weaponIds).toEqual(['assault_rifle']);
    expect(player.accessoryIds).toEqual(['attack_pendant']);
    expect(result.current.teams[0].slots[0].activeSkillIds).toEqual([]);
  });

  it('importTeam creates a team from shared data and activates it', () => {
    const { result } = renderHook(() => useAppState());
    let id = '';
    const shared = {
      name: 'Shared Build',
      slots: [
        { palId: 'lamball', passiveIds: ['lucky'], activeSkillIds: ['poison_shot'], stars: 3 },
        ...Array.from({ length: TEAM_SIZE - 1 }, () => ({
          palId: null,
          passiveIds: [],
          activeSkillIds: [],
          stars: 0,
        })),
      ],
      player: {
        armorId: 'pal_metal_armor',
        helmetId: 'iron_helmet',
        accessoryIds: ['attack_pendant'],
        weaponIds: ['handgun'],
        foodIds: [],
      },
    };
    act(() => {
      id = result.current.importTeam(shared);
    });

    expect(result.current.teams).toHaveLength(1);
    const team = result.current.teams[0];
    expect(team.id).toBe(id);
    expect(team.name).toBe('Shared Build');
    expect(team.slots).toEqual(shared.slots);
    expect(team.player).toEqual(shared.player);
    expect(result.current.activeTeamId).toBe(id);
  });

  it('deleteTeam removes the team and moves active to the first remaining', () => {
    const { result } = renderHook(() => useAppState());
    let first = '';
    let second = '';
    act(() => {
      first = result.current.addTeam('First');
    });
    act(() => {
      second = result.current.addTeam('Second');
    });
    expect(result.current.activeTeamId).toBe(second);

    act(() => {
      result.current.deleteTeam(second);
    });
    expect(result.current.teams).toHaveLength(1);
    expect(result.current.activeTeamId).toBe(first);

    act(() => {
      result.current.deleteTeam(first);
    });
    expect(result.current.teams).toHaveLength(0);
    expect(result.current.activeTeamId).toBeNull();
  });
});
