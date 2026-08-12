import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { normalizePersistedState } from '@/hooks/useAppState';
import type { PersistedState } from '@/hooks/useAppState';

// One document per user holds the whole app state — the same shape persisted
// in localStorage, so the app works offline and syncs when logged in.
function userStateRef(uid: string) {
  return doc(db, 'users', uid, 'appState', 'state');
}

/** Fetch the user's cloud state, or null when they have none yet. */
export async function fetchCloudState(uid: string): Promise<PersistedState | null> {
  const snap = await getDoc(userStateRef(uid));
  if (!snap.exists()) return null;
  return normalizePersistedState(snap.data());
}

/** Upload the full state (write-through; caller debounces). */
export async function saveCloudState(uid: string, state: PersistedState): Promise<void> {
  await setDoc(userStateRef(uid), { ...state, syncedAt: new Date().toISOString() });
}

/**
 * Subscribe to remote changes (e.g. edits made on another device).
 * Snapshots with pending local writes are skipped to avoid echoing our own
 * upload back into the UI.
 */
export function subscribeCloudState(
  uid: string,
  onChange: (state: PersistedState) => void,
): () => void {
  return onSnapshot(
    userStateRef(uid),
    (snap) => {
      if (snap.metadata.hasPendingWrites || !snap.exists()) return;
      onChange(normalizePersistedState(snap.data()));
    },
    (error) => {
      console.warn('Cloud sync subscription error:', error);
    },
  );
}

interface Versioned {
  id: string;
  updatedAt: string;
}

/** Union of items by id; on conflict the most recently updated item wins. */
function mergeById<T extends Versioned>(local: T[], remote: T[]): T[] {
  const byId = new Map<string, T>();
  for (const item of local) byId.set(item.id, item);
  for (const item of remote) {
    const existing = byId.get(item.id);
    if (!existing || item.updatedAt >= existing.updatedAt) {
      byId.set(item.id, item);
    }
  }
  return [...byId.values()];
}

/**
 * Merge local and remote states. Packages and teams are unioned by id (newest
 * `updatedAt` wins) so work done while logged out is not lost on login.
 * Known limitation: a deletion only propagates to other devices once they
 * sync — a stale device can resurrect a deleted item on merge.
 */
export function mergePersistedStates(
  local: PersistedState,
  remote: PersistedState,
): PersistedState {
  const packages = mergeById(local.packages, remote.packages);
  const teams = mergeById(local.teams, remote.teams);

  const teamIds = new Set(teams.map((t) => t.id));
  const activeTeamId =
    remote.activeTeamId && teamIds.has(remote.activeTeamId)
      ? remote.activeTeamId
      : local.activeTeamId && teamIds.has(local.activeTeamId)
        ? local.activeTeamId
        : (teams[0]?.id ?? null);

  return {
    packages,
    teams,
    activeTeamId,
    theme: remote.theme,
    lastSelectedPalId: remote.lastSelectedPalId,
    currentView: remote.currentView,
    breedingSearchMode: remote.breedingSearchMode,
  };
}
