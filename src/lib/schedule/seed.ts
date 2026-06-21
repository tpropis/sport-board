import type { ScheduleEvent, EventStatus } from "./types";

/** Build an ISO instant from a June 21, 2026 Eastern (EDT, -04:00) wall time. */
function et(time24: string): string {
  return `2026-06-21T${time24}:00-04:00`;
}

const PRE: EventStatus = { state: "pre", detail: "Scheduled" };
const FINAL: EventStatus = { state: "post", detail: "Final" };
const live = (clock: string): EventStatus => ({ state: "in", detail: "In Progress", clock });

type Seed = Omit<ScheduleEvent, "local">;

function mk(
  id: string,
  league: string,
  sport: string,
  name: string,
  start: string,
  status: EventStatus,
  networks: string[],
  extra: Partial<Seed> = {},
): ScheduleEvent {
  const [team1, team2] = name.includes(" vs ") ? name.split(" vs ") : [undefined, undefined];
  return {
    id,
    league,
    sport,
    name,
    team1,
    team2,
    startUtc: et(start),
    status,
    networks,
    national: false,
    local: false,
    ...extra,
  };
}

/**
 * A full, detailed slate for Sunday, June 21, 2026 (Father's Day) — the
 * fallback when the live feed is unavailable. Statuses are written as if a
 * manager is checking around 5 PM ET, so every state is represented (Final,
 * In Progress, Rain Delay, Scheduled).
 */
export function seedSchedule(date: string): ScheduleEvent[] {
  if (date !== "2026-06-21") return [];

  return [
    // ---- FIFA World Cup (all on FOX / FS1) ----
    mk("wc-esp-ksa", "FIFA World Cup", "Soccer", "Spain vs Saudi Arabia", "12:00", { state: "post", detail: "Final" }, ["FOX", "Telemundo"], { score1: "2", score2: "1", national: true, venue: "Mercedes-Benz Stadium", city: "Atlanta" }),
    mk("wc-ecu-cur", "FIFA World Cup", "Soccer", "Ecuador vs Curaçao", "12:00", FINAL, ["FS1"], { score1: "1", score2: "0", national: true, city: "Kansas City" }),
    mk("wc-bel-irn", "FIFA World Cup", "Soccer", "Belgium vs Iran", "15:00", live("62'"), ["FOX"], { score1: "1", score2: "1", national: true, venue: "SoFi Stadium", city: "Los Angeles" }),
    mk("wc-nzl-egy", "FIFA World Cup", "Soccer", "New Zealand vs Egypt", "15:00", live("55'"), ["FS1"], { score1: "0", score2: "0", national: true, city: "Vancouver" }),
    mk("wc-uru-cpv", "FIFA World Cup", "Soccer", "Uruguay vs Cape Verde", "18:00", PRE, ["FOX"], { national: true, city: "Miami" }),
    mk("wc-tun-jpn", "FIFA World Cup", "Soccer", "Tunisia vs Japan", "21:00", PRE, ["FS1"], { national: true, city: "Monterrey" }),

    // ---- Golf ----
    mk("golf-usopen", "PGA / USGA", "Golf", "U.S. Open — Final Round", "12:00", live("Final Round"), ["NBC", "Peacock"], { national: true, venue: "Shinnecock Hills", city: "Southampton, NY" }),

    // ---- College World Series ----
    mk("cws-unc-ou", "NCAA", "Baseball", "North Carolina vs Oklahoma", "14:30", live("Bot 3rd"), ["ABC"], { score1: "2", score2: "1", national: true, venue: "Charles Schwab Field", city: "Omaha" }),

    // ---- IndyCar ----
    mk("indy-roadamerica", "IndyCar", "Auto Racing", "XPEL Grand Prix at Road America", "14:20", live("Lap 22 / 55"), ["FOX"], { national: true, venue: "Road America", city: "Elkhart Lake, WI" }),

    // ---- MLB (Sunday slate) ----
    mk("mlb-atl-mil", "MLB", "Baseball", "Braves vs Brewers", "13:35", live("Bot 6th"), ["FanDuel Sports South", "MLB.TV"], { score1: "4", score2: "2", venue: "Truist Park", city: "Atlanta" }),
    mk("mlb-nym-phi", "MLB", "Baseball", "Mets vs Phillies", "13:35", { state: "delayed", detail: "Rain Delay" }, ["SNY", "MLB.TV"], { city: "Philadelphia" }),
    mk("mlb-nyy-bal", "MLB", "Baseball", "Yankees vs Orioles", "13:35", FINAL, ["YES", "MLB.TV"], { score1: "6", score2: "3", city: "Baltimore" }),
    mk("mlb-bos-tor", "MLB", "Baseball", "Red Sox vs Blue Jays", "13:37", FINAL, ["NESN", "MLB.TV"], { score1: "5", score2: "4", city: "Toronto" }),
    mk("mlb-chc-stl", "MLB", "Baseball", "Cubs vs Cardinals", "14:15", live("Top 3rd"), ["Marquee", "MLB.TV"], { score1: "1", score2: "0", city: "St. Louis" }),
    mk("mlb-hou-tex", "MLB", "Baseball", "Astros vs Rangers", "14:35", live("Top 4th"), ["SCHN", "MLB.TV"], { score1: "3", score2: "3", city: "Arlington" }),
    mk("mlb-cle-min", "MLB", "Baseball", "Guardians vs Twins", "14:10", FINAL, ["BSGL", "MLB.TV"], { score1: "2", score2: "5", city: "Minneapolis" }),
    mk("mlb-sf-col", "MLB", "Baseball", "Giants vs Rockies", "15:10", live("Top 2nd"), ["NBCS-BA", "MLB.TV"], { score1: "0", score2: "0", city: "Denver" }),
    mk("mlb-lad-sd", "MLB", "Baseball", "Dodgers vs Padres", "16:10", PRE, ["SportsNet LA", "MLB.TV"], { city: "San Diego" }),
    mk("mlb-sea-laa", "MLB", "Baseball", "Mariners vs Angels", "16:07", PRE, ["ROOT Sports", "MLB.TV"], { city: "Anaheim" }),
    mk("mlb-snb", "MLB", "Baseball", "Tigers vs Royals", "19:10", PRE, ["ESPN"], { national: true, city: "Kansas City" }),

    // ---- WNBA ----
    mk("wnba-atl-ind", "WNBA", "Basketball", "Dream vs Fever", "15:00", PRE, ["ABC"], { national: true, venue: "Gateway Center Arena", city: "Atlanta" }),
    mk("wnba-ny-chi", "WNBA", "Basketball", "Liberty vs Sky", "13:00", FINAL, ["ION"], { score1: "84", score2: "79", city: "Chicago" }),
    mk("wnba-lv-sea", "WNBA", "Basketball", "Aces vs Storm", "21:00", PRE, ["NBA TV"], { national: true, city: "Seattle" }),

    // ---- MLS ----
    mk("mls-atl-orl", "MLS", "Soccer", "Atlanta United vs Orlando City", "19:30", PRE, ["MLS Season Pass", "Apple TV"], { venue: "Mercedes-Benz Stadium", city: "Atlanta" }),
    mk("mls-lafc-sea", "MLS", "Soccer", "LAFC vs Seattle Sounders", "21:00", PRE, ["MLS Season Pass", "Apple TV"], { city: "Los Angeles" }),

    // ---- Tennis ----
    mk("atp-halle", "ATP Tour", "Tennis", "Halle Open — Final", "08:00", FINAL, ["Tennis Channel"], { city: "Halle, Germany" }),
  ];
}
