import {
  ESPN_LEAGUES,
  normalizeEspnEvent,
  type ScheduleEvent,
  type ScheduleResponse,
} from "./types";
import { seedSchedule, DEMO_DATE } from "./seed";
import { worldCupForDate } from "./worldcup";
import { specialForDate } from "./special";

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports";

async function fetchLeague(
  path: string,
  display: string,
  sport: string,
  yyyymmdd: string,
): Promise<ScheduleEvent[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(`${ESPN_BASE}/${path}/scoreboard?dates=${yyyymmdd}`, {
      signal: controller.signal,
      cache: "no-store",
      headers: { "User-Agent": "GameBoardPro/1.0" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const events = (data.events ?? []) as unknown[];
    return events
      .map((e) => normalizeEspnEvent(e, { sport, display }))
      .filter((e): e is ScheduleEvent => e !== null);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

/** Assemble the full schedule for a date: live ESPN feed (fallback to seed /
 *  World Cup) plus always-merged special events. Shared by the schedule API and
 *  the email/cron path so both build the same board. */
export async function assembleSchedule(date: string): Promise<ScheduleResponse> {
  const yyyymmdd = date.replace(/-/g, "");
  const results = await Promise.allSettled(
    ESPN_LEAGUES.map((l) => fetchLeague(l.path, l.display, l.sport, yyyymmdd)),
  );
  const live = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

  const useLive = live.length > 0;
  const fallback =
    date === DEMO_DATE
      ? seedSchedule(date)
      : [...seedSchedule(date), ...worldCupForDate(date)];
  const base = useLive ? live : fallback;
  const names = new Set(base.map((e) => e.name.toLowerCase()));
  const specials = specialForDate(date).filter((s) => !names.has(s.name.toLowerCase()));
  const events = [...base, ...specials];

  const rank = (s: string) => (s === "in" || s === "delayed" ? 0 : s === "pre" ? 1 : 2);
  events.sort((a, b) => {
    const r = rank(a.status.state) - rank(b.status.state);
    return r !== 0 ? r : a.startUtc.localeCompare(b.startUtc);
  });

  return {
    source: useLive ? "live" : "seed",
    date,
    fetchedAt: new Date().toISOString(),
    events,
  };
}
