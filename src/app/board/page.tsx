"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore, zoneLabel, sortByTvOrder, formatEventTime } from "@/lib/store";
import { autoBuildAssignments } from "@/lib/autobuild";
import { AssignmentCard } from "@/components/AssignmentCard";
import { SectionHeader, TVBadge, LabelChip, Pill, DateStepper } from "@/components/ui";
import { deriveLabels, matchupTitle } from "@/lib/constants";
import { getProvider, pickBroadcast } from "@/lib/providers";
import { useLive } from "@/lib/live";
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

export default function TodaysBoard() {
  const { activeBar, getBoard, saveBoard, newAssignmentId, currentDate: today } =
    useStore();
  const [view, setView] = useState<"cards" | "byTv" | "table">(
    activeBar.branding?.defaultBoardView ?? "byTv",
  );
  const live = useLive();
  const board = getBoard(today);
  const assignments = sortByTvOrder(board.assignments, activeBar.tvOrder);
  const confirmed = assignments.filter((a) => a.confirmed).length;
  const providerName = getProvider(activeBar.providerId)?.name ?? "Channel";
  const tz = zoneLabel(activeBar.timezone);

  const fmtTime = (iso: string) => formatEventTime(iso, activeBar.timezone);

  function autoBuild() {
    const events = live?.all ?? [];
    if (events.length === 0) return;
    const built = autoBuildAssignments(events, activeBar, fmtTime, newAssignmentId);
    saveBoard({
      date: today,
      published: true,
      assignments: built,
      generalNotes: board.generalNotes,
    });
  }


  return (
    <div className="flex flex-col gap-6">
      <SectionHeader kicker={`${activeBar.name} · ${formatLong(today)}`} title="Today's GameBoard">
        <DateStepper />
        {tz && <Pill tone="neutral">All times {tz}</Pill>}
        <Pill tone={confirmed === assignments.length && assignments.length > 0 ? "signal" : "alert"}>
          {confirmed}/{assignments.length} confirmed
        </Pill>
        <div className="flex overflow-hidden rounded-md border border-ink-600">
          {([["byTv", "By TV"], ["cards", "Cards"], ["table", "Table"]] as const).map(
            ([v, label]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-sm font-semibold ${
                  view === v ? "bg-amber-accent/20 text-amber-glow" : "bg-ink-800 text-chalk-dim"
                }`}
              >
                {label}
              </button>
            ),
          )}
        </div>
        {live && live.all.length > 0 && (
          <button onClick={autoBuild} className="btn btn-signal">
            ⚡ Auto-build from schedule
          </button>
        )}
        <Link href="/edit" className="btn btn-primary">
          Edit Board
        </Link>
      </SectionHeader>

      <BoardLiveAlerts assignments={assignments} />

      {assignments.length === 0 ? (
        <div className="panel flex flex-col items-center gap-4 p-10 text-center">
          <div>
            <p className="font-display text-lg font-bold text-chalk">
              No board for {formatLong(today)} yet
            </p>
            <p className="mt-1 text-sm text-chalk-dim">
              {live && live.all.length > 0
                ? "Auto-build a full board from this day's schedule, ranked by crowd draw — then fine-tune in Edit."
                : "No games found for this day. Check the Full Schedule or pick another date."}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {live && live.all.length > 0 && (
              <button onClick={autoBuild} className="btn btn-signal">
                ⚡ Auto-build {live.all.length} games → board
              </button>
            )}
            <Link href="/schedule" className="btn btn-ghost">
              📡 Full Schedule
            </Link>
            <Link href="/edit" className="btn btn-ghost">
              Build manually
            </Link>
          </div>
        </div>
      ) : view === "byTv" ? (
        <ByTvView assignments={assignments} tvOrder={activeBar.tvOrder} providerName={providerName} tz={tz} />
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
                        {matchupTitle(a)}
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

  const fmtTime = (iso: string) => formatEventTime(iso, activeBar.timezone);

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
    const { watchOn, channel, streaming } = pickBroadcast(
      cand.networks,
      activeBar.providerId,
      activeBar.channelOverrides?.[activeBar.providerId ?? ""],
    );
    upsertAssignment(currentDate, {
      ...a, // keep id, tvNumber, device/remote, sound, confirmed reset below
      eventId: cand.id,
      eventName: cand.name,
      team1: cand.team1,
      team2: cand.team2,
      sport: cand.sport,
      league: cand.league,
      startTime: fmtTime(cand.startUtc),
      watchOn,
      directvChannel: channel,
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

function ByTvView({
  assignments,
  tvOrder,
  providerName,
  tz,
}: {
  assignments: Assignment[];
  tvOrder: number[];
  providerName: string;
  tz: string;
}) {
  // Group by TV, in wall order; each TV shows its games in time order.
  const byTv = tvOrder
    .map((n) => ({ tv: n, games: assignments.filter((a) => a.tvNumber === n) }))
    .filter((g) => g.games.length > 0);

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {byTv.map(({ tv, games }) => (
        <div key={tv} className="panel overflow-hidden">
          <div className="flex items-center gap-2 border-b border-ink-700 bg-ink-900/60 px-3 py-2">
            <TVBadge number={tv} size="sm" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-chalk-faint">
              TV {tv}
            </span>
            {games.length > 1 && (
              <span className="ml-auto rounded-full border border-amber-accent/40 bg-amber-accent/10 px-2 py-0.5 text-[10px] font-semibold text-amber-glow">
                {games.length} games today
              </span>
            )}
          </div>
          <div className="divide-y divide-ink-700/60">
            {games.map((a) => (
              <GameRow key={a.id} a={a} providerName={providerName} tz={tz} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function GameRow({ a, providerName, tz }: { a: Assignment; providerName: string; tz: string }) {
  const { activeBar } = useStore();
  const live = useLive()?.lookup(a.eventId, a.eventName);
  const [open, setOpen] = useState(false);

  const matchup = a.team1 && a.team2 ? `${a.team1} vs ${a.team2}` : a.eventName;
  const real = !/^(tbd|tba|undecided)$/i.test((a.team1 ?? "").trim());
  const title = a.team1 && a.team2 && real ? matchup : a.eventName;

  // "Why it's on" — draw reasoning from the engine (skip for filler).
  const draw = a.filler ? null : scoreEvent(a, getMarket(activeBar.market));

  return (
    <div className={a.filler ? "bg-ink-900/40" : ""}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-ink-800/40"
      >
        <div className="w-16 shrink-0">
          <div className={`tnum font-mono text-sm font-bold ${a.filler ? "text-chalk-faint" : "text-amber-glow"}`}>
            {a.startTime === "12:00 AM" ? "All day" : a.startTime || "—"}
          </div>
          {tz && a.startTime && a.startTime !== "12:00 AM" && (
            <div className="font-mono text-[9px] uppercase text-chalk-faint">{tz}</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`truncate font-semibold ${a.filler ? "text-chalk-dim" : "text-chalk"}`}>
              {title}
            </span>
            {a.filler && (
              <span className="shrink-0 rounded border border-ink-600 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-chalk-faint">
                filler
              </span>
            )}
            {live && live.status.state !== "pre" && (
              <span className="shrink-0 rounded bg-signal/15 px-1.5 py-0.5 text-[10px] font-semibold text-signal">
                {live.status.state === "in" && live.status.clock ? live.status.clock : live.status.detail}
                {live.score1 != null ? ` ${live.score1}–${live.score2}` : ""}
              </span>
            )}
          </div>
          <div className="truncate text-xs text-chalk-dim">
            {a.watchOn}
            {a.directvChannel ? ` · ${providerName} ${a.directvChannel}` : ""}
            {a.streamingApp ? ` · ${a.streamingApp}` : ""}
          </div>
          <div className="mt-0.5 text-[11px] text-chalk-faint">🔊 {a.soundRule}</div>
        </div>
        <span className="mt-1 shrink-0 text-chalk-faint">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="space-y-2.5 border-t border-ink-700/60 bg-ink-950/40 px-3 py-3 text-xs">
          {/* What it is */}
          <div>
            <div className="field-label mb-0.5">{a.filler ? "What's on" : "Event"}</div>
            <div className="text-chalk-dim">
              {a.filler ? a.notes : [a.sport, a.league].filter(Boolean).join(" · ") || a.eventName}
              {live?.venue ? ` · ${live.venue}` : ""}
              {live?.city && !live?.venue ? ` · ${live.city}` : ""}
            </div>
          </div>

          {/* Why it's here */}
          {draw && (
            <div>
              <div className="field-label mb-0.5">
                Why this TV · draw {draw.score}
              </div>
              <div className="flex flex-wrap gap-1">
                {draw.reasons.map((r) => (
                  <span key={r} className="rounded border border-ink-600 bg-ink-800 px-1.5 py-0.5 text-chalk-dim">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* How to pull it up */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Detail label="Watch on" value={a.watchOn} />
            <Detail label={`${providerName} ch`} value={a.directvChannel} />
            <Detail label="Streaming" value={a.streamingApp} />
            <Detail label="Device" value={a.device} />
            <Detail label="Remote" value={a.remote} />
            <Detail label="Sound" value={a.soundRule} />
            {live && <Detail label="Status" value={live.status.detail} />}
          </div>

          {a.notes && !a.filler && (
            <p className="rounded border border-ink-700 bg-ink-900/60 px-2 py-1.5 text-chalk-dim">
              <span className="text-chalk-faint">Note: </span>
              {a.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <div className="font-mono text-[9px] uppercase tracking-wider text-chalk-faint">{label}</div>
      <div className="text-chalk-dim">{value}</div>
    </div>
  );
}
