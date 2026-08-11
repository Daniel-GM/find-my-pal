import { describe, it, expect } from 'vitest';
import { decodeTeam, encodeTeam, teamFromHash } from '@/lib/team-share';
import type { Team } from '@/hooks/useAppState';
import { PALS } from '@/data/pals';
import { PASSIVES } from '@/data/passives';
import { ACTIVE_SKILLS } from '@/data/activeSkills';
import { GEAR } from '@/data/gear';

const palId = PALS[0].id;
const passiveId = PASSIVES[0].id;
const activeSkillId = ACTIVE_SKILLS[0].id;
const gearByKind = (kind: string) => GEAR.find((item) => item.kind === kind)!.id;

function fullTeam(): Pick<Team, 'name' | 'slots' | 'player'> {
  return {
    name: 'Meu Time âêõ',
    slots: [
      { palId, passiveIds: [passiveId], activeSkillIds: [activeSkillId], stars: 4 },
      { palId: null, passiveIds: [], activeSkillIds: [], stars: 0 },
      { palId, passiveIds: [], activeSkillIds: [], stars: 2 },
      { palId: null, passiveIds: [], activeSkillIds: [], stars: 0 },
      { palId: null, passiveIds: [], activeSkillIds: [], stars: 0 },
    ],
    player: {
      armorId: gearByKind('armor'),
      helmetId: gearByKind('helmet'),
      accessoryIds: [gearByKind('accessory')],
      weaponIds: [gearByKind('weapon')],
      foodIds: [gearByKind('food')],
    },
  };
}

function emptyTeam(): Pick<Team, 'name' | 'slots' | 'player'> {
  return {
    name: 'Vazio',
    slots: Array.from({ length: 5 }, () => ({
      palId: null,
      passiveIds: [],
      activeSkillIds: [],
      stars: 0,
    })),
    player: { armorId: null, helmetId: null, accessoryIds: [], weaponIds: [], foodIds: [] },
  };
}

describe('team-share', () => {
  it('round-trips a full team, including unicode names', () => {
    const team = fullTeam();
    expect(decodeTeam(encodeTeam(team))).toEqual(team);
  });

  it('round-trips an empty team', () => {
    expect(decodeTeam(encodeTeam(emptyTeam()))).toEqual(emptyTeam());
  });

  it('produces a URL-safe encoding', () => {
    expect(encodeTeam(fullTeam())).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('parses a valid share hash', () => {
    const team = fullTeam();
    expect(teamFromHash(`#team=${encodeTeam(team)}`)).toEqual(team);
  });

  it('returns null for unrelated hashes', () => {
    expect(teamFromHash('#/foo')).toBeNull();
    expect(teamFromHash('')).toBeNull();
  });

  it('returns null for broken payloads', () => {
    expect(decodeTeam('not-base64!!!')).toBeNull();
    expect(decodeTeam(btoa('{"v":2,"name":"x"}'))).toBeNull();
    expect(decodeTeam(btoa('{"v":1,"name":"  ","slots":[],"player":{}}'))).toBeNull();
    expect(decodeTeam(btoa('{"v":1,"name":"x","slots":[],"player":{}}'))).toBeNull();
  });

  it('drops unknown ids instead of failing', () => {
    const team = fullTeam();
    team.slots[0].passiveIds = ['no_such_passive'];
    team.player.armorId = 'no_such_gear';
    const decoded = decodeTeam(encodeTeam(team))!;
    expect(decoded.slots[0].passiveIds).toEqual([]);
    expect(decoded.player.armorId).toBeNull();
    expect(decoded.slots[0].palId).toBe(palId);
  });

  it('truncates lists beyond the limits', () => {
    const payload = {
      v: 1,
      name: 'x',
      slots: Array.from({ length: 5 }, () => ({ pa: Array(9).fill(passiveId) })),
      player: { w: Array(9).fill(gearByKind('weapon')) },
    };
    const decoded = decodeTeam(btoa(JSON.stringify(payload)))!;
    expect(decoded.slots[0].passiveIds).toHaveLength(4);
    expect(decoded.player.weaponIds).toHaveLength(6);
  });

  it('clamps stars and truncates long names', () => {
    const payload = {
      v: 1,
      name: 'a'.repeat(80),
      slots: Array.from({ length: 5 }, () => ({ p: palId, s: 9 })),
      player: {},
    };
    const decoded = decodeTeam(btoa(JSON.stringify(payload)))!;
    expect(decoded.name).toHaveLength(50);
    expect(decoded.slots[0].stars).toBe(4);
  });
});
