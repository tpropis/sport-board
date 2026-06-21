/**
 * Market intelligence for the priority engine.
 *
 * A bar's location drives what its crowd wants on the TVs. Each market carries:
 *  - its local teams, each with a "draw" weight (how hard that team pulls a
 *    crowd into THIS bar — the core business signal), and
 *  - a regional sport-taste profile (the South over-indexes college football &
 *    NASCAR; the Northeast over-indexes MLB/NBA/NHL; the Pacific NW over-indexes
 *    soccer; etc.).
 *
 * Locations are stored with lat/lng so a Google Maps geocode result can be
 * mapped to the nearest market (see nearestMarket). No API key is required for
 * the bundled markets — Google Places is an optional enhancement.
 */

export type LeagueKey =
  | "NFL"
  | "CFB"
  | "CBB"
  | "MLB"
  | "NBA"
  | "NHL"
  | "MLS"
  | "GOLF"
  | "SOCCER_INTL"
  | "RACING_NASCAR"
  | "RACING_OPEN" // IndyCar / F1
  | "MMA"
  | "TENNIS"
  | "COLLEGE_BASEBALL"
  | "WNBA"
  | "OTHER";

export type Region =
  | "south"
  | "northeast"
  | "midwest"
  | "texas"
  | "florida"
  | "california"
  | "mountain"
  | "southwest"
  | "pacificnw"
  | "west";

export interface MarketTeam {
  name: string;
  nickname: string; // distinctive token used to match event text
  league: LeagueKey;
  /** 0-100: how hard this team pulls a paying crowd into a bar in this market. */
  draw: number;
}

export interface Market {
  key: string;
  name: string;
  region: Region;
  timezone: string; // IANA timezone for the metro
  lat: number;
  lng: number;
  teams: MarketTeam[];
}

const t = (name: string, league: LeagueKey, draw: number, nickname?: string): MarketTeam => ({
  name,
  league,
  draw,
  nickname: nickname ?? name.split(" ").slice(-1)[0],
});

export const MARKETS: Market[] = [
  {
    key: "atlanta",
    name: "Atlanta, GA",
    region: "south",
    timezone: "America/New_York",
    lat: 33.749,
    lng: -84.388,
    teams: [
      t("Atlanta Falcons", "NFL", 100),
      t("Atlanta Braves", "MLB", 96),
      t("Georgia Bulldogs", "CFB", 95, "Bulldogs"),
      t("Atlanta Hawks", "NBA", 72),
      t("Atlanta United", "MLS", 66, "United"),
      t("Georgia Tech", "CFB", 58, "Tech"),
    ],
  },
  {
    key: "nashville",
    name: "Nashville, TN",
    region: "south",
    timezone: "America/Chicago",
    lat: 36.162,
    lng: -86.781,
    teams: [
      t("Tennessee Titans", "NFL", 95, "Titans"),
      t("Tennessee Volunteers", "CFB", 90, "Volunteers"),
      t("Nashville Predators", "NHL", 72, "Predators"),
      t("Nashville SC", "MLS", 55),
      t("Vanderbilt", "CFB", 55),
    ],
  },
  {
    key: "charlotte",
    name: "Charlotte, NC",
    region: "south",
    timezone: "America/New_York",
    lat: 35.227,
    lng: -80.843,
    teams: [
      t("Carolina Panthers", "NFL", 94, "Panthers"),
      t("Charlotte Hornets", "NBA", 66, "Hornets"),
      t("Charlotte FC", "MLS", 52),
      t("North Carolina", "CFB", 60, "Carolina"),
    ],
  },
  {
    key: "new_york",
    name: "New York, NY",
    region: "northeast",
    timezone: "America/New_York",
    lat: 40.713,
    lng: -74.006,
    teams: [
      t("New York Giants", "NFL", 92, "Giants"),
      t("New York Jets", "NFL", 80, "Jets"),
      t("New York Yankees", "MLB", 95, "Yankees"),
      t("New York Mets", "MLB", 80, "Mets"),
      t("New York Knicks", "NBA", 82, "Knicks"),
      t("Brooklyn Nets", "NBA", 58, "Nets"),
      t("New York Rangers", "NHL", 78, "Rangers"),
      t("New York City FC", "MLS", 55),
    ],
  },
  {
    key: "boston",
    name: "Boston, MA",
    region: "northeast",
    timezone: "America/New_York",
    lat: 42.36,
    lng: -71.058,
    teams: [
      t("New England Patriots", "NFL", 96, "Patriots"),
      t("Boston Red Sox", "MLB", 95, "Sox"),
      t("Boston Celtics", "NBA", 90, "Celtics"),
      t("Boston Bruins", "NHL", 86, "Bruins"),
      t("New England Revolution", "MLS", 48, "Revolution"),
    ],
  },
  {
    key: "philadelphia",
    name: "Philadelphia, PA",
    region: "northeast",
    timezone: "America/New_York",
    lat: 39.953,
    lng: -75.165,
    teams: [
      t("Philadelphia Eagles", "NFL", 99, "Eagles"),
      t("Philadelphia Phillies", "MLB", 90, "Phillies"),
      t("Philadelphia 76ers", "NBA", 80, "76ers"),
      t("Philadelphia Flyers", "NHL", 74, "Flyers"),
      t("Philadelphia Union", "MLS", 55, "Union"),
    ],
  },
  {
    key: "washington_dc",
    name: "Washington, DC",
    region: "northeast",
    timezone: "America/New_York",
    lat: 38.907,
    lng: -77.037,
    teams: [
      t("Washington Commanders", "NFL", 90, "Commanders"),
      t("Washington Nationals", "MLB", 74, "Nationals"),
      t("Washington Capitals", "NHL", 76, "Capitals"),
      t("Washington Wizards", "NBA", 58, "Wizards"),
      t("D.C. United", "MLS", 50, "United"),
    ],
  },
  {
    key: "chicago",
    name: "Chicago, IL",
    region: "midwest",
    timezone: "America/Chicago",
    lat: 41.878,
    lng: -87.629,
    teams: [
      t("Chicago Bears", "NFL", 96, "Bears"),
      t("Chicago Cubs", "MLB", 88, "Cubs"),
      t("Chicago White Sox", "MLB", 66, "Sox"),
      t("Chicago Bulls", "NBA", 80, "Bulls"),
      t("Chicago Blackhawks", "NHL", 76, "Blackhawks"),
      t("Chicago Fire", "MLS", 48, "Fire"),
    ],
  },
  {
    key: "detroit",
    name: "Detroit, MI",
    region: "midwest",
    timezone: "America/New_York",
    lat: 42.331,
    lng: -83.046,
    teams: [
      t("Detroit Lions", "NFL", 96, "Lions"),
      t("Detroit Tigers", "MLB", 78, "Tigers"),
      t("Detroit Red Wings", "NHL", 78, "Wings"),
      t("Detroit Pistons", "NBA", 62, "Pistons"),
      t("Michigan Wolverines", "CFB", 80, "Michigan"),
    ],
  },
  {
    key: "minneapolis",
    name: "Minneapolis, MN",
    region: "midwest",
    timezone: "America/Chicago",
    lat: 44.978,
    lng: -93.265,
    teams: [
      t("Minnesota Vikings", "NFL", 95, "Vikings"),
      t("Minnesota Twins", "MLB", 74, "Twins"),
      t("Minnesota Wild", "NHL", 74, "Wild"),
      t("Minnesota Timberwolves", "NBA", 64, "Timberwolves"),
      t("Minnesota United", "MLS", 55, "United"),
    ],
  },
  {
    key: "dallas",
    name: "Dallas, TX",
    region: "texas",
    timezone: "America/Chicago",
    lat: 32.777,
    lng: -96.797,
    teams: [
      t("Dallas Cowboys", "NFL", 100, "Cowboys"),
      t("Texas Rangers", "MLB", 80, "Rangers"),
      t("Dallas Mavericks", "NBA", 80, "Mavericks"),
      t("Dallas Stars", "NHL", 68, "Stars"),
      t("FC Dallas", "MLS", 56),
      t("Texas Longhorns", "CFB", 85, "Longhorns"),
    ],
  },
  {
    key: "houston",
    name: "Houston, TX",
    region: "texas",
    timezone: "America/Chicago",
    lat: 29.76,
    lng: -95.369,
    teams: [
      t("Houston Texans", "NFL", 95, "Texans"),
      t("Houston Astros", "MLB", 86, "Astros"),
      t("Houston Rockets", "NBA", 72, "Rockets"),
      t("Houston Dynamo", "MLS", 54, "Dynamo"),
    ],
  },
  {
    key: "miami",
    name: "Miami, FL",
    region: "florida",
    timezone: "America/New_York",
    lat: 25.761,
    lng: -80.192,
    teams: [
      t("Miami Dolphins", "NFL", 90, "Dolphins"),
      t("Miami Heat", "NBA", 84, "Heat"),
      t("Florida Panthers", "NHL", 80, "Panthers"),
      t("Inter Miami", "MLS", 78, "Miami"),
      t("Miami Marlins", "MLB", 58, "Marlins"),
      t("Miami Hurricanes", "CFB", 76, "Hurricanes"),
    ],
  },
  {
    key: "tampa",
    name: "Tampa, FL",
    region: "florida",
    timezone: "America/New_York",
    lat: 27.951,
    lng: -82.457,
    teams: [
      t("Tampa Bay Buccaneers", "NFL", 90, "Buccaneers"),
      t("Tampa Bay Lightning", "NHL", 82, "Lightning"),
      t("Tampa Bay Rays", "MLB", 60, "Rays"),
    ],
  },
  {
    key: "los_angeles",
    name: "Los Angeles, CA",
    region: "california",
    timezone: "America/Los_Angeles",
    lat: 34.052,
    lng: -118.244,
    teams: [
      t("Los Angeles Rams", "NFL", 86, "Rams"),
      t("Los Angeles Chargers", "NFL", 68, "Chargers"),
      t("Los Angeles Dodgers", "MLB", 93, "Dodgers"),
      t("Los Angeles Lakers", "NBA", 92, "Lakers"),
      t("LA Clippers", "NBA", 60, "Clippers"),
      t("LA Kings", "NHL", 62, "Kings"),
      t("LAFC", "MLS", 70),
      t("LA Galaxy", "MLS", 58, "Galaxy"),
    ],
  },
  {
    key: "san_francisco",
    name: "San Francisco Bay Area, CA",
    region: "california",
    timezone: "America/Los_Angeles",
    lat: 37.775,
    lng: -122.419,
    teams: [
      t("San Francisco 49ers", "NFL", 95, "49ers"),
      t("San Francisco Giants", "MLB", 85, "Giants"),
      t("Golden State Warriors", "NBA", 90, "Warriors"),
      t("San Jose Sharks", "NHL", 58, "Sharks"),
    ],
  },
  {
    key: "seattle",
    name: "Seattle, WA",
    region: "pacificnw",
    timezone: "America/Los_Angeles",
    lat: 47.606,
    lng: -122.332,
    teams: [
      t("Seattle Seahawks", "NFL", 95, "Seahawks"),
      t("Seattle Mariners", "MLB", 78, "Mariners"),
      t("Seattle Kraken", "NHL", 68, "Kraken"),
      t("Seattle Sounders", "MLS", 82, "Sounders"),
      t("Seattle Storm", "WNBA", 64, "Storm"),
    ],
  },
  {
    key: "denver",
    name: "Denver, CO",
    region: "mountain",
    timezone: "America/Denver",
    lat: 39.739,
    lng: -104.99,
    teams: [
      t("Denver Broncos", "NFL", 96, "Broncos"),
      t("Denver Nuggets", "NBA", 82, "Nuggets"),
      t("Colorado Avalanche", "NHL", 80, "Avalanche"),
      t("Colorado Rockies", "MLB", 66, "Rockies"),
      t("Colorado Rapids", "MLS", 48, "Rapids"),
    ],
  },
  {
    key: "phoenix",
    name: "Phoenix, AZ",
    region: "southwest",
    timezone: "America/Phoenix",
    lat: 33.448,
    lng: -112.074,
    teams: [
      t("Arizona Cardinals", "NFL", 85, "Cardinals"),
      t("Phoenix Suns", "NBA", 82, "Suns"),
      t("Arizona Diamondbacks", "MLB", 66, "Diamondbacks"),
      t("Arizona State", "CFB", 60, "Arizona State"),
    ],
  },
  {
    key: "las_vegas",
    name: "Las Vegas, NV",
    region: "west",
    timezone: "America/Los_Angeles",
    lat: 36.17,
    lng: -115.139,
    teams: [
      t("Las Vegas Raiders", "NFL", 90, "Raiders"),
      t("Vegas Golden Knights", "NHL", 84, "Knights"),
      t("Las Vegas Aces", "WNBA", 66, "Aces"),
    ],
  },
];

/** Regional sport-taste profile: baseline crowd interest (0-100) by league,
 *  before any specific local team or national-event boost. */
const DEFAULT_PROFILE: Record<LeagueKey, number> = {
  NFL: 92,
  CFB: 70,
  CBB: 62,
  MLB: 74,
  NBA: 70,
  NHL: 58,
  MLS: 52,
  GOLF: 48,
  SOCCER_INTL: 58,
  RACING_NASCAR: 50,
  RACING_OPEN: 44,
  MMA: 60,
  TENNIS: 40,
  COLLEGE_BASEBALL: 44,
  WNBA: 42,
  OTHER: 40,
};

export const REGION_PROFILES: Record<Region, Partial<Record<LeagueKey, number>>> = {
  south: { CFB: 95, RACING_NASCAR: 72, MLB: 74, NBA: 60, NHL: 38, COLLEGE_BASEBALL: 56, SOCCER_INTL: 62, GOLF: 56 },
  northeast: { CFB: 56, MLB: 86, NBA: 78, NHL: 76, RACING_NASCAR: 34, COLLEGE_BASEBALL: 34, TENNIS: 50 },
  midwest: { CFB: 86, CBB: 80, MLB: 80, NHL: 72, NBA: 66, RACING_NASCAR: 58, COLLEGE_BASEBALL: 46 },
  texas: { NFL: 100, CFB: 92, MLB: 76, NBA: 76, SOCCER_INTL: 70, COLLEGE_BASEBALL: 60, RACING_NASCAR: 60 },
  florida: { CFB: 84, NHL: 72, NBA: 74, MLB: 66, MMA: 72, SOCCER_INTL: 72, RACING_NASCAR: 66, COLLEGE_BASEBALL: 58 },
  california: { MLB: 82, NBA: 84, SOCCER_INTL: 72, MLS: 64, NHL: 60, CFB: 68, RACING_OPEN: 40 },
  mountain: { NBA: 80, NHL: 78, NFL: 96, CFB: 74, MLB: 66 },
  southwest: { NBA: 80, CFB: 70, NFL: 88, MLB: 66, SOCCER_INTL: 66 },
  pacificnw: { MLS: 80, SOCCER_INTL: 74, NFL: 94, MLB: 76, NHL: 66, WNBA: 60 },
  west: { NHL: 80, NFL: 90, MMA: 72, NBA: 72, SOCCER_INTL: 62 },
};

export function regionInterest(region: Region, league: LeagueKey): number {
  return REGION_PROFILES[region]?.[league] ?? DEFAULT_PROFILE[league] ?? 40;
}

export function getMarket(key?: string): Market | undefined {
  return MARKETS.find((m) => m.key === key);
}

/** Map a geocoded lat/lng (e.g. from Google Maps) to the nearest known market. */
export function nearestMarket(lat: number, lng: number): Market {
  let best = MARKETS[0];
  let bestD = Infinity;
  for (const m of MARKETS) {
    const d = (m.lat - lat) ** 2 + (m.lng - lng) ** 2;
    if (d < bestD) {
      bestD = d;
      best = m;
    }
  }
  return best;
}
