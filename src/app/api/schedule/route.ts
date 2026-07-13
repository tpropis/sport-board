import { NextResponse } from "next/server";
import {
  ESPN_LEAGUES,
  normalizeEspnEvent,
  type ScheduleEvent,
  type ScheduleResponse,
} from "@/lib/schedule/types";
import { seedSchedule, DEMO_DATE } from "@/lib/schedule/seed";
import { worldCupForDate } from "@/lib/schedule/worldcup";
import { specialForDate } from "@/lib/schedule/special";

// Always fresh — this is the live surface.
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    return []; // offline / blocked / timeout — caller falls back to seed
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const date = url.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const yyyymmdd = date.replace(/-/g, "");

  const results = await Promise.allSettled(
    ESPN_LEAGUES.map((l) => fetchLeague(l.path, l.display, l.sport, yyyymmdd)),
  );
  const live = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

  const useLive = live.length > 0;
  // Fallback: the full demo slate for the demo date, plus World Cup fixtures
  // for any other date so the calendar is never empty during the tournament.
  const fallback =
    date === DEMO_DATE
      ? seedSchedule(date)
      : [...seedSchedule(date), ...worldCupForDate(date)];
  const base = useLive ? live : fallback;
  // Special events (Home Run Derby, All-Star Game…) aren't in ESPN's game feed,
  // so always merge them in for the date, avoiding name duplicates.
  const names = new Set(base.map((e) => e.name.toLowerCase()));
  const specials = specialForDate(date).filter((s) => !names.has(s.name.toLowerCase()));
  const events = [...base, ...specials];

  // Sort: live & delayed first, then upcoming by time, then finals.
  const rank = (s: string) =>
    s === "in" || s === "delayed" ? 0 : s === "pre" ? 1 : 2;
  events.sort((a, b) => {
    const r = rank(a.status.state) - rank(b.status.state);
    return r !== 0 ? r : a.startUtc.localeCompare(b.startUtc);
  });

  const body: ScheduleResponse = {
    source: useLive ? "live" : "seed",
    date,
    fetchedAt: new Date().toISOString(),
    events,
  };
  return NextResponse.json(body);
}
