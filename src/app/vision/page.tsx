"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { SectionHeader, Pill } from "@/components/ui";

const NOW = [
  "Daily TV command board built by hand in seconds",
  "Photo-mapped TV wall so any new bartender knows which screen is which",
  "Per-service channel / app / device / remote cheat sheet",
  "Local-first priority + sound rules tuned for an Atlanta crowd",
  "Mobile staff view + one-tap print sheet",
];

const NEXT = [
  {
    title: "Live schedule import",
    body: "Wire a free/low-cost sports schedule feed to pre-fill matchups, start times, and national-vs-local broadcast windows. The data model already separates events from broadcast options for exactly this.",
  },
  {
    title: "Blackout intelligence",
    body: "Auto-flag Braves games that are likely blacked out locally and suggest the national fallback (TBS / FOX / Apple TV+ / MLB Network).",
  },
  {
    title: "Multi-bar rollout",
    body: "Organizations own many bars. The same board engine drives a 4-TV neighborhood spot or a 30-TV stadium bar — everything is bar-specific config, nothing is hardcoded to Hooligans.",
  },
  {
    title: "Shift handoff & email",
    body: "Publish the board and email it to the staff list (Resend) before doors open; track who confirmed which TV.",
  },
  {
    title: "Manager auth & roles",
    body: "Clerk-backed manager login with bartender / viewer roles. The staff link stays read-only; edit mode unlocks for managers only.",
  },
];

const STACK = [
  "Next.js",
  "React",
  "TypeScript",
  "Tailwind",
  "Drizzle ORM",
  "Neon Postgres",
  "Clerk",
  "Resend",
  "Netlify",
];

export default function VisionPage() {
  const { resetAll } = useStore();
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader kicker="About" title="Platform Vision" />

      <div className="panel relative overflow-hidden p-6 sm:p-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-accent/60 to-transparent" />
        <h2 className="max-w-3xl font-display text-2xl font-bold leading-tight text-chalk sm:text-3xl">
          One board that tells every bartender exactly what&apos;s on each TV,
          where to find it, which remote to grab, and whether the sound stays on
          music.
        </h2>
        <p className="mt-3 max-w-2xl text-chalk-dim">
          GameBoard Pro starts as a fast manual tool that works on night one — no
          API, no integration project, no training. It&apos;s built so live data
          can slot in later without re-platforming.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {STACK.map((s) => (
            <span
              key={s}
              className="rounded-md border border-ink-600 bg-ink-800 px-2.5 py-1 font-mono text-xs text-chalk-dim"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <section className="panel p-5">
          <div className="mb-3 flex items-center gap-2">
            <Pill tone="signal">Shipping today</Pill>
          </div>
          <ul className="flex flex-col gap-2">
            {NOW.map((n) => (
              <li key={n} className="flex items-start gap-2 text-sm text-chalk-dim">
                <span className="mt-0.5 text-signal">✓</span>
                {n}
              </li>
            ))}
          </ul>
        </section>

        <section className="panel p-5">
          <div className="mb-3 flex items-center gap-2">
            <Pill tone="amber">On the roadmap</Pill>
          </div>
          <div className="flex flex-col divide-y divide-ink-700">
            {NEXT.map((n) => (
              <div key={n.title} className="py-3 first:pt-0 last:pb-0">
                <div className="font-semibold text-chalk">{n.title}</div>
                <p className="mt-0.5 text-sm text-chalk-dim">{n.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="panel flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <div className="font-semibold text-chalk">Want a clean slate?</div>
          <p className="text-sm text-chalk-faint">
            Reset all local data back to the seeded Hooligans demo.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/" className="btn btn-ghost">
            Back to board
          </Link>
          <button
            onClick={() => {
              if (confirm("Reset all local data to the seeded demo? This cannot be undone."))
                resetAll();
            }}
            className="btn btn-danger"
          >
            Reset demo data
          </button>
        </div>
      </div>
    </div>
  );
}
