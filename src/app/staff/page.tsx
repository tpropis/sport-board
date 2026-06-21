"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore, todayInZone, zoneLabel, sortByTvOrder } from "@/lib/store";
import { AssignmentCard } from "@/components/AssignmentCard";
import { LayoutViewer } from "@/components/PhotoMapper";
import { TVBadge } from "@/components/ui";

function formatLong(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function StaffView() {
  const { activeBar, getBoard, ready } = useStore();
  const today = todayInZone(activeBar.timezone);
  const board = getBoard(today);
  const assignments = sortByTvOrder(board.assignments, activeBar.tvOrder);
  const tz = zoneLabel(activeBar.timezone);
  const photos = activeBar.layoutPhotos.filter((p) => p.markers.length > 0);
  const [activePhoto, setActivePhoto] = useState(0);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-chalk-faint">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-950 pb-16">
      {/* Minimal staff header */}
      <header className="sticky top-0 z-20 border-b border-ink-700 bg-ink-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div>
            <div className="font-display text-lg font-extrabold leading-none text-chalk">
              {activeBar.name}
            </div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-amber-accent/80">
              Staff Board · {formatLong(today)}
              {tz && <span className="text-chalk-faint"> · all times {tz}</span>}
            </div>
          </div>
          <Link href="/" className="btn btn-ghost px-3 py-1.5 text-xs no-print">
            Manager →
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-5">
        {!board.published && (
          <div className="rounded-md border border-amber-accent/40 bg-amber-accent/10 px-4 py-2.5 text-sm text-amber-glow">
            This board is still a draft. Confirm with a manager before relying on it.
          </div>
        )}

        {/* TV photo layout */}
        {photos.length > 0 && (
          <section>
            <h2 className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-chalk-faint">
              Which TV is which
            </h2>
            {photos.length > 1 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {photos.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => setActivePhoto(i)}
                    className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${
                      i === activePhoto
                        ? "border-amber-accent/50 bg-amber-accent/15 text-amber-glow"
                        : "border-ink-600 bg-ink-800 text-chalk-dim"
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
            <LayoutViewer photo={photos[activePhoto]} />
            <p className="mt-2 text-xs text-chalk-faint">{activeBar.setupNotes}</p>
          </section>
        )}

        {/* Quick TV jump strip */}
        <div className="flex flex-wrap gap-2">
          {assignments.map((a) => (
            <a
              key={a.id}
              href={`#tv-${a.tvNumber}`}
              className="flex flex-col items-center gap-1"
            >
              <TVBadge number={a.tvNumber} size="sm" />
            </a>
          ))}
        </div>

        {/* Assignment cards */}
        <section className="flex flex-col gap-3">
          {assignments.length === 0 && (
            <div className="panel p-8 text-center text-chalk-dim">
              No games assigned yet today.
            </div>
          )}
          {assignments.map((a) => (
            <div key={a.id} id={`tv-${a.tvNumber}`} className="scroll-mt-20">
              <AssignmentCard a={a} variant="staff" />
            </div>
          ))}
        </section>

        {board.generalNotes && (
          <div className="panel p-4">
            <div className="field-label mb-1">Notes</div>
            <p className="text-sm text-chalk-dim">{board.generalNotes}</p>
          </div>
        )}

        <p className="pt-2 text-center text-xs text-chalk-faint">
          Default sound is music unless a card says otherwise.
        </p>
      </main>
    </div>
  );
}
