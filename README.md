# GameBoard Pro

**The daily TV command board for sports bars.** One sheet tells every bartender
what game is on which TV, what channel or app it's on, which remote to grab, and
whether the sound stays on music.

Built first for **Hooligans Tavern** (Georgia) — but every bar is configuration,
nothing is hardcoded. Drop in any TV count, any wall order, any service lineup.

![command board](https://img.shields.io/badge/status-MVP-34d17e) ![stack](https://img.shields.io/badge/next.js-14-181b20)

---

## What it does

| Page | For | Purpose |
| --- | --- | --- |
| **Command Center** (`/`) | Manager | At-a-glance board status + quick jumps |
| **Today's GameBoard** (`/board`) | Manager | Full assignment board — cards or dense table |
| **Edit Board** (`/edit`) | Manager | Add/edit/reorder assignments, duplicate, clear, publish |
| **Staff View** (`/staff`) | Bartenders | Mobile-first board with the photo-mapped TV wall |
| **Print View** (`/print`) | Front of house | Clean printable / screenshot-able sheet |
| **TV Layout & Photos** (`/tv-layout`) | Manager | Upload bar photos, drag numbered markers onto each TV |
| **Bar Setup** (`/setup`) | Manager | TVs, custom order, descriptions, devices, remotes, defaults |
| **Services & Streaming** (`/services`) | Manager | What this bar has, on which device/remote/channel |
| **Priority Rules** (`/priority`) | Manager | Local-first ranking + special Braves routing logic |
| **Sound Rules** (`/sound`) | Manager | Music stays on by default; when to switch to game audio |
| **Platform Vision** (`/vision`) | Owners | Where it's headed (live schedules, multi-bar, auth) |

### The TV Layout / Photo Mapping feature

The standout feature. Managers:

- Upload (or use the seeded placeholder of) a bar photo of the TV wall.
- Drop a **numbered, draggable marker** on each visible TV.
- Drag to position, drag the green handle to **resize**, add a **location note**.
- Mark a TV **ignored** (e.g. the Keno TV).
- Keep **multiple views** — Main Bar, Side Angle, Back Bar.

Markers are stored as **percentages** of the image, so they stay locked to the
right screen at any size. The saved layout appears on the **Staff View** and the
**Print View** so a brand-new bartender knows exactly which screen is "TV 9".

TV numbering is **never assumed sequential** — Hooligans runs `3, 4, 9, 5, 6, 7, 8`
left-to-right, and the app renders that exact order everywhere.

---

## Tech stack

- **Next.js 14** (App Router) · **React 18** · **TypeScript** · **Tailwind CSS**
- **Drizzle ORM** schema targeting **Neon** (free Postgres) — see `src/lib/db/schema.ts`
- **Clerk** (free auth) and **Resend** (free email) wired as the production path
- Deploys to **Netlify** (`netlify.toml` included)

### MVP runs with zero backend

Everything works **manually, on night one** — no live sports API, no database
required. The UI is driven by a seeded client store (`src/lib/store.tsx`) that
persists to `localStorage`, pre-loaded with the full Hooligans setup and a sample
board (Braves, Falcons, UGA, Hawks, Atlanta United, national NFL, UFC).

The Drizzle schema mirrors the store shapes one-to-one, so swapping `localStorage`
for Neon later is a data-layer change, not a rewrite.

---

## Getting started

```bash
npm install
npm run dev
# open http://localhost:3000
```

No environment variables are needed for the MVP. To wire up the production
services later, copy `.env.example` to `.env.local` and fill in Neon / Clerk /
Resend keys.

```bash
npm run build   # production build
npm run start   # serve the production build

npm run db:generate   # generate SQL migrations from the Drizzle schema
npm run db:push       # push schema to Neon (needs DATABASE_URL)
```

---

## Design

A bar-office command board, not a SaaS landing page: charcoal base, warm bar-light
glow, amber + signal-green operational accents, scoreboard-style big TV numbers,
tabular-figure timings, strong borders, subtle noise. Manager / Staff modes toggle
from the header.

---

## Data model

Schema lives in [`src/lib/db/schema.ts`](src/lib/db/schema.ts): organizations,
bars, users, staff_roles, tvs, tv_layout_photos, tv_markers, devices, remotes,
services, teams, leagues, events, broadcast_options, daily_boards,
board_assignments, sound_rules, priority_rules, notes.
