"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore, todayInZone, zoneLabel, sortByTvOrder } from "@/lib/store";
import { AssignmentCard } from "@/components/AssignmentCard";
import { SectionHeader, TVBadge, LabelChip, Pill } from "@/components/ui";
import { deriveLabels } from "@/lib/constants";
import { getProvider } from "@/lib/providers";

function formatLong(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

const COLS = [
  "TV #",
  "Pri",
  "Game / Event",
  "Sport · League",
  "Start",
  "Watch On",
  "DIRECTV",
  "Streaming",
  "Device / Remote",
  "Sound",
  "Notes",
  "✓",
];

export default function TodaysBoard() {
  const { activeBar, getBoard } = useStore();
  const [view, setView] = useState<"cards" | "table">("cards");
  const today = todayInZone(activeBar.timezone);
  const board = getBoard(today);
  const assignments = sortByTvOrder(board.assignments, activeBar.tvOrder);
  const confirmed = assignments.filter((a) => a.confirmed).length;
  const providerName = getProvider(activeBar.providerId)?.name ?? "Channel";
  const tz = zoneLabel(activeBar.timezone);

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader kicker={`${activeBar.name} · ${formatLong(today)}`} title="Today's GameBoard">
        {tz && <Pill tone="neutral">All times {tz}</Pill>}
        <Pill tone={confirmed === assignments.length && assignments.length > 0 ? "signal" : "alert"}>
          {confirmed}/{assignments.length} confirmed
        </Pill>
        <div className="flex overflow-hidden rounded-md border border-ink-600">
          {(["cards", "table"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-sm font-semibold capitalize ${
                view === v ? "bg-amber-accent/20 text-amber-glow" : "bg-ink-800 text-chalk-dim"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <Link href="/edit" className="btn btn-primary">
          Edit Board
        </Link>
      </SectionHeader>

      {assignments.length === 0 ? (
        <div className="panel p-10 text-center">
          <p className="text-chalk-dim">No assignments on today&apos;s board yet.</p>
          <Link href="/edit" className="btn btn-primary mt-4">
            Build today&apos;s board
          </Link>
        </div>
      ) : view === "cards" ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {assignments.map((a) => (
            <AssignmentCard key={a.id} a={a} />
          ))}
        </div>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink-600 text-left">
                {COLS.map((c) => (
                  <th
                    key={c}
                    className="whitespace-nowrap px-3 py-3 font-mono text-[10px] uppercase tracking-wider text-chalk-faint"
                  >
                    {c === "DIRECTV" ? providerName : c === "Start" && tz ? `Start · ${tz}` : c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => {
                const labels = deriveLabels(a);
                return (
                  <tr
                    key={a.id}
                    className={`border-b border-ink-700/60 align-top hover:bg-ink-800/40 ${
                      a.confirmed ? "" : "bg-alert-dim/5"
                    }`}
                  >
                    <td className="px-3 py-3">
                      <TVBadge number={a.tvNumber} size="sm" />
                    </td>
                    <td className="tnum px-3 py-3 font-mono text-chalk-faint">#{a.priority}</td>
                    <td className="px-3 py-3">
                      <div className="font-semibold text-chalk">
                        {a.team1 && a.team2 ? `${a.team1} vs ${a.team2}` : a.eventName}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {labels.slice(0, 3).map((l) => (
                          <LabelChip key={l} label={l} />
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-chalk-dim">
                      {[a.sport, a.league].filter(Boolean).join(" · ")}
                    </td>
                    <td className="tnum whitespace-nowrap px-3 py-3 font-mono text-amber-glow">
                      {a.startTime}
                    </td>
                    <td className="px-3 py-3 font-semibold text-chalk">{a.watchOn}</td>
                    <td className="tnum px-3 py-3 font-mono text-chalk">{a.directvChannel}</td>
                    <td className="px-3 py-3 text-chalk-dim">{a.streamingApp}</td>
                    <td className="px-3 py-3 text-chalk-dim">
                      {a.device}
                      {a.remote ? <div className="text-xs text-chalk-faint">{a.remote}</div> : null}
                    </td>
                    <td className="px-3 py-3 text-chalk-dim">{a.soundRule}</td>
                    <td className="max-w-[220px] px-3 py-3 text-xs text-chalk-faint">{a.notes}</td>
                    <td className="px-3 py-3">
                      {a.confirmed ? (
                        <span className="text-signal">✓</span>
                      ) : (
                        <span className="text-alert">!</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {board.generalNotes && (
        <div className="panel p-4">
          <div className="field-label mb-1">Board notes</div>
          <p className="text-sm text-chalk-dim">{board.generalNotes}</p>
        </div>
      )}

      <p className="text-center text-xs text-chalk-faint">
        Default sound is music unless marked otherwise · {activeBar.setupNotes}
      </p>
    </div>
  );
}
