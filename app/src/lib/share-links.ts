import type { User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { decodeTeam, encodeTeam } from '@/lib/team-share';
import type { SharedTeam } from '@/lib/team-share';
import type { Team } from '@/hooks/useAppState';

const SHORT_ID_LENGTH = 8;
const MAX_CREATE_ATTEMPTS = 5;
const SHORT_ID_PATTERN = /^[A-Za-z0-9]{8}$/;
const BASE62 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function sharedTeamRef(shortId: string) {
  return doc(db, 'sharedTeams', shortId);
}

/** Generates a cryptographically random base62 identifier. */
export function generateShortId(length = SHORT_ID_LENGTH): string {
  if (!Number.isInteger(length) || length < 1) {
    throw new Error('SHORT_ID_INVALID_LENGTH');
  }

  const result: string[] = [];
  const maxUnbiasedByte = Math.floor(256 / BASE62.length) * BASE62.length;
  while (result.length < length) {
    const bytes = new Uint8Array(length - result.length);
    crypto.getRandomValues(bytes);
    for (const byte of bytes) {
      if (byte >= maxUnbiasedByte) continue;
      result.push(BASE62[byte % BASE62.length]);
      if (result.length === length) break;
    }
  }
  return result.join('');
}

export async function createShortLink(
  user: User,
  team: Pick<Team, 'name' | 'slots' | 'player'>,
): Promise<string> {
  const teamData = encodeTeam(team);

  for (let attempt = 0; attempt < MAX_CREATE_ATTEMPTS; attempt += 1) {
    const shortId = generateShortId();
    const reference = sharedTeamRef(shortId);
    const existing = await getDoc(reference);
    if (existing.exists()) continue;

    await setDoc(reference, {
      teamData,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
    });
    return shortId;
  }

  throw new Error('SHORT_ID_COLLISION');
}

export async function resolveShortLink(shortId: string): Promise<SharedTeam | null> {
  if (!SHORT_ID_PATTERN.test(shortId)) return null;

  const snapshot = await getDoc(sharedTeamRef(shortId));
  if (!snapshot.exists()) return null;

  const data = snapshot.data() as Record<string, unknown>;
  const teamData = data.teamData;
  return typeof teamData === 'string' ? decodeTeam(teamData) : null;
}
