"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  AppState,
  Assignment,
  Bar,
  DailyBoard,
  LayoutPhoto,
  TVMarker,
} from "./types";
import { buildSeedState } from "./seed";

// Bump this when the seed shape/data changes so returning browsers re-seed
// instead of showing a stale board from a previous version.
const STORAGE_KEY = "gameboard-pro:v5";

export function todayISO(): string {
  // Use local date so the "board day" matches the bar's day.
  const d = new Date();
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
}

/** Today's date (YYYY-MM-DD) in a specific IANA timezone — the bar's day. */
export function todayInZone(tz?: string): string {
  if (!tz) return todayISO();
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return todayISO();
  }
}

const ZONE_ABBREV: Record<string, string> = {
  "America/New_York": "ET",
  "America/Chicago": "CT",
  "America/Denver": "MT",
  "America/Phoenix": "MST",
  "America/Los_Angeles": "PT",
  "America/Anchorage": "AKT",
  "Pacific/Honolulu": "HT",
};

/** Short, bar-friendly timezone label, e.g. "ET". */
export function zoneLabel(tz?: string): string {
  if (!tz) return "";
  if (ZONE_ABBREV[tz]) return ZONE_ABBREV[tz];
  try {
    const part = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "short",
    })
      .formatToParts(new Date())
      .find((p) => p.type === "timeZoneName");
    return part?.value ?? "";
  } catch {
    return "";
  }
}

/** US timezones offered in Bar Setup. */
export const US_TIMEZONES: { value: string; label: string }[] = [
  { value: "America/New_York", label: "Eastern (ET)" },
  { value: "America/Chicago", label: "Central (CT)" },
  { value: "America/Denver", label: "Mountain (MT)" },
  { value: "America/Phoenix", label: "Arizona (MST, no DST)" },
  { value: "America/Los_Angeles", label: "Pacific (PT)" },
  { value: "America/Anchorage", label: "Alaska (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii (HT)" },
];

export function emptyBoard(date: string): DailyBoard {
  return { date, published: false, assignments: [], generalNotes: "" };
}

function uid(prefix = "id"): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

interface StoreContextValue {
  ready: boolean;
  state: AppState;
  activeBar: Bar;
  managerMode: boolean;
  setManagerMode: (on: boolean) => void;
  setActiveBar: (id: string) => void;
  updateBar: (patch: Partial<Bar>) => void;
  // Boards
  getBoard: (date: string) => DailyBoard;
  saveBoard: (board: DailyBoard) => void;
  upsertAssignment: (date: string, a: Assignment) => void;
  removeAssignment: (date: string, id: string) => void;
  duplicateYesterday: (date: string) => void;
  clearBoard: (date: string) => void;
  newAssignmentId: () => string;
  // Layout photos
  updatePhoto: (photoId: string, patch: Partial<LayoutPhoto>) => void;
  addMarker: (photoId: string, marker: Omit<TVMarker, "id">) => void;
  updateMarker: (photoId: string, markerId: string, patch: Partial<TVMarker>) => void;
  removeMarker: (photoId: string, markerId: string) => void;
  resetAll: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => buildSeedState(todayInZone("America/New_York")));
  const [ready, setReady] = useState(false);
  const [managerMode, setManagerMode] = useState(true);

  // Hydrate from localStorage after mount (avoids SSR mismatch).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw));
      const mm = localStorage.getItem(STORAGE_KEY + ":mm");
      if (mm != null) setManagerMode(mm === "1");
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* quota / private mode */
    }
  }, [state, ready]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY + ":mm", managerMode ? "1" : "0");
  }, [managerMode, ready]);

  const activeBar = useMemo(
    () => state.bars.find((b) => b.id === state.activeBarId) ?? state.bars[0],
    [state],
  );

  const setActiveBar = useCallback((id: string) => {
    setState((s) => ({ ...s, activeBarId: id }));
  }, []);

  const updateBar = useCallback((patch: Partial<Bar>) => {
    setState((s) => ({
      ...s,
      bars: s.bars.map((b) => (b.id === s.activeBarId ? { ...b, ...patch } : b)),
    }));
  }, []);

  const getBoard = useCallback(
    (date: string): DailyBoard => {
      const list = state.boards[state.activeBarId] ?? [];
      return list.find((b) => b.date === date) ?? emptyBoard(date);
    },
    [state],
  );

  const saveBoard = useCallback((board: DailyBoard) => {
    setState((s) => {
      const list = s.boards[s.activeBarId] ?? [];
      const exists = list.some((b) => b.date === board.date);
      const next = exists
        ? list.map((b) => (b.date === board.date ? board : b))
        : [...list, board];
      return { ...s, boards: { ...s.boards, [s.activeBarId]: next } };
    });
  }, []);

  const mutateBoard = useCallback(
    (date: string, fn: (b: DailyBoard) => DailyBoard) => {
      setState((s) => {
        const list = s.boards[s.activeBarId] ?? [];
        const current = list.find((b) => b.date === date) ?? emptyBoard(date);
        const updated = fn(current);
        const exists = list.some((b) => b.date === date);
        const next = exists
          ? list.map((b) => (b.date === date ? updated : b))
          : [...list, updated];
        return { ...s, boards: { ...s.boards, [s.activeBarId]: next } };
      });
    },
    [],
  );

  const upsertAssignment = useCallback(
    (date: string, a: Assignment) => {
      mutateBoard(date, (b) => {
        const exists = b.assignments.some((x) => x.id === a.id);
        const assignments = exists
          ? b.assignments.map((x) => (x.id === a.id ? a : x))
          : [...b.assignments, a];
        return { ...b, assignments };
      });
    },
    [mutateBoard],
  );

  const removeAssignment = useCallback(
    (date: string, id: string) => {
      mutateBoard(date, (b) => ({
        ...b,
        assignments: b.assignments.filter((x) => x.id !== id),
      }));
    },
    [mutateBoard],
  );

  const clearBoard = useCallback(
    (date: string) => {
      mutateBoard(date, (b) => ({ ...b, assignments: [], generalNotes: "" }));
    },
    [mutateBoard],
  );

  const duplicateYesterday = useCallback(
    (date: string) => {
      setState((s) => {
        const list = s.boards[s.activeBarId] ?? [];
        // Find the most recent board strictly before `date`.
        const prior = list
          .filter((b) => b.date < date && b.assignments.length > 0)
          .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
        if (!prior) return s;
        const cloned: DailyBoard = {
          date,
          published: false,
          generalNotes: prior.generalNotes,
          assignments: prior.assignments.map((a) => ({
            ...a,
            id: uid("as"),
            confirmed: false,
          })),
        };
        const exists = list.some((b) => b.date === date);
        const next = exists
          ? list.map((b) => (b.date === date ? cloned : b))
          : [...list, cloned];
        return { ...s, boards: { ...s.boards, [s.activeBarId]: next } };
      });
    },
    [],
  );

  const newAssignmentId = useCallback(() => uid("as"), []);

  // ----- Layout photo mutations -----
  const mutatePhoto = useCallback(
    (photoId: string, fn: (p: LayoutPhoto) => LayoutPhoto) => {
      setState((s) => ({
        ...s,
        bars: s.bars.map((b) =>
          b.id === s.activeBarId
            ? {
                ...b,
                layoutPhotos: b.layoutPhotos.map((p) =>
                  p.id === photoId ? fn(p) : p,
                ),
              }
            : b,
        ),
      }));
    },
    [],
  );

  const updatePhoto = useCallback(
    (photoId: string, patch: Partial<LayoutPhoto>) =>
      mutatePhoto(photoId, (p) => ({ ...p, ...patch })),
    [mutatePhoto],
  );

  const addMarker = useCallback(
    (photoId: string, marker: Omit<TVMarker, "id">) =>
      mutatePhoto(photoId, (p) => ({
        ...p,
        markers: [...p.markers, { ...marker, id: uid("mk") }],
      })),
    [mutatePhoto],
  );

  const updateMarker = useCallback(
    (photoId: string, markerId: string, patch: Partial<TVMarker>) =>
      mutatePhoto(photoId, (p) => ({
        ...p,
        markers: p.markers.map((m) =>
          m.id === markerId ? { ...m, ...patch } : m,
        ),
      })),
    [mutatePhoto],
  );

  const removeMarker = useCallback(
    (photoId: string, markerId: string) =>
      mutatePhoto(photoId, (p) => ({
        ...p,
        markers: p.markers.filter((m) => m.id !== markerId),
      })),
    [mutatePhoto],
  );

  const resetAll = useCallback(() => {
    const fresh = buildSeedState(todayInZone("America/New_York"));
    setState(fresh);
  }, []);

  const value: StoreContextValue = {
    ready,
    state,
    activeBar,
    managerMode,
    setManagerMode,
    setActiveBar,
    updateBar,
    getBoard,
    saveBoard,
    upsertAssignment,
    removeAssignment,
    duplicateYesterday,
    clearBoard,
    newAssignmentId,
    updatePhoto,
    addMarker,
    updateMarker,
    removeMarker,
    resetAll,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

/** Sort assignments into the bar's configured TV order (never sequential). */
export function sortByTvOrder<T extends { tvNumber: number }>(
  items: T[],
  tvOrder: number[],
): T[] {
  return [...items].sort((a, b) => {
    const ia = tvOrder.indexOf(a.tvNumber);
    const ib = tvOrder.indexOf(b.tvNumber);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
}
