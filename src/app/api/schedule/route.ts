import { NextResponse } from "next/server";
import {
  ESPN_LEAGUES,
  normalizeEspnEvent,
  type ScheduleEvent,
  type ScheduleResponse,
} from "@/lib/schedule/types";
import { seedSchedule } from "@/lib/schedule/seed";

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
  const events = useLive ? live : seedSchedule(date);

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
