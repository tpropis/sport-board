"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useStore, zoneLabel, sortByTvOrder, formatEventTime } from "@/lib/store";
import { SectionHeader, Pill, Toggle, DateStepper } from "@/components/ui";
import type { ScheduleEvent, ScheduleResponse, EventState } from "@/lib/schedule/types";
import { getMarket } from "@/lib/markets";
import { pickBroadcast } from "@/lib/providers";
import type { Assignment } from "@/lib/types";
import { autoPrioritize } from "@/lib/priority";
import { autoBuildAssignments } from "@/lib/autobuild";

const STATE_STYLE: Record<EventState, string> = {
  in: "border-signal/50 bg-signal/15 text-signal",
  delayed: "border-amber-accent/50 bg-amber-accent/15 text-amber-glow",
  pre: "border-ink-600 bg-ink-800 text-chalk-dim",
  post: "border-ink-600 bg-ink-900 text-chalk-faint",
  postponed: "border-alert/50 bg-alert-dim/30 text-alert",
  canceled: "border-alert/50 bg-alert-dim/30 text-alert",
};

function StatusChip({ ev }: { ev: ScheduleEvent }) {
  const { state, detail, clock } = ev.status;
  const pulse = state === "in" || state === "delayed";
  return (
    <span className={`label-chip ${STATE_STYLE[state]}`}>
      {pulse && <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current" />}
      {state === "in" && clock ? clock : detail}
    </span>
  );
}

export default function FullSchedule() {
  const { activeBar, getBoard, saveBoard, upsertAssignment, newAssignmentId, currentDate: today } =
    useStore();
  const tz = activeBar.timezone;
  const market = getMarket(activeBar.market);

  const [data, setData] = useState<ScheduleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [sport, setSport] = useState<string>("All");
  const [hideFinal, setHideFinal] = useState(false);
  const [q, setQ] = useState("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/schedule?date=${today}`, { cache: "no-store" });
      const json: ScheduleResponse = await res.json();
      // Flag local-team events using the bar's market.
      if (market) {
        for (const e of json.events) {
          const text = `${e.name} ${e.team1 ?? ""} ${e.team2 ?? ""}`.toLowerCase();
          e.local = market.teams.some((t) =>
            new RegExp(`\\b${t.nickname.toLowerCase()}\\b`).test(text),
          );
        }
      }
      setData(json);
    } catch {
      setData({ source: "seed", date: today, fetchedAt: new Date().toISOString(), events: [] });
    } finally {
      setLoading(false);
    }
  }, [today, market]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (timer.current) clearInterval(timer.current);
    if (autoRefresh) timer.current = setInterval(load, 60000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [autoRefresh, load]);

  const fmtTime = useCallback((iso: string) => formatEventTime(iso, tz), [tz]);

  const sports = useMemo(() => {
    const s = new Set<string>();
    data?.events.forEach((e) => s.add(e.sport));
    return ["All", ...Array.from(s).sort()];
  }, [data]);

  const events = useMemo(() => {
    let list = data?.events ?? [];
    if (sport !== "All") list = list.filter((e) => e.sport === sport);
    if (hideFinal) list = list.filter((e) => e.status.state !== "post");
    if (q.trim()) {
      const w = q.trim().toLowerCase();
      list = list.filter((e) => `${e.name} ${e.league} ${e.networks.join(" ")}`.toLowerCase().includes(w));
    }
    return list;
  }, [data, sport, hideFinal, q]);

  const board = getBoard(today);
  const onBoardNames = useMemo(
    () => new Set(board.assignments.map((a) => a.eventName)),
    [board],
  );

  function sendToBoard(ev: ScheduleEvent) {
    const used = new Set(board.assignments.map((a) => a.tvNumber));
    const tv = activeBar.tvOrder.find((n) => !used.has(n)) ?? activeBar.tvOrder[0];
    const { watchOn, channel, streaming } = pickBroadcast(
      ev.networks,
      activeBar.providerId,
      activeBar.channelOverrides?.[activeBar.providerId ?? ""],
    );
    const a: Assignment = {
      id: newAssignmentId(),
      tvNumber: tv,
      priority: 999,
      eventName: ev.name,
      team1: ev.team1,
      team2: ev.team2,
      sport: ev.sport,
      league: ev.league,
      startTime: fmtTime(ev.startUtc),
      watchOn,
      directvChannel: channel,
      streamingApp: streaming,
      device: "DIRECTV box",
      remote: "Main DIRECTV Remote",
      soundRule: "Music stays on",
      labels: ev.local ? ["LOCAL"] : [],
      notes: [ev.venue, ev.city].filter(Boolean).join(" · ") || undefined,
      confirmed: false,
    };
    upsertAssignment(today, a);
    // Re-rank the whole board by crowd draw.
    const merged = sortByTvOrder([...board.assignments, a], activeBar.tvOrder);
    autoPrioritize(merged, activeBar.market).forEach((x) => upsertAssignment(today, x));
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader kicker={`${activeBar.name} · ${today}`} title="Full Schedule">
        <DateStepper />
        {data && data.events.length > 0 && (
          <button
            onClick={() => {
              const built = autoBuildAssignments(data.events, activeBar, fmtTime, newAssignmentId);
              saveBoard({
                date: today,
                published: true,
                assignments: built,
                generalNotes: getBoard(today).generalNotes,
              });
            }}
            className="btn btn-signal"
          >
            ⚡ Auto-build board
          </button>
        )}
        {data && (
          <Pill tone={data.source === "live" ? "signal" : "amber"}>
            {data.source === "live" ? "● Live feed" : "○ Scheduled (offline)"}
          </Pill>
        )}
        {tz && <Pill tone="neutral">All times {zoneLabel(tz)}</Pill>}
      </SectionHeader>

      <p className="max-w-3xl text-sm text-chalk-dim">
        Everything on today across every sport — scores, start times in your zone,
        TV networks, and live status including rain delays. Pulls from a live feed
        and auto-refreshes; drop any game onto the board with one tap.
      </p>

      {/* Controls */}
      <div className="panel flex flex-wrap items-center gap-3 p-4">
        <div className="flex flex-wrap gap-1.5">
          {sports.map((s) => (
            <button
              key={s}
              onClick={() => setSport(s)}
              className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
                sport === s
                  ? "border-amber-accent/50 bg-amber-accent/15 text-amber-glow"
                  : "border-ink-600 bg-ink-800 text-chalk-dim"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <input
          className="input max-w-[200px]"
          placeholder="Search team / network…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <label className="flex items-center gap-2 text-xs text-chalk-dim">
          <input
            type="checkbox"
            className="h-4 w-4 accent-amber-accent"
            checked={hideFinal}
            onChange={(e) => setHideFinal(e.target.checked)}
          />
          Hide finals
        </label>
        <div className="ml-auto flex items-center gap-3">
          <button onClick={load} className="btn btn-ghost px-3 py-1.5">
            ↻ Refresh
          </button>
          <div className="flex items-center gap-2">
            <span className="field-label">Auto</span>
            <Toggle checked={autoRefresh} onChange={setAutoRefresh} label="Auto refresh" />
          </div>
        </div>
      </div>

      {data?.fetchedAt && (
        <p className="-mt-3 text-xs text-chalk-faint">
          Updated {fmtTime(data.fetchedAt)}
          {data.source === "seed" &&
            " · live feed unavailable here — showing the seeded slate. On Netlify the server reaches ESPN's free feed for real-time scores & delays."}
        </p>
      )}

      {/* List */}
      {loading ? (
        <div className="panel p-10 text-center text-chalk-faint">Loading schedule…</div>
      ) : events.length === 0 ? (
        <div className="panel p-10 text-center text-chalk-dim">No events match.</div>
      ) : (
        <div className="grid gap-2">
          {events.map((ev) => (
            <div
              key={ev.id}
              className={`panel flex flex-wrap items-center gap-x-4 gap-y-2 p-3 ${
                ev.local ? "border-l-2 border-l-amber-accent" : ""
              }`}
            >
              <div className="w-16 shrink-0 text-center">
                <div className="tnum font-mono text-sm font-bold text-amber-glow">
                  {fmtTime(ev.startUtc)}
                </div>
                <div className="font-mono text-[9px] uppercase tracking-wider text-chalk-faint">
                  {ev.league}
                </div>
              </div>

              <div className="min-w-[180px] flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-chalk">{ev.name}</span>
                  {ev.local && <span className="label-chip border-amber-accent/40 bg-amber-accent/10 text-amber-glow">LOCAL</span>}
                  {ev.national && <span className="label-chip border-ink-600 text-chalk-faint">NAT&apos;L</span>}
                </div>
                <div className="mt-0.5 text-xs text-chalk-faint">
                  {ev.sport}
                  {ev.city ? ` · ${ev.city}` : ""}
                  {ev.networks.length ? ` · ${ev.networks.join(", ")}` : ""}
                </div>
              </div>

              {(ev.score1 || ev.score2) && (
                <div className="tnum w-14 text-center font-mono text-sm text-chalk">
                  {ev.score1}–{ev.score2}
                </div>
              )}

              <StatusChip ev={ev} />

              {onBoardNames.has(ev.name) ? (
                <span className="label-chip border-signal/50 bg-signal-deep/40 text-signal">On board</span>
              ) : (
                <button onClick={() => sendToBoard(ev)} className="btn btn-primary px-3 py-1.5 text-xs">
                  + Board
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-chalk-faint">
        <Link href="/edit" className="text-amber-glow hover:underline">
          Edit the board →
        </Link>{" "}
        to assign specific TVs, set sound, and confirm.
      </p>
    </div>
  );
}
