import type { ScheduleEvent, EventStatus } from "./types";

/**
 * Special events that aren't in ESPN's regular game feed — MLB All-Star week
 * (Home Run Derby, All-Star Game), etc. Merged into the schedule for their
 * date so they show up and can be dropped on the board.
 */
type Special = {
  date: string;
  time24: string;
  name: string;
  sport: string;
  league: string;
  networks: string[];
  city?: string;
  venue?: string;
};

const SPECIALS: Special[] = [
  // 2026 MLB All-Star week — Philadelphia. Derby streams on Netflix nationally;
  // on DIRECTV it's the premium "MLB Home Run Derby" channel (9547).
  {
    date: "2026-07-13",
    time24: "20:00",
    name: "MLB Home Run Derby",
    sport: "Baseball",
    league: "MLB All-Star",
    networks: ["MLB Home Run Derby", "Netflix"],
    city: "Philadelphia",
    venue: "Citizens Bank Park",
  },
  {
    date: "2026-07-14",
    time24: "20:00",
    name: "MLB All-Star Game",
    sport: "Baseball",
    league: "MLB All-Star",
    networks: ["FOX"],
    city: "Philadelphia",
    venue: "Citizens Bank Park",
  },
  // 2025 MLB All-Star week was in Atlanta (Truist Park) — kept for robustness.
  {
    date: "2025-07-14",
    time24: "20:00",
    name: "MLB Home Run Derby",
    sport: "Baseball",
    league: "MLB All-Star",
    networks: ["ESPN"],
    city: "Atlanta",
    venue: "Truist Park",
  },
  {
    date: "2025-07-15",
    time24: "20:00",
    name: "MLB All-Star Game",
    sport: "Baseball",
    league: "MLB All-Star",
    networks: ["FOX"],
    city: "Atlanta",
    venue: "Truist Park",
  },
];

function statusFor(startMs: number, now: number): EventStatus {
  const end = startMs + 3 * 60 * 60 * 1000;
  if (now < startMs) return { state: "pre", detail: "Scheduled" };
  if (now < end) return { state: "in", detail: "In Progress" };
  return { state: "post", detail: "Final" };
}

export function specialForDate(date: string, now = Date.now()): ScheduleEvent[] {
  return SPECIALS.filter((s) => s.date === date).map((s, i) => {
    const startUtc = `${s.date}T${s.time24}:00-04:00`;
    return {
      id: `special-${date}-${i}`,
      league: s.league,
      sport: s.sport,
      name: s.name,
      startUtc,
      status: statusFor(new Date(startUtc).getTime(), now),
      networks: s.networks,
      city: s.city,
      venue: s.venue,
      national: true,
      local: false,
    } satisfies ScheduleEvent;
  });
}
