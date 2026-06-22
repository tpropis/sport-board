import type { ScheduleEvent, EventStatus } from "./types";

/**
 * 2026 FIFA World Cup group-stage fixtures, transcribed from the posted bar
 * schedule (all matches on FOX or FS1). Times are Eastern. This is the April
 * 2026 posting and is subject to change; in production the live ESPN feed
 * (soccer/fifa.world) supersedes it for the requested date.
 *
 * Channel: "FOX" = 5 / "FS1" = 219 on the bar's DIRECTV (resolved per provider).
 */
type Fix = [time24: string, team1: string, team2: string, ch: "FOX" | "FS1", city: string];

const FIXTURES: Record<string, Fix[]> = {
  "2026-06-18": [
    ["12:00", "Portugal", "Uzbekistan", "FS1", "Foxborough"],
    ["15:00", "Jordan", "Algeria", "FOX", "Houston"],
    ["18:00", "England", "Ghana", "FOX", "Arlington"],
    ["21:00", "Switzerland", "Canada", "FS1", "Vancouver"],
  ],
  "2026-06-19": [
    ["12:00", "Mexico", "South Korea", "FOX", "Mexico City"],
    ["15:00", "Brazil", "Morocco", "FOX", "Philadelphia"],
    ["18:00", "Netherlands", "Sweden", "FS1", "Houston"],
    ["21:00", "USA", "Australia", "FOX", "Seattle"],
  ],
  "2026-06-20": [
    ["12:00", "Argentina", "Algeria", "FS1", "Kansas City"],
    ["15:00", "Iraq", "France", "FOX", "New Jersey"],
    ["18:00", "Senegal", "Norway", "FOX", "Miami"],
    ["21:00", "Belgium", "Iran", "FS1", "Los Angeles"],
  ],
  "2026-06-21": [
    ["12:00", "Spain", "Saudi Arabia", "FOX", "Atlanta"],
    ["12:00", "Ecuador", "Curaçao", "FS1", "Kansas City"],
    ["15:00", "Belgium", "Iran", "FOX", "Los Angeles"],
    ["15:00", "New Zealand", "Egypt", "FS1", "Vancouver"],
    ["18:00", "Uruguay", "Cape Verde", "FOX", "Miami"],
    ["21:00", "Tunisia", "Japan", "FS1", "Monterrey"],
  ],
  "2026-06-22": [
    ["12:00", "Norway", "Senegal", "FOX", "Toronto"],
    ["15:00", "France", "Iraq", "FOX", "Vancouver"],
    ["18:00", "Panama", "Croatia", "FS1", "Miami"],
    ["18:00", "England", "Ghana", "FOX", "Arlington"],
    ["21:00", "Portugal", "Uzbekistan", "FS1", "Foxborough"],
  ],
  "2026-06-23": [
    ["12:00", "Scotland", "Paraguay", "FS1", "Bay Area"],
    ["15:00", "Morocco", "Haiti", "FOX", "Toronto"],
    ["18:00", "Scotland", "Brazil", "FOX", "Los Angeles"],
    ["21:00", "South Africa", "Mexico", "FS1", "Guadalajara"],
  ],
  "2026-06-24": [
    ["12:00", "Czechia", "Mexico", "FOX", "Mexico City"],
    ["15:00", "Morocco", "Brazil", "FOX", "Philadelphia"],
    ["18:00", "Curaçao", "Germany", "FS1", "Houston"],
    ["21:00", "Switzerland", "Canada", "FOX", "Vancouver"],
  ],
  "2026-06-25": [
    ["12:00", "Japan", "Sweden", "FS1", "Houston"],
    ["15:00", "Tunisia", "Netherlands", "FOX", "Atlanta"],
    ["18:00", "New Zealand", "Belgium", "FS1", "Seattle"],
    ["21:00", "Cape Verde", "Saudi Arabia", "FOX", "Bay Area"],
  ],
  "2026-06-26": [
    ["12:00", "Egypt", "Iran", "FOX", "Los Angeles"],
    ["15:00", "Panama", "England", "FOX", "Arlington"],
    ["18:00", "Uruguay", "Spain", "FS1", "Miami"],
    ["21:00", "New Zealand", "Belgium", "FOX", "Seattle"],
  ],
  "2026-06-27": [
    ["12:00", "Algeria", "Austria", "FS1", "Kansas City"],
    ["15:00", "Jordan", "Argentina", "FOX", "Miami"],
    ["18:00", "Croatia", "Ghana", "FS1", "Philadelphia"],
    ["21:00", "Colombia", "Portugal", "FOX", "New Jersey"],
  ],
};

function statusFor(startMs: number, now: number): EventStatus {
  const end = startMs + 2 * 60 * 60 * 1000; // ~2h match window
  if (now < startMs) return { state: "pre", detail: "Scheduled" };
  if (now < end) {
    const min = Math.max(1, Math.floor((now - startMs) / 60000));
    return { state: "in", detail: "In Progress", clock: `${Math.min(min, 90)}'` };
  }
  return { state: "post", detail: "Final" };
}

/** World Cup events for a date, with status computed live from kickoff time. */
export function worldCupForDate(date: string, now = Date.now()): ScheduleEvent[] {
  const fixtures = FIXTURES[date];
  if (!fixtures) return [];
  return fixtures.map(([time, t1, t2, ch, city], i) => {
    const startUtc = `${date}T${time}:00-04:00`;
    const startMs = new Date(startUtc).getTime();
    return {
      id: `wc-${date}-${i}`,
      league: "FIFA World Cup",
      sport: "Soccer",
      name: `${t1} vs ${t2}`,
      team1: t1,
      team2: t2,
      startUtc,
      status: statusFor(startMs, now),
      networks: [ch, "Telemundo"],
      city,
      national: true,
      local: false,
    };
  });
}

export const WORLD_CUP_DATES = Object.keys(FIXTURES);
