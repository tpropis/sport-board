/** Domain types shared across the app (mirror the Drizzle schema shapes). */

export type SoundRuleValue =
  | "Music stays on"
  | "Main audio recommended"
  | "Audio optional"
  | "Crowd request only"
  | "Manager decision";

export const SOUND_OPTIONS: SoundRuleValue[] = [
  "Music stays on",
  "Main audio recommended",
  "Audio optional",
  "Crowd request only",
  "Manager decision",
];

export type AssignmentLabel =
  | "LOCAL"
  | "BIG GAME"
  | "PLAYOFF"
  | "STREAMING ONLY"
  | "MAIN AUDIO"
  | "MUSIC STAYS ON"
  | "CONFIRMED"
  | "NEEDS CHECK";

export interface TV {
  number: number;
  position: number;
  description: string;
  defaultDevice?: string;
  defaultRemote?: string;
  defaultInput?: string;
  ignored: boolean;
  notes?: string;
}

export interface TVMarker {
  id: string;
  tvNumber: number;
  x: number; // 0-100 (% of image width)
  y: number; // 0-100 (% of image height)
  size: number; // px diameter at natural display
  note?: string;
  ignored: boolean;
}

export interface LayoutPhoto {
  id: string;
  name: string;
  imageUrl: string; // data URL or placeholder
  markers: TVMarker[];
}

export interface Device {
  id: string;
  name: string;
  type?: string;
  notes?: string;
}

export interface Remote {
  id: string;
  name: string;
  notes?: string;
}

export interface Service {
  id: string;
  name: string;
  available: boolean;
  loginSaved: boolean;
  businessAccount: boolean;
  deviceUsed?: string;
  remoteUsed?: string;
  channelNumber?: string;
  notes?: string;
}

export interface PriorityRule {
  rank: number;
  label: string;
  local: boolean;
}

export interface SoundRule {
  label: string;
  description: string;
}

export interface Assignment {
  id: string;
  eventId?: string; // links to a live ScheduleEvent for status/score updates
  tvNumber: number;
  priority: number;
  eventName: string;
  team1?: string;
  team2?: string;
  sport?: string;
  league?: string;
  startTime?: string;
  endTime?: string;
  watchOn?: string;
  directvChannel?: string;
  streamingApp?: string;
  device?: string;
  remote?: string;
  soundRule: SoundRuleValue;
  labels: AssignmentLabel[];
  notes?: string;
  confirmed: boolean;
}

export interface DailyBoard {
  date: string; // YYYY-MM-DD
  published: boolean;
  assignments: Assignment[];
  generalNotes: string;
}

export interface Bar {
  id: string;
  name: string;
  location: string;
  tvOrder: number[];
  tvs: TV[];
  devices: Device[];
  remotes: Remote[];
  services: Service[];
  layoutPhotos: LayoutPhoto[];
  priorityRules: PriorityRule[];
  soundRules: SoundRule[];
  localTeams: string[];
  market?: string; // market key (see lib/markets) derived from location
  timezone?: string; // IANA timezone for the bar's location, e.g. America/New_York
  lat?: number;
  lng?: number;
  defaultProvider: string;
  providerId?: string; // TV provider id (see lib/providers) — drives channel #s
  // Per-bar channel number overrides: providerId -> network -> number. Lets each
  // bar confirm its real lineup (cable numbers vary by market).
  channelOverrides?: Record<string, Record<string, string>>;
  defaultSoundRule: SoundRuleValue;
  staffViewEnabled: boolean;
  setupNotes: string;
}

export interface AppState {
  activeBarId: string;
  bars: Bar[];
  boards: Record<string, DailyBoard[]>; // barId -> boards
}
