"use client";

import Link from "next/link";
import { useStore, todayInZone, zoneLabel, sortByTvOrder } from "@/lib/store";
import { getProvider } from "@/lib/providers";

function formatLong(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function PrintView() {
  const { activeBar, getBoard } = useStore();
  const today = todayInZone(activeBar.timezone);
  const board = getBoard(today);
  const assignments = sortByTvOrder(board.assignments, activeBar.tvOrder);
  const mainPhoto = activeBar.layoutPhotos.find((p) => p.markers.length > 0);
  const providerName = getProvider(activeBar.providerId)?.name ?? "Channel";
  const tz = zoneLabel(activeBar.timezone);

  return (
    <div className="min-h-screen bg-ink-900 py-6 print:bg-white print:py-0">
      {/* Screen controls */}
      <div className="no-print mx-auto mb-4 flex max-w-[800px] items-center justify-between px-4">
        <Link href="/board" className="btn btn-ghost">
          ← Back to board
        </Link>
        <button onClick={() => window.print()} className="btn btn-primary">
          🖨 Print this sheet
        </button>
      </div>

      {/* The sheet */}
      <div className="print-sheet mx-auto max-w-[800px] bg-white px-10 py-8 text-black shadow-xl print:max-w-none print:shadow-none">
        <header className="flex items-end justify-between border-b-4 border-black pb-3">
          <div>
            <h1 className="text-3xl font-extrabold uppercase tracking-tight">
              {activeBar.name} GameBoard
            </h1>
            <p className="text-sm text-neutral-600">
              {formatLong(today)}
              {tz && ` · all times ${tz}`}
            </p>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
              GameBoard Pro
            </div>
            <div className="text-xs text-neutral-600">{activeBar.location}</div>
          </div>
        </header>

        {/* TV order diagram */}
        <section className="mt-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            TV order · left → right
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {activeBar.tvOrder.map((n, i) => (
              <span key={n} className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded border-2 border-black font-mono text-lg font-bold">
                  {n}
                </span>
                {i < activeBar.tvOrder.length - 1 && (
                  <span className="text-neutral-400">→</span>
                )}
              </span>
            ))}
          </div>
        </section>

        {/* Optional small photo */}
        {mainPhoto && (
          <section className="mt-4">
            <div className="relative inline-block w-full max-w-[420px] overflow-hidden rounded border border-neutral-300">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mainPhoto.imageUrl} alt={mainPhoto.name} className="block w-full" />
              {mainPhoto.markers.map((m) => (
                <span
                  key={m.id}
                  className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-black bg-white font-mono font-bold"
                  style={{
                    left: `${m.x}%`,
                    top: `${m.y}%`,
                    width: m.size * 0.6,
                    height: m.size * 0.6,
                    fontSize: m.size * 0.28,
                  }}
                >
                  {m.tvNumber}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Assignment table */}
        <section className="mt-5">
          <table className="w-full border-collapse text-left text-[12px]">
            <thead>
              <tr className="border-y-2 border-black">
                {["TV", "Pri", "Game / Event", tz ? `Time (${tz})` : "Time", "Watch On", providerName, "Streaming", "Device / Remote", "Sound", "✓"].map(
                  (c) => (
                    <th key={c} className="px-1.5 py-1.5 font-bold uppercase">
                      {c}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a.id} className="border-b border-neutral-300 align-top">
                  <td className="px-1.5 py-2 text-center font-mono text-base font-bold">
                    {a.tvNumber}
                  </td>
                  <td className="px-1.5 py-2 font-mono text-neutral-500">{a.priority}</td>
                  <td className="px-1.5 py-2">
                    <div className="font-bold">
                      {a.team1 && a.team2 ? `${a.team1} vs ${a.team2}` : a.eventName}
                    </div>
                    <div className="text-[10px] text-neutral-500">
                      {[a.sport, a.league].filter(Boolean).join(" · ")}
                    </div>
                    {a.notes && <div className="mt-0.5 text-[10px] italic text-neutral-600">{a.notes}</div>}
                  </td>
                  <td className="whitespace-nowrap px-1.5 py-2 font-mono">{a.startTime}</td>
                  <td className="px-1.5 py-2 font-semibold">{a.watchOn}</td>
                  <td className="px-1.5 py-2 font-mono">{a.directvChannel}</td>
                  <td className="px-1.5 py-2">{a.streamingApp}</td>
                  <td className="px-1.5 py-2">
                    {a.device}
                    {a.remote ? <div className="text-[10px] text-neutral-500">{a.remote}</div> : null}
                  </td>
                  <td className="px-1.5 py-2">{a.soundRule}</td>
                  <td className="px-1.5 py-2 text-center font-bold">{a.confirmed ? "✓" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Notes */}
        <section className="mt-5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            Notes
          </div>
          <p className="mt-1 min-h-[40px] border border-neutral-300 p-2 text-[12px]">
            {board.generalNotes || "—"}
          </p>
        </section>

        <footer className="mt-6 flex flex-wrap justify-between gap-2 border-t-2 border-black pt-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-600">
          <span>{activeBar.setupNotes}</span>
          <span>Default sound is music unless marked otherwise.</span>
        </footer>
      </div>
    </div>
  );
}
