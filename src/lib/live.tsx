"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ScheduleEvent, ScheduleResponse } from "./schedule/types";
import { useStore, todayInZone } from "./store";

interface LiveValue {
  source: "live" | "seed" | null;
  fetchedAt?: string;
  byId: Map<string, ScheduleEvent>;
  byName: Map<string, ScheduleEvent>;
  all: ScheduleEvent[];
  /** Look up the live record for an assignment by event id, then by name. */
  lookup: (eventId?: string, name?: string) => ScheduleEvent | undefined;
  refresh: () => void;
}

const LiveContext = createContext<LiveValue | null>(null);

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Fetches today's schedule once (and polls) so the board/staff can show live
 *  status without every card fetching on its own. */
export function LiveScheduleProvider({ children }: { children: React.ReactNode }) {
  const { activeBar } = useStore();
  const today = todayInZone(activeBar.timezone);
  const [data, setData] = useState<ScheduleResponse | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/schedule?date=${today}`, { cache: "no-store" });
      setData(await res.json());
    } catch {
      /* keep last good data */
    }
  }, [today]);

  useEffect(() => {
    load();
    timer.current = setInterval(load, 60000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [load]);

  const value = useMemo<LiveValue>(() => {
    const byId = new Map<string, ScheduleEvent>();
    const byName = new Map<string, ScheduleEvent>();
    for (const e of data?.events ?? []) {
      byId.set(e.id, e);
      byName.set(norm(e.name), e);
    }
    const lookup = (eventId?: string, name?: string) => {
      if (eventId && byId.has(eventId)) return byId.get(eventId);
      if (name && byName.has(norm(name))) return byName.get(norm(name));
      return undefined;
    };
    return {
      source: data?.source ?? null,
      fetchedAt: data?.fetchedAt,
      byId,
      byName,
      all: data?.events ?? [],
      lookup,
      refresh: load,
    };
  }, [data, load]);

  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

/** Returns the live context, or null if not inside a provider (e.g. print). */
export function useLive(): LiveValue | null {
  return useContext(LiveContext);
}
