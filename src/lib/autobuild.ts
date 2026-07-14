import type { ScheduleEvent } from "./schedule/types";
import type { Assignment, Bar } from "./types";
import { scoreEvent } from "./priority";
import { getMarket } from "./markets";
import { pickBroadcast } from "./providers";
import { FILLER_PROGRAMS } from "./filler";

function toBlank(e: ScheduleEvent): Assignment {
  return {
    id: "tmp",
    tvNumber: 0,
    priority: 0,
    eventName: e.name,
    league: e.league,
    sport: e.sport,
    soundRule: "Music stays on",
    labels: e.local ? ["LOCAL"] : [],
    confirmed: false,
  };
}

/** Rough broadcast window (hours) per sport, for scheduling multiple games on a TV. */
function durationHours(sport?: string): number {
  const s = (sport ?? "").toLowerCase();
  if (/golf/.test(s)) return 6;
  if (/football/.test(s)) return 3.5;
  if (/racing|auto/.test(s)) return 3.5;
  if (/baseball/.test(s)) return 3;
  if (/mma|ufc|boxing/.test(s)) return 3;
  if (/basketball|hockey|tennis/.test(s)) return 2.5;
  if (/soccer/.test(s)) return 2;
  return 3;
}

/** How many TVs an event deserves — driven by its universal "spread" (national
 *  magnitude + a bump for the local team), so the Super Bowl blankets the wall
 *  while a regular local game gets a screen or two. Clamped to the TV count. */
function tvsForSpread(spread: number, tvCount: number): number {
  let n = 1;
  if (spread >= 100) n = 5; // Super Bowl, national championship
  else if (spread >= 70) n = 3; // World Series, Finals, March Madness final
  else if (spread >= 35) n = 2; // World Cup match, golf major, local team game
  return Math.min(n, Math.max(1, tvCount));
}

function localBump(localDraw: number): number {
  if (localDraw >= 90) return 40; // flagship local team (Braves, Falcons…)
  if (localDraw >= 60) return 20;
  return 0;
}

interface Interval {
  start: number;
  end: number;
}

/**
 * Build a full day of TV assignments from the schedule:
 *  - each TV carries a timeline of non-overlapping games (multiple times a day),
 *  - higher-draw events are placed first and span multiple TVs,
 *  - different-time games reuse the same TV.
 */
export function autoBuildAssignments(
  events: ScheduleEvent[],
  bar: Bar,
  fmtTime: (iso: string) => string,
  mkId: () => string,
): Assignment[] {
  const market = getMarket(bar.market);
  const overrides = bar.channelOverrides?.[bar.providerId ?? ""];
  const tvs = bar.tvOrder.filter((n) => !bar.tvs.find((t) => t.number === n)?.ignored);

  // Score + time-window every playable event, most popular first.
  const ranked = events
    .filter((e) => ["pre", "in", "delayed"].includes(e.status.state))
    .map((e) => {
      const start = new Date(e.startUtc).getTime();
      const s = scoreEvent(toBlank(e), market);
      return {
        e,
        draw: s.score,
        spread: s.magnitude + localBump(s.localDraw),
        start,
        end: start + durationHours(e.sport) * 3_600_000,
      };
    })
    .sort((a, b) => b.draw - a.draw || a.start - b.start);

  const timelines: Record<number, Interval[]> = {};
  const out: Assignment[] = [];

  ranked.forEach((item, rank) => {
    const want = tvsForSpread(item.spread, tvs.length);
    let placed = 0;
    for (const tv of tvs) {
      if (placed >= want) break;
      const busy = (timelines[tv] ?? []).some(
        (iv) => item.start < iv.end && iv.start < item.end,
      );
      if (busy) continue;
      (timelines[tv] ??= []).push({ start: item.start, end: item.end });

      const e = item.e;
      const tvCfg = bar.tvs.find((t) => t.number === tv);
      const { watchOn, channel, streaming } = pickBroadcast(e.networks, bar.providerId, overrides);
      out.push({
        id: mkId(),
        eventId: e.id,
        tvNumber: tv,
        priority: rank + 1,
        eventName: e.name,
        team1: e.team1,
        team2: e.team2,
        sport: e.sport,
        league: e.league,
        startTime: fmtTime(e.startUtc),
        watchOn,
        directvChannel: channel,
        streamingApp: streaming,
        device: tvCfg?.defaultDevice ?? "DIRECTV box",
        remote: tvCfg?.defaultRemote ?? "Main DIRECTV Remote",
        soundRule: "Music stays on",
        labels: e.local ? ["LOCAL"] : [],
        notes: [e.venue, e.city].filter(Boolean).join(" · ") || undefined,
        confirmed: false,
      });
      placed++;
    }
  });

  // Fill any TV with no game with default programming — never leave one blank.
  const placedTvs = new Set(out.map((a) => a.tvNumber));
  bar.tvOrder
    .filter((n) => !bar.tvs.find((t) => t.number === n)?.ignored && !placedTvs.has(n))
    .forEach((tv, idx) => {
      const f = FILLER_PROGRAMS[idx % FILLER_PROGRAMS.length];
      const tvCfg = bar.tvs.find((t) => t.number === tv);
      const { watchOn, channel } = pickBroadcast([f.network], bar.providerId, overrides);
      out.push({
        id: mkId(),
        filler: true,
        tvNumber: tv,
        priority: 900 + idx,
        eventName: f.name,
        sport: "Studio show",
        league: "Default programming",
        watchOn,
        directvChannel: channel,
        device: tvCfg?.defaultDevice ?? "DIRECTV box",
        remote: tvCfg?.defaultRemote ?? "Main DIRECTV Remote",
        soundRule: "Music stays on",
        labels: [],
        notes: f.note,
        confirmed: false,
      });
    });

  return out;
}
