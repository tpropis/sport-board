/**
 * TV providers + channel lineups.
 *
 * The same network is a different channel number on every provider — FOX is 5
 * on DIRECTV in Atlanta but something else on Xfinity. So a bar picks its
 * provider, and the channel for any network is looked up from that provider's
 * lineup. That way the board / staff view can always show the right number.
 *
 * Satellite (DIRECTV, DISH) numbers are national and reliable. Cable numbers
 * (Xfinity, Spectrum, Cox, Optimum, Fios) vary by regional headend, so they're
 * left for the manager to fill in. Live-TV streaming services tune by app, not
 * a channel number. Broadcast locals (FOX/NBC/ABC/CBS/CW) follow the local
 * affiliate and vary by market — Atlanta numbers are seeded here.
 */

export type ProviderType = "satellite" | "cable" | "streaming";

export interface Provider {
  id: string;
  name: string;
  type: ProviderType;
  note?: string;
}

export const PROVIDERS: Provider[] = [
  { id: "directv", name: "DIRECTV", type: "satellite", note: "National channel numbers." },
  { id: "dish", name: "DISH Network", type: "satellite", note: "National channel numbers." },
  { id: "xfinity", name: "Xfinity (Comcast)", type: "cable", note: "Numbers vary by region — confirm locally." },
  { id: "spectrum", name: "Spectrum (Charter)", type: "cable", note: "Numbers vary by region — confirm locally." },
  { id: "cox", name: "Cox", type: "cable", note: "Numbers vary by region — confirm locally." },
  { id: "optimum", name: "Optimum (Altice)", type: "cable", note: "Numbers vary by region — confirm locally." },
  { id: "fios", name: "Verizon Fios", type: "cable", note: "Numbers vary by region — confirm locally." },
  { id: "uverse", name: "AT&T U-verse", type: "cable", note: "Numbers vary by region — confirm locally." },
  { id: "directv_stream", name: "DIRECTV Stream", type: "streaming", note: "Tune by network name in the app." },
  { id: "youtubetv", name: "YouTube TV", type: "streaming", note: "Tune by network name in the app." },
  { id: "hululive", name: "Hulu + Live TV", type: "streaming", note: "Tune by network name in the app." },
  { id: "fubo", name: "Fubo", type: "streaming", note: "Tune by network name in the app." },
  { id: "sling", name: "Sling TV", type: "streaming", note: "Tune by network name in the app." },
];

/** Sports-relevant networks, in a sensible scanning order. */
export const NETWORKS: string[] = [
  "ESPN",
  "ESPN2",
  "ESPNU",
  "ESPNews",
  "SEC Network",
  "ACC Network",
  "Big Ten Network",
  "FS1",
  "FS2",
  "FOX",
  "NBC",
  "ABC",
  "CBS",
  "CW",
  "TNT",
  "TBS",
  "truTV",
  "USA Network",
  "NBA TV",
  "MLB Network",
  "NFL Network",
  "NFL RedZone",
  "NHL Network",
  "Golf Channel",
  "CBS Sports Network",
  "Tennis Channel",
  "FanDuel Sports South",
  "Telemundo",
  "Univision",
  // Premium / special-event channels (require a sports package or add-on).
  "MLB Home Run Derby",
  "MLB Strike Zone",
  "ESPN Bases Loaded",
  "NBA League Pass",
  "NHL Center Ice",
  "MLB Extra Innings",
];

/** Broadcast networks whose number follows the local affiliate (varies by market). */
export const LOCAL_NETWORKS = new Set([
  "FOX",
  "NBC",
  "ABC",
  "CBS",
  "CW",
  "Telemundo",
  "Univision",
]);

/** Networks that need a premium package / add-on — bartenders should know. */
export const PREMIUM_NETWORKS = new Set([
  "MLB Home Run Derby",
  "MLB Strike Zone",
  "NFL RedZone",
  "ESPN Bases Loaded",
  "NBA League Pass",
  "NHL Center Ice",
  "MLB Extra Innings",
  "NFL Sunday Ticket",
]);

export function isPremiumNetwork(network?: string): boolean {
  return !!network && PREMIUM_NETWORKS.has(network);
}

type Lineup = Record<string, string>;

/** network -> { providerId -> channel number }. Empty/missing = unknown. */
export const CHANNEL_LINEUP: Record<string, Lineup> = {
  ESPN: { directv: "206", dish: "140", fios: "570" },
  ESPN2: { directv: "209", dish: "143" },
  ESPNU: { directv: "208", dish: "141" },
  ESPNews: { directv: "207", dish: "142" },
  "SEC Network": { directv: "611", dish: "404" },
  "ACC Network": { directv: "612", dish: "402" },
  "Big Ten Network": { directv: "610", dish: "439" },
  FS1: { directv: "219", dish: "150" },
  FS2: { directv: "618", dish: "149" },
  // Atlanta broadcast locals (DIRECTV). Confirmed against the bar's paper: FOX = 5.
  FOX: { directv: "5", dish: "5" },
  NBC: { directv: "11", dish: "11" },
  ABC: { directv: "2", dish: "2" },
  CBS: { directv: "46", dish: "46" },
  CW: { directv: "69", dish: "69" },
  TNT: { directv: "245", dish: "138", fios: "551" },
  TBS: { directv: "247", dish: "139", fios: "552" },
  truTV: { directv: "246", dish: "242" },
  "USA Network": { directv: "242", dish: "105", fios: "550" },
  "NBA TV": { directv: "216", dish: "156" },
  "MLB Network": { directv: "213", dish: "152" },
  "NFL Network": { directv: "212", dish: "154" },
  "NFL RedZone": { directv: "703", dish: "155" },
  "NHL Network": { directv: "215", dish: "157" },
  "Golf Channel": { directv: "218", dish: "401", fios: "593" },
  "CBS Sports Network": { directv: "221", dish: "158" },
  "Tennis Channel": { directv: "217", dish: "400" },
  // Braves / Hawks regional sports network (formerly Bally Sports Southeast).
  "FanDuel Sports South": { directv: "646", dish: "418" },
  Telemundo: { directv: "" },
  Univision: { directv: "" },
  // Premium / special-event channels. DIRECTV 9547 confirmed for the Home Run
  // Derby; others seed the known DIRECTV number where it's a single channel and
  // stay editable per bar (packages/markets vary).
  "MLB Home Run Derby": { directv: "9547" },
  "MLB Strike Zone": { directv: "717", dish: "719" },
  "ESPN Bases Loaded": { directv: "" },
  "NBA League Pass": { directv: "752" },
  "NHL Center Ice": { directv: "769" },
  "MLB Extra Innings": { directv: "718" },
};

export function getProvider(id?: string): Provider | undefined {
  return PROVIDERS.find((p) => p.id === id);
}

/** The channel number for a network on a provider. A per-bar override (the
 *  manager's confirmed number for their market) always wins over the seed. */
export function channelFor(
  network: string,
  providerId?: string,
  overrides?: Record<string, string>,
): string | undefined {
  if (!providerId) return undefined;
  const o = overrides?.[network];
  if (o && o.length > 0) return o;
  const n = CHANNEL_LINEUP[network]?.[providerId];
  return n && n.length > 0 ? n : undefined;
}

/** True when a provider's numbers are nationally consistent (satellite). */
export function isNationalProvider(providerId?: string): boolean {
  const p = getProvider(providerId);
  return p?.type === "satellite";
}

/** Fuzzy-match a free-text "Watch On" value to a known linear network name. */
export function matchNetwork(watchOn?: string): string | undefined {
  if (!watchOn) return undefined;
  const w = watchOn.trim().toLowerCase();
  // exact (case-insensitive) first
  const exact = NETWORKS.find((n) => n.toLowerCase() === w);
  if (exact) return exact;
  // "...app" / "stream" labels are streaming, not a linear channel — don't guess.
  if (/\bapp\b|stream/.test(w)) return undefined;
  // longest network name first so "CBS Sports Network" wins over "CBS"
  const byLen = [...NETWORKS].sort((a, b) => b.length - a.length);
  return byLen.find((n) => new RegExp(`\\b${n.toLowerCase()}\\b`).test(w));
}
