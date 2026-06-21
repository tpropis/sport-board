/**
 * Draw engine — estimates how hard each event pulls a paying crowd into THIS
 * bar, then sets priority order from that. Higher draw = better for business:
 * the games that fill seats and keep people ordering go on the best TVs first.
 *
 * Draw = local-team pull (the dominant factor for a neighborhood bar)
 *      + regional sport taste (what this market cares about)
 *      + event magnitude (playoff / final / championship)
 *      + national-event draw (Super Bowl, World Cup, majors…)
 *      + local host-city bump (e.g. a World Cup match in your own city).
 */
import type { Assignment } from "./types";
import {
  getMarket,
  regionInterest,
  type LeagueKey,
  type Market,
} from "./markets";

export interface DrawResult {
  score: number;
  reasons: string[];
}

/** Map an assignment's sport/league text to a league key for the profiles. */
export function leagueKeyFor(a: Pick<Assignment, "league" | "sport">): LeagueKey {
  const s = `${a.league ?? ""} ${a.sport ?? ""}`.toLowerCase();
  if (/college world series|college baseball|ncaa.*baseball/.test(s)) return "COLLEGE_BASEBALL";
  if (/\bnfl\b|football.*nfl|national football/.test(s)) return "NFL";
  if (/college football|\bcfb\b|\bsec\b|ncaaf|bowl/.test(s)) return "CFB";
  if (/wnba/.test(s)) return "WNBA";
  if (/march madness|college basketball|\bcbb\b|ncaab/.test(s)) return "CBB";
  if (/\bnba\b/.test(s)) return "NBA";
  if (/\bmlb\b|baseball/.test(s)) return "MLB";
  if (/\bnhl\b|hockey|stanley cup/.test(s)) return "NHL";
  if (/\bmls\b/.test(s)) return "MLS";
  if (/world cup|fifa|premier league|uefa|champions league|la liga|usmnt|uswnt|international|soccer|f[uú]tbol/.test(s))
    return "SOCCER_INTL";
  if (/golf|pga|usga|liv|masters|ryder cup/.test(s)) return "GOLF";
  if (/nascar|cup series/.test(s)) return "RACING_NASCAR";
  if (/indycar|formula|grand prix|\bf1\b|racing|race/.test(s)) return "RACING_OPEN";
  if (/ufc|mma|boxing|bellator|fight/.test(s)) return "MMA";
  if (/tennis|wimbledon|atp|wta|grand slam/.test(s)) return "TENNIS";
  if (/basketball/.test(s)) return "NBA";
  if (/football/.test(s)) return "NFL";
  return "OTHER";
}

const NATIONAL: { test: RegExp; bonus: number; label: string; requireLeague?: LeagueKey }[] = [
  { test: /super bowl/, bonus: 70, label: "Super Bowl", requireLeague: "NFL" },
  { test: /world series/, bonus: 55, label: "World Series", requireLeague: "MLB" },
  { test: /college football playoff|national championship|natl championship/, bonus: 58, label: "Championship", requireLeague: "CFB" },
  { test: /nba finals/, bonus: 52, label: "NBA Finals", requireLeague: "NBA" },
  { test: /stanley cup/, bonus: 48, label: "Stanley Cup", requireLeague: "NHL" },
  { test: /final four|march madness/, bonus: 50, label: "March Madness", requireLeague: "CBB" },
  { test: /world cup|fifa/, bonus: 46, label: "World Cup", requireLeague: "SOCCER_INTL" },
  { test: /olympic/, bonus: 46, label: "Olympics" },
  { test: /masters|u\.?s\.? open|the open|pga championship|ryder cup/, bonus: 34, label: "Golf major", requireLeague: "GOLF" },
  { test: /college world series/, bonus: 26, label: "College World Series", requireLeague: "COLLEGE_BASEBALL" },
  { test: /champions league|uefa/, bonus: 30, label: "Champions League", requireLeague: "SOCCER_INTL" },
  { test: /ufc \d|title|main event|heavyweight/, bonus: 30, label: "Marquee fight", requireLeague: "MMA" },
  { test: /wimbledon|grand slam/, bonus: 24, label: "Tennis major", requireLeague: "TENNIS" },
];

function nationalBonus(text: string, league: LeagueKey): { bonus: number; label?: string } {
  let best = { bonus: 0, label: undefined as string | undefined };
  for (const n of NATIONAL) {
    if (n.requireLeague && n.requireLeague !== league) continue;
    if (n.test.test(text) && n.bonus > best.bonus) best = { bonus: n.bonus, label: n.label };
  }
  return best;
}

function localTeamPull(a: Assignment, market: Market): { draw: number; team?: string } {
  const text = `${a.eventName} ${a.team1 ?? ""} ${a.team2 ?? ""}`.toLowerCase();
  let best: { draw: number; team?: string } = { draw: 0 };
  for (const team of market.teams) {
    const nick = team.nickname.toLowerCase();
    const full = team.name.toLowerCase();
    const hit = text.includes(full) || (nick.length >= 3 && new RegExp(`\\b${nick}\\b`).test(text));
    if (hit && team.draw > best.draw) best = { draw: team.draw, team: team.name };
  }
  return best;
}

export function scoreEvent(a: Assignment, market?: Market): DrawResult {
  const reasons: string[] = [];
  const league = leagueKeyFor(a);
  const text = `${a.eventName} ${a.league ?? ""} ${a.sport ?? ""}`.toLowerCase();

  let score = 0;

  if (market) {
    const base = regionInterest(market.region, league);
    score += base;
    reasons.push(`${league} interest in ${market.name.split(",")[0]}: +${base}`);

    const local = localTeamPull(a, market);
    if (local.draw > 0) {
      score += local.draw;
      reasons.push(`Local team — ${local.team}: +${local.draw}`);
    } else if (a.labels.includes("LOCAL")) {
      score += 18;
      reasons.push("Local event in-market: +18");
    }
  } else {
    score += 50;
  }

  // Magnitude
  if (a.labels.includes("PLAYOFF")) {
    score += 24;
    reasons.push("Playoff: +24");
  }
  if (a.labels.includes("BIG GAME")) {
    score += 12;
    reasons.push("Big game: +12");
  }
  if (/\bfinal\b|\bfinals\b|championship|game 7|elimination|clinch/.test(text)) {
    score += 22;
    reasons.push("Final / elimination: +22");
  }

  // National draw
  const nat = nationalBonus(text, league);
  if (nat.bonus > 0) {
    score += nat.bonus;
    reasons.push(`${nat.label}: +${nat.bonus}`);
  }
  // USA in an international match is a crowd magnet.
  if (league === "SOCCER_INTL" && /\busa\b|united states|usmnt|uswnt|u\.s\./.test(text)) {
    score += 28;
    reasons.push("Team USA: +28");
  }

  return { score: Math.round(score), reasons };
}

/**
 * Re-rank assignments by draw and return copies with `priority` set 1..N.
 * Stable: ties keep their existing relative order.
 */
export function autoPrioritize(assignments: Assignment[], marketKey?: string): Assignment[] {
  const market = getMarket(marketKey);
  const scored = assignments.map((a, i) => ({ a, i, s: scoreEvent(a, market).score }));
  scored.sort((x, y) => (y.s - x.s) || (x.i - y.i));
  return scored.map(({ a }, idx) => ({ ...a, priority: idx + 1 }));
}
