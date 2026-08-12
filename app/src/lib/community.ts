import type { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SKILL_CATEGORIES } from '@/data/partnerSkills';
import type { SkillCategory } from '@/data/partnerSkills';
import { encodeTeam } from '@/lib/team-share';
import type { Team } from '@/hooks/useAppState';

export type VoteValue = 1 | -1;

export const MAX_PUBLICATIONS = 5;
export const MAX_DESCRIPTION_LENGTH = 60;
export const MAX_PUBLICATION_TAGS = 3;
export const MIN_NICK_LENGTH = 3;
export const MAX_NICK_LENGTH = 20;

export interface UserProfile {
  nick: string;
}

export interface PublishedTeam {
  id: string;
  authorUid: string;
  authorNick: string;
  teamName: string;
  description: string;
  tags: SkillCategory[];
  teamData: string;
  likes: number;
  dislikes: number;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface PublicationInput {
  teamName?: string;
  description: string;
  tags: readonly string[];
}

export interface VoteTransition {
  next: VoteValue | null;
  likesDelta: number;
  dislikesDelta: number;
}

export type CommunityErrorCode =
  | 'AUTH_REQUIRED'
  | 'NICK_REQUIRED'
  | 'INVALID_NICK'
  | 'INVALID_NAME'
  | 'INVALID_DESCRIPTION'
  | 'INVALID_TAGS'
  | 'LIMIT_REACHED'
  | 'NOT_FOUND';

export class CommunityError extends Error {
  readonly code: CommunityErrorCode;

  constructor(code: CommunityErrorCode, message = code) {
    super(message);
    this.name = 'CommunityError';
    this.code = code;
  }
}

const skillCategorySet = new Set<string>(SKILL_CATEGORIES);

function isSkillCategory(value: string): value is SkillCategory {
  return skillCategorySet.has(value);
}

export function validateNick(value: string): string {
  const nick = value.trim();
  if (nick.length < MIN_NICK_LENGTH || nick.length > MAX_NICK_LENGTH) {
    throw new CommunityError('INVALID_NICK');
  }
  return nick;
}

/** Validates and normalizes the public fields before they reach Firestore. */
export function validatePublicationInput(input: PublicationInput): {
  teamName?: string;
  description: string;
  tags: SkillCategory[];
} {
  const teamName = input.teamName?.trim();
  if (input.teamName !== undefined && (!teamName || teamName.length > 50)) {
    throw new CommunityError('INVALID_NAME');
  }

  const description = input.description.trim();
  if (!description || description.length > MAX_DESCRIPTION_LENGTH) {
    throw new CommunityError('INVALID_DESCRIPTION');
  }

  const tags = [...new Set(input.tags)];
  if (
    tags.length === 0 ||
    tags.length > MAX_PUBLICATION_TAGS ||
    tags.some((tag) => !isSkillCategory(tag))
  ) {
    throw new CommunityError('INVALID_TAGS');
  }

  return {
    ...(teamName ? { teamName } : {}),
    description,
    tags: tags as SkillCategory[],
  };
}

export function assertPublicationLimit(count: number): void {
  if (count >= MAX_PUBLICATIONS) {
    throw new CommunityError('LIMIT_REACHED');
  }
}

/** Calculates the denormalized counter change for one vote click. */
export function getVoteTransition(current: VoteValue | null, selected: VoteValue): VoteTransition {
  if (current === selected) {
    return {
      next: null,
      likesDelta: selected === 1 ? -1 : 0,
      dislikesDelta: selected === -1 ? -1 : 0,
    };
  }

  return {
    next: selected,
    likesDelta: (selected === 1 ? 1 : 0) + (current === 1 ? -1 : 0),
    dislikesDelta: (selected === -1 ? 1 : 0) + (current === -1 ? -1 : 0),
  };
}

function publicationsCollection() {
  return collection(db, 'publishedTeams');
}

function publicationRef(publishId: string) {
  return doc(db, 'publishedTeams', publishId);
}

function publicationControlRef(uid: string, publishId: string) {
  return doc(db, 'users', uid, 'publications', publishId);
}

function profileRef(uid: string) {
  return doc(db, 'users', uid, 'profile', 'main');
}

function voteRef(publishId: string, uid: string) {
  return doc(db, 'publishedTeams', publishId, 'votes', uid);
}

function timestampToDate(value: unknown): Date | null {
  if (value && typeof value === 'object' && 'toDate' in value) {
    const toDate = (value as { toDate?: unknown }).toDate;
    if (typeof toDate === 'function') return toDate.call(value) as Date;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function publishedTeamFromData(id: string, data: DocumentData): PublishedTeam | null {
  if (
    typeof data.authorUid !== 'string' ||
    typeof data.teamName !== 'string' ||
    typeof data.description !== 'string' ||
    typeof data.teamData !== 'string'
  ) {
    return null;
  }

  const tags = Array.isArray(data.tags)
    ? data.tags.filter((tag: unknown): tag is SkillCategory => typeof tag === 'string' && isSkillCategory(tag))
    : [];

  return {
    id,
    authorUid: data.authorUid,
    authorNick: typeof data.authorNick === 'string' ? data.authorNick : 'Palworld player',
    teamName: data.teamName,
    description: data.description,
    tags: tags.slice(0, MAX_PUBLICATION_TAGS),
    teamData: data.teamData,
    likes: typeof data.likes === 'number' ? Math.max(0, data.likes) : 0,
    dislikes: typeof data.dislikes === 'number' ? Math.max(0, data.dislikes) : 0,
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
  };
}

function requireAuth(user: User | null | undefined): asserts user is User {
  if (!user) throw new CommunityError('AUTH_REQUIRED');
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(profileRef(uid));
  if (!snapshot.exists()) return null;
  const nick = (snapshot.data() as Record<string, unknown>).nick;
  return typeof nick === 'string' && nick.trim() ? { nick: nick.trim() } : null;
}

export async function saveUserNick(uid: string, nick: string): Promise<string> {
  const normalizedNick = validateNick(nick);
  await setDoc(profileRef(uid), { nick: normalizedNick, updatedAt: serverTimestamp() }, { merge: true });
  return normalizedNick;
}

/** Counts the control documents, which are created and removed with a publication. */
export async function countPublications(uid: string): Promise<number> {
  const snapshot = await getDocs(collection(db, 'users', uid, 'publications'));
  return snapshot.size;
}

export async function publishTeam(
  user: User | null | undefined,
  team: Team,
  input: PublicationInput,
): Promise<string> {
  requireAuth(user);
  const profile = await getUserProfile(user.uid);
  if (!profile) throw new CommunityError('NICK_REQUIRED');

  const fields = validatePublicationInput({ ...input, teamName: input.teamName ?? team.name });
  const currentCount = await countPublications(user.uid);
  assertPublicationLimit(currentCount);

  const publication = doc(publicationsCollection());
  const batch = writeBatch(db);
  const now = serverTimestamp();
  batch.set(publication, {
    authorUid: user.uid,
    authorNick: profile.nick,
    teamName: fields.teamName ?? team.name.trim(),
    description: fields.description,
    tags: fields.tags,
    teamData: encodeTeam(team),
    likes: 0,
    dislikes: 0,
    createdAt: now,
    updatedAt: now,
  });
  batch.set(publicationControlRef(user.uid, publication.id), {
    publishId: publication.id,
    authorUid: user.uid,
    createdAt: now,
  });
  await batch.commit();
  return publication.id;
}

export async function getPublication(publishId: string): Promise<PublishedTeam | null> {
  const snapshot = await getDoc(publicationRef(publishId));
  if (!snapshot.exists()) return null;
  return publishedTeamFromData(snapshot.id, snapshot.data());
}

export async function updatePublication(
  publishId: string,
  input: PublicationInput & { teamData?: string },
): Promise<void> {
  const fields = validatePublicationInput(input);
  await updateDoc(publicationRef(publishId), {
    ...(fields.teamName ? { teamName: fields.teamName } : {}),
    description: fields.description,
    tags: fields.tags,
    ...(input.teamData ? { teamData: input.teamData } : {}),
    updatedAt: serverTimestamp(),
  });
}

export async function unpublishTeam(publishId: string): Promise<void> {
  const publication = await getDoc(publicationRef(publishId));
  if (!publication.exists()) return;
  const authorUid = (publication.data() as Record<string, unknown>).authorUid;
  if (typeof authorUid !== 'string') throw new CommunityError('NOT_FOUND');

  const votes = await getDocs(collection(db, 'publishedTeams', publishId, 'votes'));
  const refs = [
    ...votes.docs.map((vote) => vote.ref),
    publication.ref,
    publicationControlRef(authorUid, publishId),
  ];

  for (let start = 0; start < refs.length; start += 400) {
    const batch = writeBatch(db);
    refs.slice(start, start + 400).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

export async function listMyPublications(uid: string): Promise<PublishedTeam[]> {
  const snapshot = await getDocs(
    query(
      publicationsCollection(),
      where('authorUid', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(50),
    ),
  );
  return snapshot.docs
    .map((item) => publishedTeamFromData(item.id, item.data()))
    .filter((item): item is PublishedTeam => item !== null);
}

export function subscribeCommunityTeams(
  callback: (teams: PublishedTeam[], error?: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(publicationsCollection(), orderBy('createdAt', 'desc'), limit(50)),
    (snapshot) => {
      const teams = snapshot.docs
        .map((item) => publishedTeamFromData(item.id, item.data()))
        .filter((item): item is PublishedTeam => item !== null);
      callback(teams);
    },
    (error) => callback([], error),
  );
}

export async function getMyVote(publishId: string, uid: string): Promise<VoteValue | null> {
  const snapshot = await getDoc(voteRef(publishId, uid));
  if (!snapshot.exists()) return null;
  const value = (snapshot.data() as Record<string, unknown>).value;
  return value === 1 || value === -1 ? value : null;
}

export async function vote(publishId: string, uid: string, selected: VoteValue): Promise<VoteValue | null> {
  return runTransaction(db, async (transaction) => {
    const teamSnapshot = await transaction.get(publicationRef(publishId));
    if (!teamSnapshot.exists()) throw new CommunityError('NOT_FOUND');
    const currentVoteSnapshot = await transaction.get(voteRef(publishId, uid));
    const currentValue = currentVoteSnapshot.exists() &&
      (currentVoteSnapshot.data().value === 1 || currentVoteSnapshot.data().value === -1)
      ? currentVoteSnapshot.data().value as VoteValue
      : null;
    const transition = getVoteTransition(currentValue, selected);
    const currentData = teamSnapshot.data();

    transaction.update(publicationRef(publishId), {
      likes: Math.max(0, (typeof currentData.likes === 'number' ? currentData.likes : 0) + transition.likesDelta),
      dislikes: Math.max(0, (typeof currentData.dislikes === 'number' ? currentData.dislikes : 0) + transition.dislikesDelta),
      updatedAt: serverTimestamp(),
    });
    if (transition.next === null) {
      transaction.delete(voteRef(publishId, uid));
    } else {
      transaction.set(voteRef(publishId, uid), { value: transition.next, updatedAt: serverTimestamp() });
    }
    return transition.next;
  });
}

/** Removes a stale local link when a publication was deleted elsewhere. */
export async function publicationExists(publishId: string): Promise<boolean> {
  const snapshot = await getDoc(publicationRef(publishId));
  return snapshot.exists();
}

// Kept as a small wrapper so callers that only need a write can tree-shake the
// larger publication helpers without knowing Firestore's document paths.
export async function deletePublicationControl(uid: string, publishId: string): Promise<void> {
  await deleteDoc(publicationControlRef(uid, publishId));
}
