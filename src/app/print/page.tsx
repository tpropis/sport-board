"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useStore, zoneLabel, sortByTvOrder } from "@/lib/store";
import { matchupTitle } from "@/lib/constants";
import { getProvider } from "@/lib/providers";
import type { Assignment, Bar, DailyBoard } from "@/lib/types";

function formatLong(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const COPIES_KEY = "gb-print-copies";

export default function PrintView() {
  const { activeBar, getBoard, currentDate: today } = useStore();
  const board = getBoard(today);
  const assignments = sortByTvOrder(board.assignments, activeBar.tvOrder);
  const providerName = getProvider(activeBar.providerId)?.name ?? "Channel";
  const tz = zoneLabel(activeBar.timezone);

  const [copies, setCopies] = useState(2);
  const [autoLink, setAutoLink] = useState("");
  const [copied, setCopied] = useState(false);
  const printedRef = useRef(false);

  // Read query (?copies, ?auto) for kiosk auto-print; else the saved default.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = Number(params.get("copies"));
    const saved = Number(localStorage.getItem(COPIES_KEY));
    const c = q >= 1 && q <= 20 ? q : saved >= 1 && saved <= 20 ? saved : 2;
    setCopies(c);
    if (params.get("auto") && !printedRef.current) {
      printedRef.current = true;
      // Let the sheets render, then fire the print (silent in kiosk mode).
      setTimeout(() => window.print(), 900);
    }
  }, []);
  function pick(n: number) {
    const c = Math.max(1, Math.min(20, n || 1));
    setCopies(c);
    try {
      localStorage.setItem(COPIES_KEY, String(c));
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    setAutoLink(`${window.location.origin}${window.location.pathname}?auto=1&copies=${copies}`);
  }, [copies]);

  function copyLink() {
    navigator.clipboard?.writeText(autoLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="min-h-screen bg-ink-900 py-6 print:bg-white print:py-0">
      {/* Screen controls */}
      <div className="no-print mx-auto mb-4 flex max-w-[800px] flex-wrap items-center justify-between gap-3 px-4">
        <Link href="/board" className="btn btn-ghost">
          ← Back to board
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <span className="field-label">Copies</span>
          <div className="flex overflow-hidden rounded-md border border-ink-600">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => pick(n)}
                className={`px-3 py-1.5 text-sm font-semibold ${
                  copies === n ? "bg-amber-accent/20 text-amber-glow" : "bg-ink-800 text-chalk-dim"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <input
            type="number"
            min={1}
            max={20}
            value={copies}
            onChange={(e) => pick(Number(e.target.value))}
            className="input w-16 text-center"
            aria-label="Number of copies"
          />
          <button onClick={() => window.print()} className="btn btn-primary">
            🖨 Print {copies} cop{copies === 1 ? "y" : "ies"}
          </button>
        </div>
      </div>

      <p className="no-print mx-auto mb-4 max-w-[800px] px-4 text-xs text-chalk-faint">
        One click prints all {copies} cop{copies === 1 ? "y" : "ies"} to your default
        printer as a single job — each on its own page. Set your morning default
        here; it&apos;s remembered on this device.
      </p>

      {/* Auto-print (kiosk) */}
      <details className="no-print mx-auto mb-6 max-w-[800px] rounded-lg border border-ink-700 bg-ink-850/70 px-4 py-3">
        <summary className="cursor-pointer text-sm font-semibold text-amber-glow">
          ⏰ Auto-print each morning (kiosk setup)
        </summary>
        <div className="mt-3 flex flex-col gap-3 text-sm text-chalk-dim">
          <p>
            Open this link on the bar&apos;s back-office computer and it prints{" "}
            <strong className="text-chalk">{copies}</strong> cop
            {copies === 1 ? "y" : "ies"} automatically on load:
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              readOnly
              value={autoLink}
              onFocus={(e) => e.currentTarget.select()}
              className="input flex-1 font-mono text-xs"
            />
            <button onClick={copyLink} className="btn btn-ghost whitespace-nowrap">
              {copied ? "✓ Copied" : "Copy link"}
            </button>
          </div>
          <ol className="ml-4 list-decimal space-y-1.5 text-chalk-faint">
            <li>
              Bookmark that link on a dedicated PC/tablet by the printer and open it
              each morning (or set it as the browser&apos;s home page).
            </li>
            <li>
              For a <strong className="text-chalk">fully silent</strong> print (no
              dialog), launch Chrome once in kiosk-print mode:
              <code className="mt-1 block overflow-x-auto rounded bg-ink-950 px-2 py-1 font-mono text-[11px] text-chalk">
                chrome --kiosk-printing --app=&quot;{autoLink || "…/print?auto=1&copies=2"}&quot;
              </code>
              It then prints straight to the default printer with no prompt.
            </li>
            <li>
              To fully automate the open + close each morning, pair it with the OS
              scheduler (Windows Task Scheduler / macOS <em>launchd</em> / cron).
            </li>
          </ol>
          <p className="text-xs text-chalk-faint">
            Without kiosk mode the link still auto-opens the normal print dialog — one
            keypress to confirm.
          </p>
        </div>
      </details>

      {/* Copies — each on its own printed page */}
      {Array.from({ length: copies }).map((_, i) => (
        <div
          key={i}
          style={i < copies - 1 ? { breakAfter: "page" } : undefined}
          className={i < copies - 1 ? "mb-8 print:mb-0" : ""}
        >
          <div className="no-print mx-auto max-w-[800px] px-4 pb-1 text-[11px] uppercase tracking-widest text-chalk-faint">
            Copy {i + 1} of {copies}
          </div>
          <PrintSheet
            bar={activeBar}
            board={board}
            assignments={assignments}
            today={today}
            tz={tz}
            providerName={providerName}
          />
        </div>
      ))}
    </div>
  );
}

function PrintSheet({
  bar,
  board,
  assignments,
  today,
  tz,
  providerName,
}: {
  bar: Bar;
  board: DailyBoard;
  assignments: Assignment[];
  today: string;
  tz: string;
  providerName: string;
}) {
  const mainPhoto = bar.layoutPhotos.find((p) => p.markers.length > 0);
  return (
    <div className="print-sheet mx-auto max-w-[800px] bg-white px-10 py-8 text-black shadow-xl print:max-w-none print:shadow-none">
      <header className="flex items-end justify-between border-b-4 border-black pb-3">
        <div>
          <h1 className="text-3xl font-extrabold uppercase tracking-tight">
            {bar.name} GameBoard
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
          <div className="text-xs text-neutral-600">{bar.location}</div>
        </div>
      </header>

      {/* TV order diagram */}
      <section className="mt-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
          TV order · left → right
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {bar.tvOrder.map((n, i) => (
            <span key={n} className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded border-2 border-black font-mono text-lg font-bold">
                {n}
              </span>
              {i < bar.tvOrder.length - 1 && <span className="text-neutral-400">→</span>}
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
                  <div className="font-bold">{matchupTitle(a)}</div>
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
        <span>{bar.setupNotes}</span>
        <span>Default sound is music unless marked otherwise.</span>
      </footer>
    </div>
  );
}
