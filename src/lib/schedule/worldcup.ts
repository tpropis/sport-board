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

/** Knockout slots — teams are TBD until groups finish, so these carry round
 *  labels, real dates/venues, and FOX/FS1 windows. The live feed fills teams in. */
const KNOCKOUTS: Record<string, [time24: string, label: string, ch: "FOX" | "FS1", city: string][]> = {
  "2026-06-28": [["15:00", "Round of 32 · Match 1", "FOX", "Los Angeles"], ["19:00", "Round of 32 · Match 2", "FOX", "Houston"]],
  "2026-06-29": [["15:00", "Round of 32 · Match 3", "FS1", "Boston"], ["19:00", "Round of 32 · Match 4", "FOX", "Mexico City"]],
  "2026-06-30": [["15:00", "Round of 32 · Match 5", "FOX", "Dallas"], ["19:00", "Round of 32 · Match 6", "FOX", "Atlanta"]],
  "2026-07-01": [["15:00", "Round of 32 · Match 7", "FS1", "Seattle"], ["19:00", "Round of 32 · Match 8", "FOX", "Vancouver"]],
  "2026-07-02": [["15:00", "Round of 32 · Match 9", "FOX", "Philadelphia"], ["19:00", "Round of 32 · Match 10", "FOX", "Miami"]],
  "2026-07-03": [
    ["13:00", "Round of 32 · Match 11", "FS1", "Kansas City"],
    ["16:00", "Round of 32 · Match 12", "FOX", "Toronto"],
    ["19:00", "Round of 32 · Match 13", "FOX", "Atlanta"],
  ],
  "2026-07-04": [["13:00", "Round of 16 · Match 1", "FOX", "Philadelphia"], ["17:00", "Round of 16 · Match 2", "FOX", "Houston"]],
  "2026-07-05": [["13:00", "Round of 16 · Match 3", "FOX", "New Jersey"], ["17:00", "Round of 16 · Match 4", "FS1", "Mexico City"]],
  "2026-07-06": [["15:00", "Round of 16 · Match 5", "FOX", "Dallas"], ["19:00", "Round of 16 · Match 6", "FOX", "Los Angeles"]],
  "2026-07-07": [["15:00", "Round of 16 · Match 7", "FOX", "Atlanta"], ["19:00", "Round of 16 · Match 8", "FS1", "Seattle"]],
  "2026-07-09": [["16:00", "Quarterfinal 1", "FOX", "Los Angeles"]],
  "2026-07-10": [["12:00", "Quarterfinal 2", "FOX", "Boston"], ["16:00", "Quarterfinal 3", "FOX", "Kansas City"]],
  "2026-07-11": [["16:00", "Quarterfinal 4", "FOX", "Miami"]],
  "2026-07-14": [["15:00", "Semifinal 1", "FOX", "Dallas"]],
  "2026-07-15": [["15:00", "Semifinal 2", "FOX", "Atlanta"]],
  "2026-07-18": [["15:00", "Third-Place Match", "FOX", "Miami"]],
  "2026-07-19": [["15:00", "🏆 World Cup Final", "FOX", "New Jersey"]],
};

/** World Cup events for a date, with status computed live from kickoff time. */
export function worldCupForDate(date: string, now = Date.now()): ScheduleEvent[] {
  const group = (FIXTURES[date] ?? []).map(([time, t1, t2, ch, city], i) => {
    const startUtc = `${date}T${time}:00-04:00`;
    return {
      id: `wc-${date}-${i}`,
      league: "FIFA World Cup",
      sport: "Soccer",
      name: `${t1} vs ${t2}`,
      team1: t1,
      team2: t2,
      startUtc,
      status: statusFor(new Date(startUtc).getTime(), now),
      networks: [ch, "Telemundo"],
      city,
      national: true,
      local: false,
    } satisfies ScheduleEvent;
  });

  const knockout = (KNOCKOUTS[date] ?? []).map(([time, label, ch, city], i) => {
    const startUtc = `${date}T${time}:00-04:00`;
    const round = label.startsWith("🏆") ? "FIFA World Cup — FINAL" : "FIFA World Cup — Knockout";
    return {
      id: `wck-${date}-${i}`,
      league: round,
      sport: "Soccer",
      name: label,
      startUtc,
      status: statusFor(new Date(startUtc).getTime(), now),
      networks: [ch, "Telemundo"],
      city,
      national: true,
      local: false,
    } satisfies ScheduleEvent;
  });

  return [...group, ...knockout];
}

export const WORLD_CUP_DATES = [
  ...Object.keys(FIXTURES),
  ...Object.keys(KNOCKOUTS),
].sort();
