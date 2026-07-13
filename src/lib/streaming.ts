/**
 * What each streaming service actually carries for sports (2026). Streaming
 * apps don't have channel numbers — the "exact channel" is which app + which
 * package/section — so this is the bartender's map of "which app for what."
 * Keyed by the service names in SERVICE_CATALOG (lib/constants).
 */
export interface StreamingInfo {
  /** Marquee sports properties this app carries. */
  carries: string[];
  /** How a bartender opens it. */
  howTo?: string;
}

export const STREAMING_COVERAGE: Record<string, StreamingInfo> = {
  "Apple TV+": {
    carries: ["MLS Season Pass (every MLS match)", "MLB Friday Night Baseball"],
    howTo: "Apple TV app → MLS Season Pass tab, or the game tile.",
  },
  "MLS Season Pass": {
    carries: ["Every MLS regular-season & playoff match", "Leagues Cup"],
    howTo: "Inside the Apple TV app.",
  },
  "Prime Video": {
    carries: [
      "NFL Thursday Night Football",
      "NBA national games + a Conference Final (2025-26)",
      "WNBA",
      "NWSL",
      "NASCAR (select Cup races)",
    ],
    howTo: "Prime Video → Sports / live event tile.",
  },
  Netflix: {
    carries: [
      "NFL Christmas Day games",
      "MLB Home Run Derby (2026)",
      "WWE Raw & premium live events",
      "Boxing (marquee cards)",
    ],
    howTo: "Netflix → the live event tile (only during the event).",
  },
  Peacock: {
    carries: [
      "Sunday Night Football (stream)",
      "Premier League (US home)",
      "Big Ten football & basketball",
      "2026 Winter Olympics (Milan-Cortina)",
      "Select exclusive NFL & MLB",
    ],
    howTo: "Peacock → Sports hub.",
  },
  "Max / B/R Sports": {
    carries: ["NHL", "MLB (select)", "NASCAR", "US Soccer / college", "March Madness (TNT/TBS/truTV sims)"],
    howTo: "Max → Bleacher Report Sports add-on.",
  },
  "ESPN+": {
    carries: [
      "UFC Fight Nights & PPV",
      "Out-of-market NHL / MLB / MLS",
      "College football & basketball",
      "Select exclusive MLB/NHL",
    ],
    howTo: "ESPN app → ESPN+ section.",
  },
  "Paramount+": {
    carries: [
      "CBS sports simulcast (NFL, NCAA, golf)",
      "UEFA Champions League & Europa League",
      "NWSL",
      "Serie A",
    ],
    howTo: "Paramount+ → Sports / Live TV (CBS).",
  },
  "MLB.TV": { carries: ["Out-of-market MLB (every non-local game)"] },
  "MLB app": { carries: ["MLB.TV out-of-market", "Local Braves via BravesVision auth"] },
  "NFL Sunday Ticket": {
    carries: ["Out-of-market NFL Sunday afternoon games"],
    howTo: "YouTube / YouTube TV → Sunday Ticket.",
  },
  "NFL RedZone": { carries: ["Every Sunday NFL scoring drive, whip-around, no ads"] },
  DAZN: { carries: ["Boxing", "Select international soccer", "Combat sports"] },
  YouTube: { carries: ["NFL Sunday Ticket (add-on)", "Free live events & watch-alongs"] },
  "Fox Sports app": { carries: ["FOX / FS1 / FS2 sims (auth)", "World Cup, MLB, CFB, NASCAR"] },
  "DIRECTV app": { carries: ["Your DIRECTV channels on the go (auth)"] },
};

export function coverageFor(service: string): StreamingInfo | undefined {
  return STREAMING_COVERAGE[service];
}
