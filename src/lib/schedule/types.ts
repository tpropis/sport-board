/**
 * Live schedule layer.
 *
 * In production a server route (app/api/schedule) pulls the day's games from
 * ESPN's free public endpoints across many leagues, normalizes them with
 * normalizeEspnEvent(), and the Full Schedule page polls it for live updates —
 * scores, in-progress clocks, and rain delays / postponements.
 *
 * When the feed is unavailable (offline, blocked egress, or a simulated future
 * date), the route falls back to seedSchedule() so the page is still full and
 * detailed. Everything is stored as an absolute UTC instant (startUtc) and
 * formatted in the bar's timezone on the client, so times are always correct.
 */

export type EventState = "pre" | "in" | "post" | "delayed" | "postponed" | "canceled";

export interface EventStatus {
  state: EventState;
  detail: string; // "Scheduled", "In Progress", "Rain Delay", "Final"…
  clock?: string; // "Top 5th", "62'", "Final Round"
}

export interface ScheduleEvent {
  id: string;
  league: string; // display, e.g. "MLB", "FIFA World Cup"
  sport: string; // "Baseball", "Soccer"…
  name: string; // "Braves vs Brewers"
  team1?: string;
  team2?: string;
  startUtc: string; // ISO instant
  status: EventStatus;
  score1?: string;
  score2?: string;
  networks: string[]; // ["FS1", "Telemundo"]
  venue?: string;
  city?: string;
  national: boolean;
  local: boolean; // involves a market local team (set by the client)
}

export interface ScheduleResponse {
  source: "live" | "seed";
  date: string;
  fetchedAt: string;
  events: ScheduleEvent[];
}

/** ESPN leagues to poll. Off-season leagues simply return no events. */
export const ESPN_LEAGUES: { sport: string; path: string; league: string; display: string }[] = [
  { sport: "Baseball", path: "baseball/mlb", league: "MLB", display: "MLB" },
  { sport: "Baseball", path: "baseball/college-baseball", league: "NCAA", display: "College Baseball" },
  { sport: "Soccer", path: "soccer/fifa.world", league: "FIFA World Cup", display: "FIFA World Cup" },
  { sport: "Soccer", path: "soccer/usa.1", league: "MLS", display: "MLS" },
  { sport: "Soccer", path: "soccer/uefa.champions", league: "UCL", display: "Champions League" },
  { sport: "Golf", path: "golf/pga", league: "PGA", display: "Golf" },
  { sport: "Football", path: "football/nfl", league: "NFL", display: "NFL" },
  { sport: "Football", path: "football/college-football", league: "CFB", display: "College Football" },
  { sport: "Basketball", path: "basketball/nba", league: "NBA", display: "NBA" },
  { sport: "Basketball", path: "basketball/wnba", league: "WNBA", display: "WNBA" },
  { sport: "Hockey", path: "hockey/nhl", league: "NHL", display: "NHL" },
];

function mapState(type: Record<string, unknown> | undefined): EventStatus {
  const name = String(type?.name ?? "").toUpperCase();
  const desc = String(type?.description ?? type?.shortDetail ?? "");
  const state = String(type?.state ?? "pre");
  if (name.includes("RAIN")) return { state: "delayed", detail: "Rain Delay" };
  if (name.includes("DELAY")) return { state: "delayed", detail: desc || "Delayed" };
  if (name.includes("POSTPON")) return { state: "postponed", detail: "Postponed" };
  if (name.includes("CANCEL")) return { state: "canceled", detail: "Canceled" };
  if (state === "in") return { state: "in", detail: desc || "In Progress" };
  if (state === "post") return { state: "post", detail: desc || "Final" };
  return { state: "pre", detail: desc || "Scheduled" };
}

/** Defensive normalizer for one ESPN scoreboard event. Returns null on bad shapes. */
export function normalizeEspnEvent(
  ev: any,
  meta: { sport: string; display: string },
): ScheduleEvent | null {
  try {
    const comp = ev.competitions?.[0];
    if (!comp) return null;
    const competitors = comp.competitors ?? [];
    const home = competitors.find((c: any) => c.homeAway === "home") ?? competitors[0];
    const away = competitors.find((c: any) => c.homeAway === "away") ?? competitors[1];
    const team = (c: any) => c?.team?.shortDisplayName || c?.team?.displayName || c?.team?.name;
    const networks = new Set<string>();
    for (const b of comp.broadcasts ?? []) {
      for (const n of b.names ?? []) networks.add(n);
      if (b.media?.shortName) networks.add(b.media.shortName);
    }
    for (const b of comp.geoBroadcasts ?? []) {
      if (b.media?.shortName) networks.add(b.media.shortName);
    }
    const status = mapState(comp.status?.type);
    const clock = comp.status?.type?.shortDetail;
    if (clock && status.state === "in") status.clock = clock;

    return {
      id: String(ev.id ?? `${meta.display}-${comp.id ?? Math.random()}`),
      league: meta.display,
      sport: meta.sport,
      name: away && home ? `${team(away)} vs ${team(home)}` : ev.name ?? ev.shortName ?? "Event",
      team1: team(away),
      team2: team(home),
      startUtc: ev.date,
      status,
      score1: away?.score,
      score2: home?.score,
      networks: Array.from(networks),
      venue: comp.venue?.fullName,
      city: comp.venue?.address?.city,
      national: (comp.broadcasts ?? []).some((b: any) => b.market === "national"),
      local: false,
    };
  } catch {
    return null;
  }
}
