import {
  TEAM_SIZE,
  MAX_SLOT_PASSIVES,
  MAX_SLOT_ACTIVE_SKILLS,
  MAX_PLAYER_ACCESSORIES,
  MAX_PLAYER_WEAPONS,
  MAX_PLAYER_FOODS,
} from '@/hooks/useAppState';
import type { PlayerGear, Team, TeamSlot } from '@/hooks/useAppState';
import { PALS } from '@/data/pals';
import { PASSIVES } from '@/data/passives';
import { ACTIVE_SKILLS } from '@/data/activeSkills';
import { GEAR } from '@/data/gear';

/** Team data decoded from a share link, ready to be rendered or imported. */
export interface SharedTeam {
  name: string;
  slots: TeamSlot[];
  player: PlayerGear;
}

export type ShareHash =
  | { kind: 'full'; value: string }
  | { kind: 'short'; value: string }
  | { kind: 'community'; value: string };

const SHARE_VERSION = 1;
const MAX_TEAM_NAME_LENGTH = 50;

// Short keys keep the encoded URL small; empty arrays/nulls are omitted.
interface ShareSlotPayload {
  p?: string;
  s?: number;
  pa?: string[];
  sk?: string[];
}

interface SharePayload {
  v: number;
  name: string;
  slots: ShareSlotPayload[];
  player: {
    a?: string;
    h?: string;
    ac?: string[];
    w?: string[];
    f?: string[];
  };
}

const VALID_PAL_IDS = new Set(PALS.map((pal) => pal.id));
const VALID_PASSIVE_IDS = new Set(PASSIVES.map((passive) => passive.id));
const VALID_ACTIVE_SKILL_IDS = new Set(ACTIVE_SKILLS.map((skill) => skill.id));
const VALID_GEAR_IDS = new Set(GEAR.map((item) => item.id));

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function fromBase64Url(encoded: string): string {
  const base64 = encoded.replaceAll('-', '+').replaceAll('_', '/');
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeTeam(team: Pick<Team, 'name' | 'slots' | 'player'>): string {
  const payload: SharePayload = {
    v: SHARE_VERSION,
    name: team.name,
    slots: team.slots.map((slot) => ({
      ...(slot.palId ? { p: slot.palId } : {}),
      ...(slot.stars > 0 ? { s: slot.stars } : {}),
      ...(slot.passiveIds.length ? { pa: slot.passiveIds } : {}),
      ...(slot.activeSkillIds.length ? { sk: slot.activeSkillIds } : {}),
    })),
    player: {
      ...(team.player.armorId ? { a: team.player.armorId } : {}),
      ...(team.player.helmetId ? { h: team.player.helmetId } : {}),
      ...(team.player.accessoryIds.length ? { ac: team.player.accessoryIds } : {}),
      ...(team.player.weaponIds.length ? { w: team.player.weaponIds } : {}),
      ...(team.player.foodIds.length ? { f: team.player.foodIds } : {}),
    },
  };
  return toBase64Url(JSON.stringify(payload));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Keeps only ids that still exist in the local catalogs, so links created
// with a different data version degrade gracefully instead of breaking.
function sanitizeIds(value: unknown, validIds: Set<string>, max: number): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((id): id is string => typeof id === 'string' && validIds.has(id)).slice(0, max);
}

function sanitizeId(value: unknown, validIds: Set<string>): string | null {
  return typeof value === 'string' && validIds.has(value) ? value : null;
}

export function decodeTeam(encoded: string): SharedTeam | null {
  let payload: unknown;
  try {
    payload = JSON.parse(fromBase64Url(encoded));
  } catch {
    return null;
  }
  if (!isRecord(payload) || payload.v !== SHARE_VERSION) return null;
  if (typeof payload.name !== 'string' || !payload.name.trim()) return null;
  if (!Array.isArray(payload.slots) || payload.slots.length !== TEAM_SIZE) return null;
  if (!isRecord(payload.player)) return null;

  const slots: TeamSlot[] = payload.slots.map((raw) => {
    const slot: ShareSlotPayload = isRecord(raw) ? raw : {};
    const stars = typeof slot.s === 'number' && Number.isInteger(slot.s)
      ? Math.max(0, Math.min(4, slot.s))
      : 0;
    return {
      palId: sanitizeId(slot.p, VALID_PAL_IDS),
      stars,
      passiveIds: sanitizeIds(slot.pa, VALID_PASSIVE_IDS, MAX_SLOT_PASSIVES),
      activeSkillIds: sanitizeIds(slot.sk, VALID_ACTIVE_SKILL_IDS, MAX_SLOT_ACTIVE_SKILLS),
    };
  });

  const playerRaw = payload.player;
  const player: PlayerGear = {
    armorId: sanitizeId(playerRaw.a, VALID_GEAR_IDS),
    helmetId: sanitizeId(playerRaw.h, VALID_GEAR_IDS),
    accessoryIds: sanitizeIds(playerRaw.ac, VALID_GEAR_IDS, MAX_PLAYER_ACCESSORIES),
    weaponIds: sanitizeIds(playerRaw.w, VALID_GEAR_IDS, MAX_PLAYER_WEAPONS),
    foodIds: sanitizeIds(playerRaw.f, VALID_GEAR_IDS, MAX_PLAYER_FOODS),
  };

  return { name: payload.name.trim().slice(0, MAX_TEAM_NAME_LENGTH), slots, player };
}

/** Extracts the encoded team from a location hash like "#team=<data>". */
export function teamFromHash(hash: string): SharedTeam | null {
  const match = /^#team=(.+)$/.exec(hash);
  if (!match) return null;
  return decodeTeam(match[1]);
}

/** Parses supported share hashes without resolving their Firestore payloads. */
export function parseShareHash(hash: string): ShareHash | null {
  const fullMatch = /^#team=(.+)$/.exec(hash);
  if (fullMatch) return { kind: 'full', value: fullMatch[1] };

  const shortMatch = /^#t=([A-Za-z0-9]{8})$/.exec(hash);
  if (shortMatch) return { kind: 'short', value: shortMatch[1] };

  const communityMatch = /^#p=([A-Za-z0-9_-]+)$/.exec(hash);
  if (communityMatch) return { kind: 'community', value: communityMatch[1] };

  return null;
}
