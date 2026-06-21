"use client";

import type { AssignmentLabel } from "@/lib/types";
import { LABEL_STYLES } from "@/lib/constants";

export function LabelChip({ label }: { label: AssignmentLabel }) {
  return (
    <span className={`label-chip ${LABEL_STYLES[label] ?? "border-ink-600 text-chalk-dim"}`}>
      {label}
    </span>
  );
}

const TV_BADGE_SIZES = {
  sm: "h-8 w-8 text-base",
  md: "h-12 w-12 text-2xl",
  lg: "h-16 w-16 text-3xl",
  xl: "h-20 w-20 text-4xl",
} as const;

export function TVBadge({
  number,
  size = "md",
  ignored = false,
}: {
  number: number;
  size?: keyof typeof TV_BADGE_SIZES;
  ignored?: boolean;
}) {
  return (
    <span
      className={`tv-badge ${TV_BADGE_SIZES[size]} ${
        ignored
          ? "border-ink-500 bg-ink-800 text-chalk-faint"
          : "border-amber-accent/60 bg-amber-accent/10 text-amber-glow"
      }`}
    >
      {number}
    </span>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors ${
        checked
          ? "border-signal/60 bg-signal/30"
          : "border-ink-600 bg-ink-800"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
          checked ? "translate-x-6 bg-signal" : "translate-x-1 bg-chalk-faint"
        }`}
      />
    </button>
  );
}

export function SectionHeader({
  kicker,
  title,
  children,
}: {
  kicker?: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ink-700 pb-4">
      <div>
        {kicker && (
          <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.2em] text-amber-accent/80">
            {kicker}
          </div>
        )}
        <h1 className="font-display text-2xl font-bold tracking-tight text-chalk sm:text-3xl">
          {title}
        </h1>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Pill({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "signal" | "alert" | "amber";
  children: React.ReactNode;
}) {
  const tones = {
    neutral: "border-ink-600 bg-ink-800 text-chalk-dim",
    signal: "border-signal/40 bg-signal/10 text-signal",
    alert: "border-alert/40 bg-alert/10 text-alert",
    amber: "border-amber-accent/40 bg-amber-accent/10 text-amber-glow",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="panel flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="font-mono text-sm uppercase tracking-widest text-chalk-faint">
        {title}
      </div>
      {hint && <p className="max-w-sm text-sm text-chalk-dim">{hint}</p>}
      {action}
    </div>
  );
}
