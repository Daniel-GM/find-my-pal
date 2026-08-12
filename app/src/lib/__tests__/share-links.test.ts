import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from 'firebase/auth';
import { encodeTeam, parseShareHash } from '@/lib/team-share';
import {
  createShortLink,
  generateShortId,
  resolveShortLink,
} from '@/lib/share-links';
import type { Team } from '@/hooks/useAppState';

const firestoreMocks = vi.hoisted(() => ({
  doc: vi.fn((...parts: unknown[]) => ({ parts })),
  getDoc: vi.fn(),
  serverTimestamp: vi.fn(() => 'server-timestamp'),
  setDoc: vi.fn(),
}));

vi.mock('firebase/firestore', () => firestoreMocks);
vi.mock('@/lib/firebase', () => ({ db: {} }));

function emptyTeam(): Pick<Team, 'name' | 'slots' | 'player'> {
  return {
    name: 'Time compartilhado',
    slots: Array.from({ length: 5 }, () => ({
      palId: null,
      passiveIds: [],
      activeSkillIds: [],
      stars: 0,
    })),
    player: { armorId: null, helmetId: null, accessoryIds: [], weaponIds: [], foodIds: [] },
  };
}

describe('share-links', () => {
  beforeEach(() => {
    firestoreMocks.doc.mockClear();
    firestoreMocks.getDoc.mockReset();
    firestoreMocks.serverTimestamp.mockClear();
    firestoreMocks.setDoc.mockReset();
  });

  it('generates an eight-character base62 id', () => {
    expect(generateShortId()).toMatch(/^[A-Za-z0-9]{8}$/);
  });

  it('retries when the generated id already exists', async () => {
    const team = emptyTeam();
    firestoreMocks.getDoc
      .mockResolvedValueOnce({ exists: () => true })
      .mockResolvedValueOnce({ exists: () => false });

    const shortId = await createShortLink({ uid: 'user-1' } as User, team);

    expect(shortId).toMatch(/^[A-Za-z0-9]{8}$/);
    expect(firestoreMocks.getDoc).toHaveBeenCalledTimes(2);
    expect(firestoreMocks.setDoc).toHaveBeenCalledTimes(1);
    expect(firestoreMocks.setDoc.mock.calls[0][1]).toEqual({
      teamData: encodeTeam(team),
      createdBy: 'user-1',
      createdAt: 'server-timestamp',
    });
  });

  it('resolves a valid short link', async () => {
    const team = emptyTeam();
    firestoreMocks.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ teamData: encodeTeam(team) }),
    });

    await expect(resolveShortLink('Ab12xcd3')).resolves.toEqual(team);
  });

  it('returns null for missing, corrupt, or malformed short links', async () => {
    firestoreMocks.getDoc.mockResolvedValueOnce({ exists: () => false });
    await expect(resolveShortLink('Ab12cd34')).resolves.toBeNull();

    firestoreMocks.getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ teamData: 'not-a-team' }),
    });
    await expect(resolveShortLink('Ab12cd34')).resolves.toBeNull();

    await expect(resolveShortLink('too-short')).resolves.toBeNull();
    expect(firestoreMocks.getDoc).toHaveBeenCalledTimes(2);
  });

  it('parses legacy, short, and community share hashes', () => {
    expect(parseShareHash('#team=payload')).toEqual({ kind: 'full', value: 'payload' });
    expect(parseShareHash('#t=Ab12cd34')).toEqual({ kind: 'short', value: 'Ab12cd34' });
    expect(parseShareHash('#p=published_id-123')).toEqual({ kind: 'community', value: 'published_id-123' });
    expect(parseShareHash('#t=short')).toBeNull();
    expect(parseShareHash('#p=')).toBeNull();
    expect(parseShareHash('#other=value')).toBeNull();
  });
});
