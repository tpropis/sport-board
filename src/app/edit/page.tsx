"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore, sortByTvOrder } from "@/lib/store";
import { matchupTitle } from "@/lib/constants";
import { AssignmentEditor } from "@/components/AssignmentEditor";
import { SectionHeader, TVBadge, Toggle, DateStepper } from "@/components/ui";
import type { Assignment } from "@/lib/types";
import { autoPrioritize, scoreEvent } from "@/lib/priority";
import { getMarket } from "@/lib/markets";

function blankAssignment(id: string, tvNumber: number, priority: number): Assignment {
  return {
    id,
    tvNumber,
    priority,
    eventName: "",
    soundRule: "Music stays on",
    labels: [],
    device: "DIRECTV box",
    remote: "Main DIRECTV Remote",
    confirmed: false,
  };
}

export default function EditBoard() {
  const {
    activeBar,
    getBoard,
    saveBoard,
    upsertAssignment,
    removeAssignment,
    duplicateYesterday,
    clearBoard,
    newAssignmentId,
    currentDate: today,
  } = useStore();
  const board = getBoard(today);
  const assignments = sortByTvOrder(board.assignments, activeBar.tvOrder);

  const [editing, setEditing] = useState<Assignment | null>(null);

  function startNew() {
    const usedTvs = new Set(assignments.map((a) => a.tvNumber));
    const nextTv = activeBar.tvOrder.find((n) => !usedTvs.has(n)) ?? activeBar.tvOrder[0];
    const nextPri = (Math.max(0, ...assignments.map((a) => a.priority)) || 0) + 1;
    setEditing(blankAssignment(newAssignmentId(), nextTv, nextPri));
  }

  const market = getMarket(activeBar.market);

  function autoRank() {
    const reranked = autoPrioritize(board.assignments, activeBar.market);
    reranked.forEach((a) => upsertAssignment(today, a));
  }

  function movePriority(a: Assignment, dir: -1 | 1) {
    const ordered = [...assignments].sort((x, y) => x.priority - y.priority);
    const idx = ordered.findIndex((x) => x.id === a.id);
    const swapWith = ordered[idx + dir];
    if (!swapWith) return;
    const p = a.priority;
    upsertAssignment(today, { ...a, priority: swapWith.priority });
    upsertAssignment(today, { ...swapWith, priority: p });
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader kicker={`${activeBar.name} · ${today}`} title="Edit Board">
        <DateStepper />
        <button onClick={startNew} className="btn btn-primary">
          + Add game / event
        </button>
      </SectionHeader>

      {/* Board controls */}
      <div className="panel flex flex-wrap items-center gap-2 p-4">
        <button
          onClick={autoRank}
          className="btn btn-signal"
          disabled={board.assignments.length === 0}
          title={
            market
              ? `Rank by crowd draw for ${market.name}`
              : "Set a market in Bar Setup for location-aware ranking"
          }
        >
          ⚡ Auto-prioritize by draw
        </button>
        <Link href="/schedule" className="btn btn-ghost">
          📡 Add from full schedule
        </Link>
        <button onClick={() => duplicateYesterday(today)} className="btn btn-ghost">
          ⎘ Duplicate previous board
        </button>
        <button
          onClick={() => {
            if (confirm("Clear all assignments from today's board?")) clearBoard(today);
          }}
          className="btn btn-danger"
        >
          Clear board
        </button>
        <Link href="/print" className="btn btn-ghost">
          🖨 Print board
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <span className="field-label">Published to staff</span>
          <Toggle
            checked={board.published}
            onChange={(v) => saveBoard({ ...board, published: v })}
          />
        </div>
      </div>

      {/* Assignments list */}
      {assignments.length === 0 ? (
        <div className="panel p-10 text-center text-chalk-dim">
          No assignments yet. Add games to build tonight&apos;s board.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {assignments.map((a, i) => (
            <div
              key={a.id}
              className="panel flex items-center gap-3 p-3"
            >
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => movePriority(a, -1)}
                  disabled={i === 0}
                  className="rounded border border-ink-600 px-1.5 text-xs text-chalk-dim disabled:opacity-30 hover:border-ink-500"
                  aria-label="Raise priority"
                >
                  ▲
                </button>
                <button
                  onClick={() => movePriority(a, 1)}
                  disabled={i === assignments.length - 1}
                  className="rounded border border-ink-600 px-1.5 text-xs text-chalk-dim disabled:opacity-30 hover:border-ink-500"
                  aria-label="Lower priority"
                >
                  ▼
                </button>
              </div>
              <span className="tnum w-8 text-center font-mono text-xs text-chalk-faint">
                #{a.priority}
              </span>
              <span
                className="tnum hidden w-12 shrink-0 flex-col items-center rounded border border-ink-600 bg-ink-900 py-1 font-mono sm:flex"
                title={scoreEvent(a, market).reasons.join("\n")}
              >
                <span className="text-sm font-bold text-amber-glow">
                  {scoreEvent(a, market).score}
                </span>
                <span className="text-[8px] uppercase tracking-wider text-chalk-faint">
                  draw
                </span>
              </span>
              <TVBadge number={a.tvNumber} size="md" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold text-chalk">
                  {matchupTitle(a)}
                </div>
                <div className="truncate text-xs text-chalk-dim">
                  {[a.startTime, a.watchOn, a.directvChannel ? `DIRECTV ${a.directvChannel}` : null, a.streamingApp]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </div>
              <span
                className={`label-chip ${
                  a.confirmed
                    ? "border-signal/50 bg-signal-deep/40 text-signal"
                    : "border-alert/50 bg-alert-dim/30 text-alert"
                }`}
              >
                {a.confirmed ? "Confirmed" : "Needs check"}
              </span>
              <button onClick={() => setEditing(a)} className="btn btn-ghost px-3 py-1.5">
                Edit
              </button>
              <button
                onClick={() => removeAssignment(today, a.id)}
                className="btn btn-danger px-2.5 py-1.5"
                aria-label="Delete assignment"
              >
                🗑
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Board notes */}
      <div className="panel p-4">
        <div className="field-label mb-2">Board notes (shown on staff & print views)</div>
        <textarea
          className="input h-24 resize-none"
          value={board.generalNotes}
          placeholder="Default filler, RedZone availability, special instructions…"
          onChange={(e) => saveBoard({ ...board, generalNotes: e.target.value })}
        />
      </div>

      {/* Editor slide-over */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setEditing(null)}
          />
          <div className="panel relative z-10 w-full max-w-2xl">
            <AssignmentEditor
              draft={editing}
              onCancel={() => setEditing(null)}
              onSave={(a) => {
                upsertAssignment(today, a);
                setEditing(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
