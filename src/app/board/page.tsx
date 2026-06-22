"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore, zoneLabel, sortByTvOrder } from "@/lib/store";
import { AssignmentCard } from "@/components/AssignmentCard";
import { SectionHeader, TVBadge, LabelChip, Pill, DateStepper } from "@/components/ui";
import { deriveLabels } from "@/lib/constants";
import { getProvider, channelFor, matchNetwork } from "@/lib/providers";
import { LiveScheduleProvider, useLive } from "@/lib/live";
import type { Assignment } from "@/lib/types";
import { scoreEvent } from "@/lib/priority";
import { getMarket } from "@/lib/markets";

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

export default function TodaysBoardPage() {
  return (
    <LiveScheduleProvider>
      <TodaysBoard />
    </LiveScheduleProvider>
  );
}

function TodaysBoard() {
  const { activeBar, getBoard, currentDate: today } = useStore();
  const [view, setView] = useState<"cards" | "table">("cards");
  const board = getBoard(today);
  const assignments = sortByTvOrder(board.assignments, activeBar.tvOrder);
  const confirmed = assignments.filter((a) => a.confirmed).length;
  const providerName = getProvider(activeBar.providerId)?.name ?? "Channel";
  const tz = zoneLabel(activeBar.timezone);

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader kicker={`${activeBar.name} · ${formatLong(today)}`} title="Today's GameBoard">
        <DateStepper />
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

      <BoardLiveAlerts assignments={assignments} />

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

function BoardLiveAlerts({ assignments }: { assignments: Assignment[] }) {
  const { activeBar, currentDate, upsertAssignment } = useStore();
  const live = useLive();
  if (!live) return null;

  const market = getMarket(activeBar.market);
  const disrupted = assignments
    .map((a) => ({ a, ev: live.lookup(a.eventId, a.eventName) }))
    .filter(({ ev }) => ev && (ev.status.state === "delayed" || ev.status.state === "postponed"));

  if (disrupted.length === 0) return null;

  const fmtTime = (iso: string) => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        timeZone: activeBar.timezone,
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(iso));
    } catch {
      return "";
    }
  };

  // Rank available games (not already on the board) by crowd draw.
  const onBoard = new Set(assignments.map((a) => a.eventName.toLowerCase()));
  const candidates = live.all
    .filter(
      (e) =>
        !onBoard.has(e.name.toLowerCase()) &&
        (e.status.state === "in" || e.status.state === "pre"),
    )
    .map((e) => ({ e, s: scoreEvent(blankFromEvent(e), market).score }))
    .sort((x, y) => y.s - x.s)
    .map((x) => x.e);

  function swap(a: Assignment, cand: (typeof candidates)[number]) {
    const network = cand.networks[0];
    const streaming = cand.networks.find((n) => /app|\+|peacock|season pass|max|tv$/i.test(n));
    const ch = channelFor(matchNetwork(network) ?? "", activeBar.providerId);
    upsertAssignment(currentDate, {
      ...a, // keep id, tvNumber, device/remote, sound, confirmed reset below
      eventId: cand.id,
      eventName: cand.name,
      team1: cand.team1,
      team2: cand.team2,
      sport: cand.sport,
      league: cand.league,
      startTime: fmtTime(cand.startUtc),
      watchOn: network,
      directvChannel: ch,
      streamingApp: streaming,
      labels: cand.local ? ["LOCAL"] : [],
      notes: [cand.venue, cand.city].filter(Boolean).join(" · ") || undefined,
      confirmed: false,
    });
  }

  return (
    <div className="rounded-lg border border-amber-accent/50 bg-amber-accent/10 p-4">
      <div className="mb-3 flex items-center gap-2 font-display font-bold text-amber-glow">
        ⚠ Live disruption — {disrupted.length} TV{disrupted.length > 1 ? "s" : ""} need a look
      </div>
      <ul className="flex flex-col gap-2 text-sm">
        {disrupted.map(({ a, ev }, i) => {
          const cand = candidates[i] ?? candidates[0];
          return (
            <li
              key={a.id}
              className="flex flex-wrap items-center gap-2 rounded-md border border-ink-700 bg-ink-900/50 px-3 py-2"
            >
              <span className="font-semibold text-chalk">TV {a.tvNumber}</span>
              <span className="text-chalk-dim">{a.eventName}</span>
              <span className="label-chip border-amber-accent/50 bg-amber-accent/15 text-amber-glow">
                {ev!.status.detail}
              </span>
              {cand && (
                <button
                  onClick={() => swap(a, cand)}
                  className="btn btn-signal ml-auto px-3 py-1 text-xs"
                  title={`${cand.name}${cand.networks[0] ? ` · ${cand.networks[0]}` : ""}`}
                >
                  ⇄ Swap to {cand.team1 ?? cand.name}
                  {cand.networks[0] ? ` (${cand.networks[0]})` : ""}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-chalk-faint">
        Swap drops the best available game onto that TV and re-ranks the board ·{" "}
        <Link href="/schedule" className="text-amber-glow hover:underline">
          browse the full schedule
        </Link>
      </p>
    </div>
  );
}

// Minimal shape so scoreEvent can rank a ScheduleEvent.
function blankFromEvent(e: { name: string; league: string; sport: string; local: boolean }): Assignment {
  return {
    id: "tmp",
    tvNumber: 0,
    priority: 0,
    eventName: e.name,
    league: e.league,
    sport: e.sport,
    soundRule: "Music stays on",
    labels: e.local ? ["LOCAL"] : [],
    confirmed: false,
  };
}
