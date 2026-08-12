import { useState, useEffect, useCallback, useRef } from 'react';
import { useOptionalAuth } from '@/hooks/useAuth';
import {
  fetchCloudState,
  saveCloudState,
  subscribeCloudState,
  mergePersistedStates,
} from '@/lib/cloud-sync';

export type View = 'breeding' | 'packages' | 'team' | 'mounts' | 'pals' | 'bossdrops' | 'builds' | 'crafting' | 'privacy' | 'about';

export type SearchMode = 'child' | 'parent' | 'tree';

export interface Package {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  combinationIds: string[];
  completedCombinationIds: string[];
  /** Set when the package was created from a breeding tree — enables "View Tree" */
  treeTargetPalId?: string;
}

export interface TeamSlot {
  palId: string | null;
  passiveIds: string[];
  activeSkillIds: string[];
  /** Pal condensation level, 0-4 */
  stars: number;
}

export interface PlayerGear {
  armorId: string | null;
  helmetId: string | null;
  accessoryIds: string[];
  weaponIds: string[];
  foodIds: string[];
}

export interface Team {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  /** Always 5 slots */
  slots: TeamSlot[];
  player: PlayerGear;
}

export const TEAM_SIZE = 5;
export const MAX_SLOT_PASSIVES = 4;
export const MAX_SLOT_ACTIVE_SKILLS = 3;
export const MAX_PLAYER_ACCESSORIES = 4;
export const MAX_PLAYER_WEAPONS = 6;
export const MAX_PLAYER_FOODS = 3;

function emptySlot(): TeamSlot {
  return { palId: null, passiveIds: [], activeSkillIds: [], stars: 0 };
}

function emptyPlayerGear(): PlayerGear {
  return { armorId: null, helmetId: null, accessoryIds: [], weaponIds: [], foodIds: [] };
}

export interface PersistedState {
  packages: Package[];
  teams: Team[];
  activeTeamId: string | null;
  theme: 'dark' | 'light';
  lastSelectedPalId: string | null;
  currentView: View;
  breedingSearchMode: SearchMode;
}

const STORAGE_KEY = 'palworld-breeding-manager';

const VALID_VIEWS: View[] = [
  'breeding',
  'packages',
  'team',
  'mounts',
  'pals',
  'bossdrops',
  'builds',
  'crafting',
  'privacy',
  'about',
];

function isValidView(value: unknown): value is View {
  return typeof value === 'string' && (VALID_VIEWS as string[]).includes(value);
}

const VALID_SEARCH_MODES: SearchMode[] = ['child', 'parent', 'tree'];

function isValidSearchMode(value: unknown): value is SearchMode {
  return typeof value === 'string' && (VALID_SEARCH_MODES as string[]).includes(value);
}

export function normalizePersistedState(parsed: Partial<PersistedState>): PersistedState {
  return {
    packages: (parsed.packages || []).map((p: Package) => ({
      ...p,
      completedCombinationIds: p.completedCombinationIds || [],
    })),
    teams: (parsed.teams || []).map((t: Team) => {
      // migrate legacy player gear shape ({ weaponId } -> { weaponIds }, + helmetId)
      const legacy = (t.player || {}) as PlayerGear & { weaponId?: string | null };
      return {
        ...t,
        slots: (t.slots || []).map((slot) => ({
          ...slot,
          passiveIds: slot.passiveIds ?? [],
          activeSkillIds: slot.activeSkillIds ?? [],
          stars: slot.stars ?? 0,
        })),
        player: {
          armorId: legacy.armorId ?? null,
          helmetId: legacy.helmetId ?? null,
          accessoryIds: legacy.accessoryIds ?? [],
          weaponIds: legacy.weaponIds ?? (legacy.weaponId ? [legacy.weaponId] : []),
          foodIds: legacy.foodIds ?? [],
        },
      };
    }),
    activeTeamId: parsed.activeTeamId || null,
    theme: parsed.theme || 'dark',
    lastSelectedPalId: parsed.lastSelectedPalId || null,
    currentView: isValidView(parsed.currentView) ? parsed.currentView : 'breeding',
    breedingSearchMode: isValidSearchMode(parsed.breedingSearchMode)
      ? parsed.breedingSearchMode
      : 'child',
  };
}

function emptyPersistedState(): PersistedState {
  return {
    packages: [],
    teams: [],
    activeTeamId: null,
    theme: 'dark',
    lastSelectedPalId: null,
    currentView: 'breeding',
    breedingSearchMode: 'child',
  };
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return normalizePersistedState(JSON.parse(raw) as Partial<PersistedState>);
    }
  } catch {
    // ignore
  }
  return emptyPersistedState();
}

function saveState(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

export interface AppState {
  currentView: View;
  selectedPalId: string | null;
  packages: Package[];
  teams: Team[];
  activeTeamId: string | null;
  theme: 'dark' | 'light';
  searchMode: SearchMode;

  setView: (view: View) => void;
  selectPal: (palId: string | null) => void;
  setSearchMode: (mode: SearchMode) => void;
  toggleTheme: () => void;
  addPackage: (pkg: Omit<Package, 'id' | 'createdAt' | 'updatedAt' | 'completedCombinationIds'>) => string;
  deletePackage: (id: string) => void;
  addToPackage: (packageId: string, combinationId: string) => void;
  removeFromPackage: (packageId: string, combinationId: string) => void;
  isInPackage: (combinationId: string) => boolean;
  toggleCompleteInPackage: (packageId: string, combinationId: string) => void;
  moveCombinationUp: (packageId: string, combinationId: string) => void;
  moveCombinationDown: (packageId: string, combinationId: string) => void;
  editPackage: (id: string, name: string, description?: string) => void;
  addTeam: (name: string) => string;
  importTeam: (data: { name: string; slots: TeamSlot[]; player: PlayerGear }) => string;
  deleteTeam: (id: string) => void;
  renameTeam: (id: string, name: string) => void;
  setActiveTeam: (id: string) => void;
  setSlotPal: (teamId: string, slotIndex: number, palId: string | null) => void;
  setSlotStars: (teamId: string, slotIndex: number, stars: number) => void;
  toggleSlotPassive: (teamId: string, slotIndex: number, passiveId: string) => void;
  toggleSlotActiveSkill: (teamId: string, slotIndex: number, activeSkillId: string) => void;
  setPlayerGearItem: (teamId: string, slot: 'armorId' | 'helmetId', gearId: string | null) => void;
  togglePlayerWeapon: (teamId: string, gearId: string) => void;
  togglePlayerAccessory: (teamId: string, gearId: string) => void;
  togglePlayerFood: (teamId: string, gearId: string) => void;
}

export function useAppState(): AppState {
  const [state, setState] = useState<PersistedState>(loadState);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const authState = useOptionalAuth();
  const uid = authState?.user?.uid ?? null;
  // Set once the initial cloud load/merge for this uid finished; until
  // then nothing is pushed, so a slow network cannot overwrite cloud data.
  const syncedUidRef = useRef<string | null>(null);

  // Persist to localStorage with debounce; when logged in and the initial
  // cloud sync has settled, also write through to Firestore.
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      saveState(state);
      if (syncedUidRef.current) {
        saveCloudState(syncedUidRef.current, state).catch((error) => {
          console.warn('Cloud sync save failed:', error);
        });
      }
    }, 500);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [state]);

  // On login: merge the cloud state into the local one (or upload the
  // local state on first login) and subscribe to edits from other devices.
  useEffect(() => {
    if (!uid) {
      syncedUidRef.current = null;
      return;
    }
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    const applyRemote = (remote: PersistedState) => {
      setState((local) => {
        const merged = mergePersistedStates(local, remote);
        // Nothing new — keep the same reference to avoid an echo write.
        return JSON.stringify(merged) === JSON.stringify(local) ? local : merged;
      });
    };

    void (async () => {
      try {
        const remote = await fetchCloudState(uid);
        if (cancelled) return;
        if (remote) {
          applyRemote(remote);
        } else {
          // First login ever: upload the current local state.
          await saveCloudState(uid, stateRef.current);
        }
        if (cancelled) return;
        syncedUidRef.current = uid;
        unsubscribe = subscribeCloudState(uid, applyRemote);
      } catch (error) {
        console.warn('Cloud sync init failed:', error);
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [uid]);

  const setView = useCallback((view: View) => {
    setState((s) => ({ ...s, currentView: view }));
  }, []);

  const selectPal = useCallback((palId: string | null) => {
    setState((s) => ({ ...s, lastSelectedPalId: palId }));
  }, []);

  const setSearchMode = useCallback((mode: SearchMode) => {
    setState((s) => ({ ...s, breedingSearchMode: mode }));
  }, []);

  const toggleTheme = useCallback(() => {
    setState((s) => ({
      ...s,
      theme: s.theme === 'dark' ? 'light' : 'dark',
    }));
  }, []);

  const addPackage = useCallback(
    (pkg: Omit<Package, 'id' | 'createdAt' | 'updatedAt' | 'completedCombinationIds'>): string => {
      const id = `pkg-${Date.now()}-${crypto.randomUUID()}`;
      const now = new Date().toISOString();
      setState((s) => ({
        ...s,
        packages: [
          ...s.packages,
          { ...pkg, id, createdAt: now, updatedAt: now, completedCombinationIds: [] },
        ],
      }));
      return id;
    },
    [],
  );

  const deletePackage = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      packages: s.packages.filter((p) => p.id !== id),
    }));
  }, []);

  const addToPackage = useCallback((packageId: string, combinationId: string) => {
    setState((s) => ({
      ...s,
      packages: s.packages.map((p) =>
        p.id === packageId && !p.combinationIds.includes(combinationId)
          ? {
              ...p,
              combinationIds: [...p.combinationIds, combinationId],
              updatedAt: new Date().toISOString(),
            }
          : p,
      ),
    }));
  }, []);

  const removeFromPackage = useCallback(
    (packageId: string, combinationId: string) => {
      setState((s) => ({
        ...s,
        packages: s.packages.map((p) =>
          p.id === packageId
            ? {
                ...p,
                combinationIds: p.combinationIds.filter(
                  (cid) => cid !== combinationId,
                ),
                updatedAt: new Date().toISOString(),
              }
            : p,
        ),
      }));
    },
    [],
  );

  const addTeam = useCallback((name: string): string => {
    const id = `team-${Date.now()}-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    setState((s) => ({
      ...s,
      teams: [
        ...s.teams,
        {
          id,
          name,
          createdAt: now,
          updatedAt: now,
          slots: Array.from({ length: TEAM_SIZE }, emptySlot),
          player: emptyPlayerGear(),
        },
      ],
      activeTeamId: id,
    }));
    return id;
  }, []);

  const importTeam = useCallback(
    (data: { name: string; slots: TeamSlot[]; player: PlayerGear }): string => {
      const id = `team-${Date.now()}-${crypto.randomUUID()}`;
      const now = new Date().toISOString();
      setState((s) => ({
        ...s,
        teams: [
          ...s.teams,
          {
            id,
            name: data.name,
            createdAt: now,
            updatedAt: now,
            slots: data.slots,
            player: data.player,
          },
        ],
        activeTeamId: id,
      }));
      return id;
    },
    [],
  );

  const deleteTeam = useCallback((id: string) => {
    setState((s) => {
      const teams = s.teams.filter((t) => t.id !== id);
      return {
        ...s,
        teams,
        activeTeamId:
          s.activeTeamId === id ? (teams[0]?.id ?? null) : s.activeTeamId,
      };
    });
  }, []);

  const renameTeam = useCallback((id: string, name: string) => {
    setState((s) => ({
      ...s,
      teams: s.teams.map((t) =>
        t.id === id ? { ...t, name, updatedAt: new Date().toISOString() } : t,
      ),
    }));
  }, []);

  const setActiveTeam = useCallback((id: string) => {
    setState((s) => ({ ...s, activeTeamId: id }));
  }, []);

  const updateTeam = useCallback(
    (teamId: string, updater: (team: Team) => Team) => {
      setState((s) => ({
        ...s,
        teams: s.teams.map((t) =>
          t.id === teamId
            ? { ...updater(t), updatedAt: new Date().toISOString() }
            : t,
        ),
      }));
    },
    [],
  );

  const setSlotPal = useCallback(
    (teamId: string, slotIndex: number, palId: string | null) => {
      updateTeam(teamId, (t) => ({
        ...t,
        slots: t.slots.map((slot, i) =>
          i === slotIndex
            ? palId
              ? { ...slot, palId }
              : emptySlot()
            : slot,
        ),
      }));
    },
    [updateTeam],
  );

  const setSlotStars = useCallback(
    (teamId: string, slotIndex: number, stars: number) => {
      updateTeam(teamId, (t) => ({
        ...t,
        slots: t.slots.map((slot, i) =>
          i === slotIndex
            ? { ...slot, stars: Math.max(0, Math.min(4, stars)) }
            : slot,
        ),
      }));
    },
    [updateTeam],
  );

  const toggleSlotPassive = useCallback(
    (teamId: string, slotIndex: number, passiveId: string) => {
      updateTeam(teamId, (t) => ({
        ...t,
        slots: t.slots.map((slot, i) => {
          if (i !== slotIndex) return slot;
          if (slot.passiveIds.includes(passiveId)) {
            return {
              ...slot,
              passiveIds: slot.passiveIds.filter((id) => id !== passiveId),
            };
          }
          if (slot.passiveIds.length >= MAX_SLOT_PASSIVES) return slot;
          return { ...slot, passiveIds: [...slot.passiveIds, passiveId] };
        }),
      }));
    },
    [updateTeam],
  );

  const toggleSlotActiveSkill = useCallback(
    (teamId: string, slotIndex: number, activeSkillId: string) => {
      updateTeam(teamId, (t) => ({
        ...t,
        slots: t.slots.map((slot, i) => {
          if (i !== slotIndex) return slot;
          if (slot.activeSkillIds.includes(activeSkillId)) {
            return {
              ...slot,
              activeSkillIds: slot.activeSkillIds.filter((id) => id !== activeSkillId),
            };
          }
          if (slot.activeSkillIds.length >= MAX_SLOT_ACTIVE_SKILLS) return slot;
          return { ...slot, activeSkillIds: [...slot.activeSkillIds, activeSkillId] };
        }),
      }));
    },
    [updateTeam],
  );

  const setPlayerGearItem = useCallback(
    (teamId: string, slot: 'armorId' | 'helmetId', gearId: string | null) => {
      updateTeam(teamId, (t) => ({
        ...t,
        player: { ...t.player, [slot]: gearId },
      }));
    },
    [updateTeam],
  );

  const togglePlayerWeapon = useCallback(
    (teamId: string, gearId: string) => {
      updateTeam(teamId, (t) => {
        const current = t.player.weaponIds;
        const weaponIds = current.includes(gearId)
          ? current.filter((id) => id !== gearId)
          : current.length >= MAX_PLAYER_WEAPONS
            ? current
            : [...current, gearId];
        return { ...t, player: { ...t.player, weaponIds } };
      });
    },
    [updateTeam],
  );

  const togglePlayerAccessory = useCallback(
    (teamId: string, gearId: string) => {
      updateTeam(teamId, (t) => {
        const current = t.player.accessoryIds;
        const accessoryIds = current.includes(gearId)
          ? current.filter((id) => id !== gearId)
          : current.length >= MAX_PLAYER_ACCESSORIES
            ? current
            : [...current, gearId];
        return { ...t, player: { ...t.player, accessoryIds } };
      });
    },
    [updateTeam],
  );

  const togglePlayerFood = useCallback(
    (teamId: string, gearId: string) => {
      updateTeam(teamId, (t) => {
        const current = t.player.foodIds;
        const foodIds = current.includes(gearId)
          ? current.filter((id) => id !== gearId)
          : current.length >= MAX_PLAYER_FOODS
            ? current
            : [...current, gearId];
        return { ...t, player: { ...t.player, foodIds } };
      });
    },
    [updateTeam],
  );

  const isInPackage = useCallback(
    (combinationId: string) => {
      return state.packages.some((p) =>
        p.combinationIds.includes(combinationId),
      );
    },
    [state.packages],
  );

  const toggleCompleteInPackage = useCallback((packageId: string, combinationId: string) => {
    setState((s) => ({
      ...s,
      packages: s.packages.map((p) => {
        if (p.id !== packageId) return p;
        const isCompleted = p.completedCombinationIds.includes(combinationId);
        return {
          ...p,
          completedCombinationIds: isCompleted
            ? p.completedCombinationIds.filter((id) => id !== combinationId)
            : [...p.completedCombinationIds, combinationId],
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  }, []);

  const moveCombinationUp = useCallback((packageId: string, combinationId: string) => {
    setState((s) => ({
      ...s,
      packages: s.packages.map((p) => {
        if (p.id !== packageId) return p;
        const idx = p.combinationIds.indexOf(combinationId);
        if (idx <= 0) return p;
        const newIds = [...p.combinationIds];
        [newIds[idx - 1], newIds[idx]] = [newIds[idx], newIds[idx - 1]];
        return { ...p, combinationIds: newIds, updatedAt: new Date().toISOString() };
      }),
    }));
  }, []);

  const moveCombinationDown = useCallback((packageId: string, combinationId: string) => {
    setState((s) => ({
      ...s,
      packages: s.packages.map((p) => {
        if (p.id !== packageId) return p;
        const idx = p.combinationIds.indexOf(combinationId);
        if (idx === -1 || idx >= p.combinationIds.length - 1) return p;
        const newIds = [...p.combinationIds];
        [newIds[idx], newIds[idx + 1]] = [newIds[idx + 1], newIds[idx]];
        return { ...p, combinationIds: newIds, updatedAt: new Date().toISOString() };
      }),
    }));
  }, []);

  const editPackage = useCallback((id: string, name: string, description?: string) => {
    setState((s) => ({
      ...s,
      packages: s.packages.map((p) =>
        p.id === id
          ? { ...p, name, description, updatedAt: new Date().toISOString() }
          : p,
      ),
    }));
  }, []);

  return {
    currentView: state.currentView,
    selectedPalId: state.lastSelectedPalId,
    packages: state.packages,
    teams: state.teams,
    activeTeamId: state.activeTeamId,
    theme: state.theme,
    searchMode: state.breedingSearchMode,
    setView,
    selectPal,
    setSearchMode,
    toggleTheme,
    addPackage,
    deletePackage,
    addToPackage,
    removeFromPackage,
    isInPackage,
    toggleCompleteInPackage,
    moveCombinationUp,
    moveCombinationDown,
    editPackage,
    addTeam,
    importTeam,
    deleteTeam,
    renameTeam,
    setActiveTeam,
    setSlotPal,
    setSlotStars,
    toggleSlotPassive,
    toggleSlotActiveSkill,
    setPlayerGearItem,
    togglePlayerWeapon,
    togglePlayerAccessory,
    togglePlayerFood,
  };
}
