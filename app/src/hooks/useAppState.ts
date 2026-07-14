import { useState, useEffect, useCallback, useRef } from 'react';
import type { BreedingCombination } from '@/lib/breeding';

export type View = 'breeding' | 'packages' | 'completed' | 'mounts' | 'pals' | 'bossdrops' | 'builds';

export interface Package {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  combinationIds: string[];
  completedCombinationIds: string[];
}

export interface CompletedEntry {
  combinationId: string;
  parentAId: string;
  parentBId: string;
  babyId: string;
  completedAt: string;
}

interface PersistedState {
  packages: Package[];
  completed: CompletedEntry[];
  theme: 'dark' | 'light';
  lastSelectedPalId: string | null;
  currentView: View;
}

const STORAGE_KEY = 'palworld-breeding-manager';

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedState;
      return {
        packages: (parsed.packages || []).map((p: Package) => ({
          ...p,
          completedCombinationIds: p.completedCombinationIds || [],
        })),
        completed: parsed.completed || [],
        theme: parsed.theme || 'dark',
        lastSelectedPalId: parsed.lastSelectedPalId || null,
        currentView: parsed.currentView || 'breeding',
      };
    }
  } catch {
    // ignore
  }
  return {
    packages: [],
    completed: [],
    theme: 'dark',
    lastSelectedPalId: null,
    currentView: 'breeding',
  };
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
  completed: CompletedEntry[];
  theme: 'dark' | 'light';

  setView: (view: View) => void;
  selectPal: (palId: string | null) => void;
  toggleTheme: () => void;
  addPackage: (pkg: Omit<Package, 'id' | 'createdAt' | 'updatedAt' | 'completedCombinationIds'>) => string;
  deletePackage: (id: string) => void;
  addToPackage: (packageId: string, combinationId: string) => void;
  removeFromPackage: (packageId: string, combinationId: string) => void;
  markCompleted: (combination: BreedingCombination) => void;
  unmarkCompleted: (combinationId: string) => void;
  isCompleted: (combinationId: string) => boolean;
  isInPackage: (combinationId: string) => boolean;
  toggleCompleteInPackage: (packageId: string, combinationId: string) => void;
  moveCombinationUp: (packageId: string, combinationId: string) => void;
  moveCombinationDown: (packageId: string, combinationId: string) => void;
  editPackage: (id: string, name: string, description?: string) => void;
}

export function useAppState(): AppState {
  const [state, setState] = useState<PersistedState>(loadState);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist to localStorage with debounce
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      saveState(state);
    }, 500);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [state]);

  const setView = useCallback((view: View) => {
    setState((s) => ({ ...s, currentView: view }));
  }, []);

  const selectPal = useCallback((palId: string | null) => {
    setState((s) => ({ ...s, lastSelectedPalId: palId }));
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

  const markCompleted = useCallback((combination: BreedingCombination) => {
    const entry: CompletedEntry = {
      combinationId: combination.id,
      parentAId: combination.parentA.id,
      parentBId: combination.parentB.id,
      babyId: combination.baby.id,
      completedAt: new Date().toISOString(),
    };
    setState((s) => ({
      ...s,
      completed: [...s.completed, entry],
    }));
  }, []);

  const unmarkCompleted = useCallback((combinationId: string) => {
    setState((s) => ({
      ...s,
      completed: s.completed.filter((c) => c.combinationId !== combinationId),
    }));
  }, []);

  const isCompleted = useCallback(
    (combinationId: string) => {
      return state.completed.some((c) => c.combinationId === combinationId);
    },
    [state.completed],
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
    completed: state.completed,
    theme: state.theme,
    setView,
    selectPal,
    toggleTheme,
    addPackage,
    deletePackage,
    addToPackage,
    removeFromPackage,
    markCompleted,
    unmarkCompleted,
    isCompleted,
    isInPackage,
    toggleCompleteInPackage,
    moveCombinationUp,
    moveCombinationDown,
    editPackage,
  };
}
