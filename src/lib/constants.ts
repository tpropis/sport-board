import type { AssignmentLabel } from "./types";

/** Full streaming/broadcast service catalog (Services & Streaming page). */
export const SERVICE_CATALOG: string[] = [
  "DIRECTV",
  "DIRECTV app",
  "BravesVision",
  "Braves.TV",
  "MLB.TV",
  "MLB app",
  "ESPN",
  "ESPN+",
  "Fox",
  "FS1",
  "Fox Sports app",
  "TBS",
  "TNT",
  "truTV",
  "Max / B/R Sports",
  "NBC",
  "Peacock",
  "CBS",
  "Paramount+",
  "Prime Video",
  "Apple TV+",
  "MLS Season Pass",
  "Netflix",
  "MLB Network",
  "NFL Network",
  "NFL RedZone",
  "NFL Sunday Ticket",
  "Golf Channel",
  "UFC / ESPN+ PPV",
  "DAZN",
  "YouTube",
  "Custom app",
];

export const DEVICE_TYPES = [
  "DIRECTV box",
  "Apple TV",
  "Smart TV app",
  "Roku",
  "Fire TV",
  "Custom device",
];

/** Default priority order (Priority Rules page). Local teams first. */
export const DEFAULT_PRIORITY_RULES = [
  { label: "Atlanta Falcons", local: true },
  { label: "Atlanta Braves", local: true },
  { label: "Georgia Bulldogs football", local: true },
  { label: "Atlanta Hawks", local: true },
  { label: "Atlanta United", local: true },
  { label: "Georgia Tech", local: true },
  { label: "NFL national games", local: false },
  { label: "SEC football", local: false },
  { label: "Braves playoffs / MLB playoffs", local: false },
  { label: "NBA playoffs / Finals", local: false },
  { label: "College football ranked matchups", local: false },
  { label: "March Madness", local: false },
  { label: "World Cup / USA soccer", local: false },
  { label: "Golf majors", local: false },
  { label: "UFC / boxing main cards", local: false },
  { label: "Premier League / Champions League", local: false },
  { label: "Formula 1", local: false },
  { label: "Tennis majors", local: false },
  { label: "WNBA / major women's sports (nationally relevant)", local: false },
  { label: "Other nationally popular games", local: false },
  { label: "Default filler: SportsCenter, RedZone, Golf Channel, ESPN", local: false },
].map((r, i) => ({ rank: i + 1, ...r }));

/** Default sound rules (Sound Rules page). Music stays on by default. */
export const DEFAULT_SOUND_RULES = [
  {
    label: "Music stays on",
    description: "Default. Keep the room on music — game audio off.",
  },
  {
    label: "Main audio recommended",
    description:
      "Switch the room to this game's audio. Reserve for marquee local & national events.",
  },
  { label: "Audio optional", description: "Bartender's call based on the crowd." },
  { label: "Crowd request only", description: "Flip to game audio only if patrons ask." },
  { label: "Manager decision", description: "Hold for a manager to make the call." },
];

/** Events that justify switching off music to game audio (Sound Rules page). */
export const MAIN_AUDIO_EVENTS = [
  "Falcons playoff or major game",
  "Braves playoff or major late-season game",
  "Georgia Bulldogs football",
  "National championship",
  "Super Bowl",
  "World Series",
  "NBA Finals",
  "College Football Playoff",
  "March Madness final rounds",
  "World Cup / USA match",
  "UFC or boxing main event",
  "Manager override",
  "Major crowd request",
];

/** National Braves routing options (Special Braves logic). */
export const BRAVES_NATIONAL_OPTIONS = [
  "FOX",
  "FS1",
  "ESPN",
  "ESPN app",
  "TBS",
  "NBC",
  "Peacock",
  "Apple TV+",
  "Netflix",
  "MLB Network",
];

/** Title for an assignment: "Team1 vs Team2" for team sports, otherwise the
 *  event/tournament name (golf, tennis, racing, etc. — no fake "vs"). */
export function matchupTitle(a: { team1?: string; team2?: string; eventName: string }): string {
  const real = (x?: string) => !!x && !/^(tbd|tba|undecided)$/i.test(x.trim());
  return real(a.team1) && real(a.team2) ? `${a.team1} vs ${a.team2}` : a.eventName;
}

export const LABEL_STYLES: Record<AssignmentLabel, string> = {
  LOCAL: "border-amber-accent/40 bg-amber-accent/10 text-amber-glow",
  "BIG GAME": "border-amber-accent/50 bg-amber-accent/15 text-amber-glow",
  PLAYOFF: "border-alert/40 bg-alert/10 text-alert",
  "STREAMING ONLY": "border-sky-400/30 bg-sky-400/10 text-sky-300",
  "MAIN AUDIO": "border-signal/40 bg-signal/10 text-signal",
  "MUSIC STAYS ON": "border-chalk-faint/40 bg-ink-700 text-chalk-dim",
  CONFIRMED: "border-signal/50 bg-signal-deep/40 text-signal",
  "NEEDS CHECK": "border-alert/50 bg-alert-dim/30 text-alert",
};

/** Derive the auto-labels for an assignment (combined with manual labels). */
export function deriveLabels(a: {
  labels: AssignmentLabel[];
  soundRule: string;
  confirmed: boolean;
  streamingApp?: string;
  directvChannel?: string;
}): AssignmentLabel[] {
  const set = new Set<AssignmentLabel>(a.labels);
  if (a.soundRule === "Main audio recommended") set.add("MAIN AUDIO");
  if (a.soundRule === "Music stays on") set.add("MUSIC STAYS ON");
  if (a.streamingApp && !a.directvChannel) set.add("STREAMING ONLY");
  set.add(a.confirmed ? "CONFIRMED" : "NEEDS CHECK");
  return Array.from(set);
}
