/**
 * GameBoard Pro — database schema (Drizzle ORM / Postgres / Neon).
 *
 * The MVP UI runs on a seeded client store (see src/lib/store). This schema is
 * the production data model: it mirrors the same shapes so the store can be
 * swapped for real persistence with minimal churn. Nothing here assumes TVs are
 * numbered sequentially — TV order and labels are data, never code.
 */
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bars = pgTable("bars", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id),
  name: text("name").notNull(),
  location: text("location"),
  // Custom TV order, e.g. [3,4,9,5,6,7,8]. Never assumed sequential.
  tvOrder: jsonb("tv_order").$type<number[]>().default([]).notNull(),
  defaultProvider: text("default_provider"),
  defaultSoundRule: text("default_sound_rule"),
  staffViewEnabled: boolean("staff_view_enabled").default(true).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  // Clerk user id when auth is wired up.
  externalId: text("external_id"),
  organizationId: uuid("organization_id").references(() => organizations.id),
  email: text("email"),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const staffRoles = pgTable("staff_roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  barId: uuid("bar_id").references(() => bars.id),
  role: text("role").notNull(), // manager | bartender | viewer
});

export const tvs = pgTable("tvs", {
  id: uuid("id").defaultRandom().primaryKey(),
  barId: uuid("bar_id").references(() => bars.id),
  number: integer("number").notNull(), // the painted label, e.g. 9
  position: integer("position").notNull(), // index in the wall order
  label: text("label"), // optional override, e.g. "TV 9"
  description: text("description"),
  defaultDeviceId: uuid("default_device_id"),
  defaultRemoteId: uuid("default_remote_id"),
  defaultInput: text("default_input"),
  ignored: boolean("ignored").default(false).notNull(), // e.g. Keno TV
  notes: text("notes"),
});

export const tvLayoutPhotos = pgTable("tv_layout_photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  barId: uuid("bar_id").references(() => bars.id),
  name: text("name").notNull(), // "Main Bar View", "Side Angle", "Back Bar View"
  imageUrl: text("image_url").notNull(), // data URL or hosted URL
  sortOrder: integer("sort_order").default(0).notNull(),
});

export const tvMarkers = pgTable("tv_markers", {
  id: uuid("id").defaultRandom().primaryKey(),
  photoId: uuid("photo_id").references(() => tvLayoutPhotos.id),
  tvNumber: integer("tv_number").notNull(),
  // Stored as percentages (0-100) so markers survive any image size.
  x: real("x").notNull(),
  y: real("y").notNull(),
  size: real("size").default(48).notNull(),
  note: text("note"),
  ignored: boolean("ignored").default(false).notNull(),
});

export const devices = pgTable("devices", {
  id: uuid("id").defaultRandom().primaryKey(),
  barId: uuid("bar_id").references(() => bars.id),
  name: text("name").notNull(), // DIRECTV box, Apple TV, Roku, Fire TV...
  type: text("type"),
  notes: text("notes"),
});

export const remotes = pgTable("remotes", {
  id: uuid("id").defaultRandom().primaryKey(),
  barId: uuid("bar_id").references(() => bars.id),
  name: text("name").notNull(), // Main DIRECTV Remote, Remote 1...
  notes: text("notes"),
});

export const services = pgTable("services", {
  id: uuid("id").defaultRandom().primaryKey(),
  barId: uuid("bar_id").references(() => bars.id),
  name: text("name").notNull(),
  available: boolean("available").default(false).notNull(),
  loginSaved: boolean("login_saved").default(false).notNull(),
  businessAccount: boolean("business_account").default(false).notNull(),
  deviceUsed: text("device_used"),
  remoteUsed: text("remote_used"),
  channelNumber: text("channel_number"),
  notes: text("notes"),
});

export const leagues = pgTable("leagues", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(), // MLB, NFL, NBA, CFB, MLS, EPL...
  sport: text("sport").notNull(),
});

export const teams = pgTable("teams", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  leagueId: uuid("league_id").references(() => leagues.id),
  local: boolean("local").default(false).notNull(), // Atlanta / Georgia teams
  abbreviation: text("abbreviation"),
});

export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  barId: uuid("bar_id").references(() => bars.id),
  name: text("name").notNull(),
  team1: text("team1"),
  team2: text("team2"),
  sport: text("sport"),
  league: text("league"),
  startTime: text("start_time"), // local "HH:MM" for the board day
  endTime: text("end_time"),
  local: boolean("local").default(false).notNull(),
  bigGame: boolean("big_game").default(false).notNull(),
  playoff: boolean("playoff").default(false).notNull(),
  notes: text("notes"),
});

export const broadcastOptions = pgTable("broadcast_options", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").references(() => events.id),
  channelName: text("channel_name"), // BravesVision, FS1, TBS...
  directvChannel: text("directv_channel"), // e.g. 645
  streamingApp: text("streaming_app"),
  national: boolean("national").default(false).notNull(),
  note: text("note"), // "Subject to blackout or national exclusivity."
  priority: integer("priority").default(0).notNull(),
});

export const dailyBoards = pgTable("daily_boards", {
  id: uuid("id").defaultRandom().primaryKey(),
  barId: uuid("bar_id").references(() => bars.id),
  date: text("date").notNull(), // YYYY-MM-DD
  published: boolean("published").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const boardAssignments = pgTable("board_assignments", {
  id: uuid("id").defaultRandom().primaryKey(),
  boardId: uuid("board_id").references(() => dailyBoards.id),
  tvNumber: integer("tv_number").notNull(),
  priority: integer("priority").default(0).notNull(),
  eventName: text("event_name"),
  team1: text("team1"),
  team2: text("team2"),
  sport: text("sport"),
  league: text("league"),
  startTime: text("start_time"),
  endTime: text("end_time"),
  watchOn: text("watch_on"), // channel name / network
  directvChannel: text("directv_channel"),
  streamingApp: text("streaming_app"),
  device: text("device"),
  remote: text("remote"),
  soundRule: text("sound_rule"),
  labels: jsonb("labels").$type<string[]>().default([]).notNull(),
  notes: text("notes"),
  confirmed: boolean("confirmed").default(false).notNull(),
});

export const soundRules = pgTable("sound_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  barId: uuid("bar_id").references(() => bars.id),
  label: text("label").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0).notNull(),
});

export const priorityRules = pgTable("priority_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  barId: uuid("bar_id").references(() => bars.id),
  rank: integer("rank").notNull(),
  label: text("label").notNull(),
  local: boolean("local").default(false).notNull(),
});

export const notes = pgTable("notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  barId: uuid("bar_id").references(() => bars.id),
  boardId: uuid("board_id").references(() => dailyBoards.id),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
