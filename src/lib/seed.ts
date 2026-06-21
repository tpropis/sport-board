import type { AppState, Assignment, Bar, DailyBoard } from "./types";
import {
  DEFAULT_PRIORITY_RULES,
  DEFAULT_SOUND_RULES,
  SERVICE_CATALOG,
} from "./constants";

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
      defaultDevice: "DIRECTV box",
      defaultRemote: "Main DIRECTV Remote",
      defaultInput: "HDMI 1",
      ignored: false,
      notes: undefined,
    })),
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
    defaultProvider: "DIRECTV",
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

  const assignments: Assignment[] = [
    a({
      tvNumber: 3,
      priority: 2,
      eventName: "Braves vs Mets",
      team1: "Braves",
      team2: "Mets",
      sport: "Baseball",
      league: "MLB",
      startTime: "7:20 PM",
      watchOn: "BravesVision",
      directvChannel: "645",
      streamingApp: "MLB app",
      soundRule: "Music stays on",
      labels: ["LOCAL"],
      notes: "Local priority. Subject to blackout or national exclusivity — check national listing if blacked out.",
      confirmed: true,
    }),
    a({
      tvNumber: 4,
      priority: 7,
      eventName: "Cowboys vs Eagles",
      team1: "Cowboys",
      team2: "Eagles",
      sport: "Football",
      league: "NFL",
      startTime: "8:15 PM",
      watchOn: "NBC",
      directvChannel: "388",
      streamingApp: "Peacock",
      soundRule: "Audio optional",
      labels: ["BIG GAME"],
      notes: "Sunday Night Football. National draw.",
      confirmed: true,
    }),
    a({
      tvNumber: 9,
      priority: 1,
      eventName: "Falcons vs Saints",
      team1: "Falcons",
      team2: "Saints",
      sport: "Football",
      league: "NFL",
      startTime: "1:00 PM",
      watchOn: "FOX",
      directvChannel: "359",
      streamingApp: "Fox Sports app",
      soundRule: "Main audio recommended",
      labels: ["LOCAL", "BIG GAME"],
      notes: "Division rivalry. Falcons get the room — main audio.",
      confirmed: true,
    }),
    a({
      tvNumber: 5,
      priority: 3,
      eventName: "Georgia Bulldogs vs Tennessee",
      team1: "Georgia",
      team2: "Tennessee",
      sport: "Football",
      league: "CFB / SEC",
      startTime: "3:30 PM",
      watchOn: "CBS",
      directvChannel: "—",
      streamingApp: "Paramount+",
      device: "Roku",
      remote: "Remote 2",
      soundRule: "Main audio recommended",
      labels: ["LOCAL", "BIG GAME"],
      notes: "UGA on the main center TV. Sound on for kickoff.",
      confirmed: true,
    }),
    a({
      tvNumber: 6,
      priority: 4,
      eventName: "Hawks vs Heat",
      team1: "Hawks",
      team2: "Heat",
      sport: "Basketball",
      league: "NBA",
      startTime: "7:30 PM",
      watchOn: "Bally Sports SE",
      directvChannel: "646",
      soundRule: "Music stays on",
      labels: ["LOCAL"],
      notes: "Local NBA. Keep music up unless crowd asks.",
      confirmed: false,
    }),
    a({
      tvNumber: 7,
      priority: 5,
      eventName: "Atlanta United vs Inter Miami",
      team1: "Atlanta United",
      team2: "Inter Miami",
      sport: "Soccer",
      league: "MLS",
      startTime: "5:30 PM",
      watchOn: "MLS Season Pass",
      streamingApp: "Apple TV+",
      device: "Apple TV",
      remote: "Remote 1",
      soundRule: "Music stays on",
      labels: ["LOCAL", "STREAMING ONLY"],
      notes: "Streaming only via Apple TV. Messi draw — expect interest.",
      confirmed: false,
    }),
    a({
      tvNumber: 8,
      priority: 15,
      eventName: "UFC Fight Night — Main Card",
      sport: "MMA",
      league: "UFC",
      startTime: "10:00 PM",
      watchOn: "ESPN+",
      streamingApp: "ESPN+",
      device: "Apple TV",
      remote: "Remote 1",
      soundRule: "Crowd request only",
      labels: ["STREAMING ONLY"],
      notes: "Late main card. Flip audio only on crowd request.",
      confirmed: false,
    }),
  ];

  return {
    date,
    published: true,
    assignments,
    generalNotes:
      "Golf (PGA — Golf Channel) is the default filler on any open TV. RedZone available on DIRECTV 703 for Sunday NFL windows. Keno TV stays unchanged.",
  };
}

export function buildSeedState(today: string): AppState {
  const bar = buildBar();
  return {
    activeBarId: bar.id,
    bars: [bar],
    boards: {
      [bar.id]: [buildBoard(today)],
    },
  };
}
