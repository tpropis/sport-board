import type { ScheduleEvent } from "./schedule/types";
import type { Assignment, Bar } from "./types";
import { scoreEvent, autoPrioritize } from "./priority";
import { getMarket } from "./markets";
import { channelFor, matchNetwork } from "./providers";

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

/**
 * Turn a day's schedule into a full board: rank events by crowd draw, take the
 * top one per TV, and map channel/device/sound. This is the automation that
 * fills any day in one step from the live (or seeded) schedule.
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

  const ranked = events
    .filter((e) => ["pre", "in", "delayed"].includes(e.status.state))
    .map((e) => ({ e, s: scoreEvent(toBlank(e), market).score }))
    .sort((a, b) => b.s - a.s)
    .slice(0, tvs.length);

  const assignments = ranked.map(({ e }, i) => {
    const tv = tvs[i];
    const tvCfg = bar.tvs.find((t) => t.number === tv);
    const network = e.networks[0];
    const streaming = e.networks.find((n) => /app|\+|peacock|season pass|max|tv$/i.test(n));
    const ch = channelFor(matchNetwork(network) ?? "", bar.providerId, overrides);
    return {
      id: mkId(),
      eventId: e.id,
      tvNumber: tv,
      priority: i + 1,
      eventName: e.name,
      team1: e.team1,
      team2: e.team2,
      sport: e.sport,
      league: e.league,
      startTime: fmtTime(e.startUtc),
      watchOn: network,
      directvChannel: ch,
      streamingApp: streaming,
      device: tvCfg?.defaultDevice ?? "DIRECTV box",
      remote: tvCfg?.defaultRemote ?? "Main DIRECTV Remote",
      soundRule: "Music stays on" as const,
      labels: e.local ? (["LOCAL"] as const).slice() : [],
      notes: [e.venue, e.city].filter(Boolean).join(" · ") || undefined,
      confirmed: false,
    } satisfies Assignment;
  });

  return autoPrioritize(assignments, bar.market);
}
