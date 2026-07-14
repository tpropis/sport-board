import type { AppState, Assignment, Bar, DailyBoard } from "./types";
import {
  DEFAULT_PRIORITY_RULES,
  DEFAULT_SOUND_RULES,
  SERVICE_CATALOG,
} from "./constants";
import { autoPrioritize } from "./priority";

/** A simple SVG "bar wall" placeholder so the photo-mapping feature is usable
 *  out of the box. Managers replace this by uploading a real bar photo. */
function barWallPlaceholder(label: string): string {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="520" viewBox="0 0 1200 520">
    <defs>
      <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#1a1d22"/>
        <stop offset="1" stop-color="#0d0f12"/>
      </linearGradient>
      <radialGradient id="glow" cx="0.5" cy="0.2" r="0.9">
        <stop offset="0" stop-color="#2a2118" stop-opacity="0.7"/>
        <stop offset="1" stop-color="#0d0f12" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1200" height="520" fill="url(#wall)"/>
    <rect width="1200" height="520" fill="url(#glow)"/>
    <rect x="0" y="430" width="1200" height="90" fill="#0a0b0d"/>
    <text x="40" y="486" fill="#3a414c" font-family="monospace" font-size="22" letter-spacing="3">HOOLIGANS TAVERN — ${label.toUpperCase()}</text>
    ${[0, 1, 2, 3, 4, 5, 6]
      .map((i) => {
        const x = 60 + i * 162;
        return `<g><rect x="${x}" y="70" width="140" height="86" rx="6" fill="#05070a" stroke="#2c323b" stroke-width="2"/><rect x="${x + 6}" y="76" width="128" height="74" rx="3" fill="#10141a"/></g>`;
      })
      .join("")}
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

const TV_ORDER = [3, 4, 9, 5, 6, 7, 8];

/** The demo slate is pinned to this date (the seeded games are real for it).
 *  Other dates start empty and are built from the live schedule. */
export const DEMO_DATE = "2026-06-21";

const TV_DESCRIPTIONS: Record<number, string> = {
  3: "Far left / left bar TV",
  4: "Left-center TV",
  9: "Center odd-number TV",
  5: "Main center TV",
  6: "Right-center TV",
  7: "Right bar TV",
  8: "Far-right TV",
};

/** Markers pre-placed left-to-right across the placeholder wall, in TV order. */
function seededMarkers() {
  return TV_ORDER.map((num, i) => ({
    id: `mk-${num}`,
    tvNumber: num,
    x: 9 + i * 13.2, // spread across the width
    y: 26,
    size: 46,
    note: TV_DESCRIPTIONS[num],
    ignored: false,
  }));
}

const AVAILABLE_SERVICES = new Set([
  "DIRECTV",
  "DIRECTV app",
  "BravesVision",
  "MLB app",
  "Paramount+",
  "ESPN+",
  "Apple TV+",
  "Prime Video",
  "Peacock",
  "Netflix",
  "Fox",
  "FS1",
  "TBS",
  "TNT",
  "truTV",
  "CBS",
  "NFL Network",
  "NFL RedZone",
  "ESPN",
]);

const SERVICE_DETAILS: Record<
  string,
  Partial<{ channelNumber: string; deviceUsed: string; notes: string; businessAccount: boolean; loginSaved: boolean }>
> = {
  DIRECTV: { channelNumber: "—", deviceUsed: "DIRECTV box", businessAccount: true, notes: "Primary provider. Main bar remote." },
  BravesVision: { channelNumber: "645", deviceUsed: "DIRECTV box", notes: "Check first for local Braves. Subject to blackout." },
  "MLB app": { deviceUsed: "Apple TV", loginSaved: true, notes: "Braves.TV / out-of-market backup." },
  "ESPN+": { deviceUsed: "Apple TV", loginSaved: true },
  "Apple TV+": { deviceUsed: "Apple TV", loginSaved: true, notes: "Friday Night Baseball, MLS." },
  "Prime Video": { deviceUsed: "Fire TV", loginSaved: true, notes: "TNF + national games." },
  Peacock: { deviceUsed: "Apple TV", loginSaved: true },
  Netflix: { deviceUsed: "Smart TV app", loginSaved: true },
  "Paramount+": { deviceUsed: "Roku", loginSaved: true, notes: "CBS sims + UEFA." },
  "NFL RedZone": { channelNumber: "703", deviceUsed: "DIRECTV box", notes: "Default Sunday filler." },
};

function buildBar(): Bar {
  const services = SERVICE_CATALOG.map((name) => {
    const d = SERVICE_DETAILS[name] ?? {};
    return {
      id: `svc-${name.replace(/[^a-z0-9]/gi, "").toLowerCase()}`,
      name,
      available: AVAILABLE_SERVICES.has(name),
      loginSaved: d.loginSaved ?? false,
      businessAccount: d.businessAccount ?? false,
      deviceUsed: d.deviceUsed,
      remoteUsed: d.deviceUsed === "DIRECTV box" ? "Main DIRECTV Remote" : undefined,
      channelNumber: d.channelNumber,
      notes: d.notes,
    };
  });

  return {
    id: "hooligans",
    name: "Hooligans Tavern",
    location: "Georgia",
    tvOrder: [...TV_ORDER],
    tvs: TV_ORDER.map((number, position) => ({
      number,
      position,
      description: TV_DESCRIPTIONS[number],
      // The center screens are the main/priority TVs — big games land here.
      main: number === 5 || number === 9,
      // Main bar zone for the run of center TVs; the right end is its own zone.
      zoneId: number === 7 || number === 8 ? "z-back" : "z-main",
      defaultDevice: "DIRECTV box",
      defaultRemote: "Main DIRECTV Remote",
      defaultInput: "HDMI 1",
      ignored: false,
      notes: undefined,
    })),
    zones: [
      { id: "z-main", name: "Main Bar" },
      { id: "z-back", name: "Back Bar" },
    ],
    devices: [
      { id: "dev-directv", name: "DIRECTV box", type: "DIRECTV box", notes: "Drives every TV by default." },
      { id: "dev-appletv", name: "Apple TV", type: "Apple TV", notes: "BravesVision app, MLB, Peacock." },
      { id: "dev-roku", name: "Roku", type: "Roku", notes: "Paramount+ / CBS." },
      { id: "dev-firetv", name: "Fire TV", type: "Fire TV", notes: "Prime Video." },
      { id: "dev-smarttv", name: "Smart TV app", type: "Smart TV app", notes: "Netflix on center TVs." },
    ],
    remotes: [
      { id: "rem-main", name: "Main DIRECTV Remote", notes: "Lives behind the well." },
      { id: "rem-1", name: "Remote 1", notes: "Apple TV — left bar." },
      { id: "rem-2", name: "Remote 2", notes: "Roku / Fire TV — back bar." },
    ],
    services,
    layoutPhotos: [
      {
        id: "photo-main",
        name: "Main Bar View",
        imageUrl: barWallPlaceholder("Main Bar View"),
        markers: seededMarkers(),
      },
      {
        id: "photo-side",
        name: "Side Angle",
        imageUrl: barWallPlaceholder("Side Angle"),
        markers: [],
      },
      {
        id: "photo-back",
        name: "Back Bar View",
        imageUrl: barWallPlaceholder("Back Bar View"),
        markers: [],
      },
    ],
    priorityRules: DEFAULT_PRIORITY_RULES.map((r) => ({ ...r })),
    soundRules: DEFAULT_SOUND_RULES.map((r) => ({ ...r })),
    localTeams: [
      "Atlanta Braves",
      "Atlanta Falcons",
      "Atlanta Hawks",
      "Atlanta United",
      "Georgia Bulldogs",
      "Georgia Tech",
    ],
    market: "atlanta",
    timezone: "America/New_York",
    lat: 33.749,
    lng: -84.388,
    defaultProvider: "DIRECTV",
    providerId: "directv",
    defaultSoundRule: "Music stays on",
    staffViewEnabled: true,
    setupNotes: "Keno TV stays unchanged.",
  };
}

function buildBoard(date: string): DailyBoard {
  const a = (x: Partial<Assignment> & Pick<Assignment, "tvNumber" | "priority" | "eventName">): Assignment => ({
    id: `as-${x.tvNumber}`,
    team1: undefined,
    team2: undefined,
    sport: undefined,
    league: undefined,
    startTime: undefined,
    endTime: undefined,
    watchOn: undefined,
    directvChannel: undefined,
    streamingApp: undefined,
    device: "DIRECTV box",
    remote: "Main DIRECTV Remote",
    soundRule: "Music stays on",
    labels: [],
    notes: undefined,
    confirmed: false,
    ...x,
  });

  // Real slate for Sunday, June 21, 2026 — Father's Day.
  // Braves vs Brewers · US Open final round (Shinnecock) · World Cup in Atlanta
  // (Spain–Saudi Arabia at Mercedes-Benz) + Belgium–Iran · IndyCar at Road
  // America · Men's College World Series Game 2. All times Eastern.
  const assignments: Assignment[] = [
    a({
      tvNumber: 5, // Main center TV — the Braves get the house
      priority: 1,
      eventId: "mlb-atl-mil",
      eventName: "Braves vs Brewers",
      team1: "Braves",
      team2: "Brewers",
      sport: "Baseball",
      league: "MLB",
      startTime: "1:35 PM",
      watchOn: "BravesVision",
      directvChannel: "645",
      streamingApp: "Braves.TV / MLB app",
      soundRule: "Music stays on",
      labels: ["LOCAL"],
      notes:
        "Father's Day matinee. Check BravesVision first. Subject to blackout or national exclusivity — then check national listing.",
      confirmed: true,
    }),
    a({
      tvNumber: 9, // World Cup match happening in Atlanta — local event
      priority: 2,
      eventId: "wc-esp-ksa",
      eventName: "World Cup: Spain vs Saudi Arabia",
      team1: "Spain",
      team2: "Saudi Arabia",
      sport: "Soccer",
      league: "FIFA World Cup · Group H",
      startTime: "12:00 PM",
      watchOn: "FS1",
      directvChannel: "219",
      streamingApp: "Fox Sports app / Tubi",
      soundRule: "Main audio recommended",
      labels: ["LOCAL", "BIG GAME"],
      notes:
        "Played right here at Mercedes-Benz Stadium — expect a crowd. Also on Telemundo (Spanish) and free on Tubi. World Cup gets main audio.",
      confirmed: true,
    }),
    a({
      tvNumber: 6, // US Open final round — Father's Day finish
      priority: 3,
      eventId: "golf-usopen",
      eventName: "U.S. Open — Final Round",
      sport: "Golf",
      league: "USGA · Shinnecock Hills",
      startTime: "12:00–7:00 PM",
      watchOn: "NBC",
      directvChannel: "11",
      streamingApp: "Peacock",
      soundRule: "Audio optional",
      labels: ["BIG GAME"],
      notes:
        "Father's Day finish at Shinnecock. USA Network had early coverage (9am–12pm); NBC/Peacock for the back nine. Turn audio up as the leaders come in.",
      confirmed: true,
    }),
    a({
      tvNumber: 3, // Far left — College World Series
      priority: 4,
      eventId: "cws-unc-ou",
      eventName: "CWS Final Game 2: North Carolina vs Oklahoma",
      team1: "North Carolina",
      team2: "Oklahoma",
      sport: "Baseball",
      league: "NCAA Men's College World Series",
      startTime: "2:30 PM",
      watchOn: "ABC",
      directvChannel: "2",
      streamingApp: "ESPN app",
      soundRule: "Music stays on",
      labels: [],
      notes: "Best-of-three final, Game 2. UNC leads if they took Game 1.",
      confirmed: true,
    }),
    a({
      tvNumber: 4, // Left-center — IndyCar
      priority: 5,
      eventId: "indy-roadamerica",
      eventName: "IndyCar: XPEL Grand Prix at Road America",
      sport: "Auto Racing",
      league: "NTT IndyCar Series",
      startTime: "2:20 PM",
      watchOn: "FOX",
      directvChannel: "5",
      streamingApp: "Fox Sports app",
      soundRule: "Music stays on",
      labels: [],
      notes: "55 laps at Road America, Elkhart Lake. On the FOX broadcast feed.",
      confirmed: true,
    }),
    a({
      tvNumber: 7, // Right bar — evening World Cup
      priority: 6,
      eventId: "wc-bel-irn",
      eventName: "World Cup: Belgium vs Iran",
      team1: "Belgium",
      team2: "Iran",
      sport: "Soccer",
      league: "FIFA World Cup · Group G",
      startTime: "3:00 PM",
      watchOn: "FOX",
      directvChannel: "5",
      streamingApp: "Fox Sports app / Tubi",
      soundRule: "Audio optional",
      labels: [],
      notes: "Afternoon World Cup window (at SoFi, LA). Audio optional based on the crowd.",
      confirmed: false,
    }),
    a({
      tvNumber: 8, // Far-right — flex / national MLB tonight
      priority: 7,
      eventId: "mlb-snb",
      eventName: "MLB Sunday Night Baseball",
      sport: "Baseball",
      league: "MLB · national window",
      startTime: "7:00 PM",
      watchOn: "ESPN",
      directvChannel: "206",
      streamingApp: "ESPN app",
      soundRule: "Music stays on",
      labels: ["NEEDS CHECK"],
      notes:
        "National Sunday-night window — confirm tonight's matchup on ESPN before doors. Golf Channel is the default filler here until first pitch.",
      confirmed: false,
    }),
  ];

  return {
    date,
    published: true,
    // Priorities come straight from the draw engine so the seed matches what
    // the "Auto-prioritize" button produces — local pull + demand first.
    assignments: autoPrioritize(assignments, "atlanta"),
    generalNotes:
      "Father's Day + World Cup weekend. Multiple soccer feeds available on the Fox Sports app / Tubi (free) and Telemundo for Spanish. Golf Channel / USA Network carried early U.S. Open coverage. Keno TV stays unchanged.",
  };
}

export function buildSeedState(): AppState {
  const bar = buildBar();
  return {
    activeBarId: bar.id,
    bars: [bar],
    boards: {
      // Seed the demo board under its real date, not "today".
      [bar.id]: [buildBoard(DEMO_DATE)],
    },
  };
}
