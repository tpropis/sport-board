"use client";

import type { Assignment } from "@/lib/types";
import { deriveLabels } from "@/lib/constants";
import { LabelChip, TVBadge } from "./ui";

function Field({
  label,
  value,
  strong = false,
}: {
  label: string;
  value?: string | null;
  strong?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <div className="field-label">{label}</div>
      <div
        className={`truncate ${
          strong ? "text-base font-semibold text-chalk" : "text-sm text-chalk-dim"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function soundTone(rule: string) {
  if (rule === "Main audio recommended") return "border-signal/50 bg-signal/10 text-signal";
  if (rule === "Music stays on") return "border-ink-600 bg-ink-800 text-chalk-dim";
  return "border-amber-accent/40 bg-amber-accent/10 text-amber-glow";
}

export function AssignmentCard({
  a,
  variant = "board",
}: {
  a: Assignment;
  variant?: "board" | "staff";
}) {
  const labels = deriveLabels(a);
  const matchup =
    a.team1 && a.team2 ? `${a.team1} vs ${a.team2}` : a.eventName;
  const staff = variant === "staff";

  return (
    <article
      className={`panel relative overflow-hidden ${
        staff ? "p-4" : "p-4 sm:p-5"
      } ${a.confirmed ? "" : "border-l-2 border-l-alert/60"}`}
    >
      {/* priority rail */}
      <div className="absolute right-0 top-0 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-chalk-faint">
        #{a.priority}
      </div>

      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center gap-1">
          <TVBadge number={a.tvNumber} size={staff ? "xl" : "lg"} />
          <span className="font-mono text-[10px] uppercase tracking-widest text-chalk-faint">
            TV
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={`font-display font-bold leading-tight text-chalk ${
                staff ? "text-xl" : "text-lg"
              }`}
            >
              {matchup}
            </h3>
            {a.startTime && (
              <span className="tnum font-mono text-sm font-semibold text-amber-glow">
                {a.startTime}
              </span>
            )}
          </div>

          <div className="mt-0.5 text-xs text-chalk-faint">
            {[a.sport, a.league].filter(Boolean).join(" · ")}
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {labels.map((l) => (
              <LabelChip key={l} label={l} />
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
            <Field label="Watch On" value={a.watchOn} strong />
            <Field label="DIRECTV Ch." value={a.directvChannel} strong />
            <Field label="Streaming App" value={a.streamingApp} />
            <Field label="Device" value={a.device} />
            <Field label="Remote" value={a.remote} />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`label-chip ${soundTone(a.soundRule)}`}
              title="Sound recommendation"
            >
              🔊 {a.soundRule}
            </span>
            {a.confirmed ? (
              <span className="label-chip border-signal/50 bg-signal-deep/40 text-signal">
                ✓ Confirmed
              </span>
            ) : (
              <span className="label-chip border-alert/50 bg-alert-dim/30 text-alert">
                ! Needs check
              </span>
            )}
          </div>

          {a.notes && (
            <p className="mt-3 rounded-md border border-ink-700 bg-ink-900/60 px-3 py-2 text-sm text-chalk-dim">
              <span className="font-semibold text-chalk-faint">Note: </span>
              {a.notes}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
