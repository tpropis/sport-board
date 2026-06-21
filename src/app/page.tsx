"use client";

import Link from "next/link";
import { useStore, todayISO, sortByTvOrder } from "@/lib/store";
import { LayoutViewer } from "@/components/PhotoMapper";
import { TVBadge, Pill } from "@/components/ui";

function formatLong(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function CommandCenter() {
  const { activeBar, getBoard } = useStore();
  const today = todayISO();
  const board = getBoard(today);
  const assignments = sortByTvOrder(board.assignments, activeBar.tvOrder);
  const confirmed = assignments.filter((a) => a.confirmed).length;
  const mainPhoto = activeBar.layoutPhotos.find((p) => p.markers.length > 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Hero status bar — operations console, not a landing page */}
      <section className="panel relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-accent/60 to-transparent" />
        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-amber-accent/80">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal" />
              Live · {activeBar.name} · {activeBar.location}
            </div>
            <h1 className="mt-2 font-display text-4xl font-extrabold leading-none tracking-tightest text-chalk sm:text-5xl">
              Today&apos;s Command Board
            </h1>
            <p className="mt-2 text-chalk-dim">{formatLong(today)}</p>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <Pill tone={board.published ? "signal" : "amber"}>
                {board.published ? "● Published" : "○ Draft"}
              </Pill>
              <Pill tone="neutral">
                {assignments.length} TV{assignments.length === 1 ? "" : "s"} assigned
              </Pill>
              <Pill tone={confirmed === assignments.length && assignments.length > 0 ? "signal" : "alert"}>
                {confirmed}/{assignments.length} confirmed
              </Pill>
            </div>

            <div className="mt-6 grid gap-2.5 sm:grid-cols-3">
              <Link href="/board" className="btn btn-primary py-3 text-base">
                Open Today&apos;s Board
              </Link>
              <Link href="/edit" className="btn btn-ghost py-3 text-base">
                Edit Board
              </Link>
              <Link href="/tv-layout" className="btn btn-ghost py-3 text-base">
                TV Layout
              </Link>
            </div>
            <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
              <Link href="/staff" className="btn btn-signal py-2.5">
                → Staff View (bartenders)
              </Link>
              <Link href="/print" className="btn btn-ghost py-2.5">
                🖨 Print Sheet
              </Link>
            </div>
          </div>

          {/* TV order strip — the painted wall numbers, in real order */}
          <div className="rounded-lg border border-ink-700 bg-ink-900/60 p-4">
            <div className="field-label mb-3">TV wall · left → right</div>
            <div className="flex flex-wrap gap-2">
              {activeBar.tvOrder.map((n) => {
                const a = assignments.find((x) => x.tvNumber === n);
                return (
                  <div key={n} className="flex flex-col items-center gap-1">
                    <TVBadge number={n} size="md" />
                    <span className="max-w-[64px] truncate text-center text-[10px] text-chalk-faint">
                      {a ? (a.team1 ?? a.eventName) : "open"}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 border-t border-ink-700 pt-3 text-xs text-chalk-faint">
              {activeBar.setupNotes}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        {/* Assignments preview */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-chalk">
              Today&apos;s Assignments
            </h2>
            <Link href="/board" className="text-sm text-amber-glow hover:underline">
              View full board →
            </Link>
          </div>
          <div className="flex flex-col gap-2.5">
            {assignments.length === 0 && (
              <div className="panel p-6 text-sm text-chalk-faint">
                No assignments yet.{" "}
                <Link href="/edit" className="text-amber-glow hover:underline">
                  Build today&apos;s board →
                </Link>
              </div>
            )}
            {assignments.slice(0, 5).map((a) => (
              <Link
                key={a.id}
                href="/board"
                className="panel flex items-center gap-3 p-3 transition-colors hover:border-amber-accent/40"
              >
                <TVBadge number={a.tvNumber} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-chalk">
                    {a.team1 && a.team2 ? `${a.team1} vs ${a.team2}` : a.eventName}
                  </div>
                  <div className="truncate text-xs text-chalk-dim">
                    {a.watchOn}
                    {a.directvChannel ? ` · DIRECTV ${a.directvChannel}` : ""}
                    {a.streamingApp ? ` · ${a.streamingApp}` : ""}
                  </div>
                </div>
                <span className="tnum shrink-0 font-mono text-sm text-amber-glow">
                  {a.startTime}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* TV layout preview */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-chalk">
              TV Photo Layout
            </h2>
            <Link href="/tv-layout" className="text-sm text-amber-glow hover:underline">
              Open mapper →
            </Link>
          </div>
          {mainPhoto ? (
            <>
              <LayoutViewer photo={mainPhoto} />
              <p className="mt-2 text-xs text-chalk-faint">
                {mainPhoto.name} · {mainPhoto.markers.length} TVs mapped
              </p>
            </>
          ) : (
            <div className="panel p-6 text-sm text-chalk-faint">
              No layout photo mapped yet.{" "}
              <Link href="/tv-layout" className="text-amber-glow hover:underline">
                Map your TV wall →
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
