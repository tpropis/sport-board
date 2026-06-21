"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { SectionHeader, Pill } from "@/components/ui";
import { BRAVES_NATIONAL_OPTIONS } from "@/lib/constants";
import type { PriorityRule } from "@/lib/types";
import { getMarket } from "@/lib/markets";
import Link from "next/link";

export default function PriorityRulesPage() {
  const { activeBar, updateBar } = useStore();
  const [newRule, setNewRule] = useState("");
  const rules = [...activeBar.priorityRules].sort((a, b) => a.rank - b.rank);

  function move(rank: number, dir: -1 | 1) {
    const idx = rules.findIndex((r) => r.rank === rank);
    const j = idx + dir;
    if (j < 0 || j >= rules.length) return;
    const reordered = [...rules];
    [reordered[idx], reordered[j]] = [reordered[j], reordered[idx]];
    updateBar({
      priorityRules: reordered.map((r, i) => ({ ...r, rank: i + 1 })),
    });
  }

  function remove(rank: number) {
    updateBar({
      priorityRules: rules
        .filter((r) => r.rank !== rank)
        .map((r, i) => ({ ...r, rank: i + 1 })),
    });
  }

  function add() {
    if (!newRule.trim()) return;
    const rule: PriorityRule = {
      rank: rules.length + 1,
      label: newRule.trim(),
      local: false,
    };
    updateBar({ priorityRules: [...rules, rule] });
    setNewRule("");
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader kicker="Configuration" title="Priority Rules">
        <Pill tone="amber">Local & high-demand first</Pill>
      </SectionHeader>

      <p className="max-w-3xl text-sm text-chalk-dim">
        When two games compete for the same TV, higher rank wins. The board&apos;s{" "}
        <strong className="text-chalk">Auto-prioritize</strong> button ranks games by
        estimated <strong className="text-chalk">crowd draw</strong> — what fills seats
        and keeps the room ordering — using your market below. This list is your manual
        override / standing philosophy.
      </p>

      <MarketPanel />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-1.5">
          {rules.map((r, i) => (
            <div
              key={r.rank}
              className="panel flex items-center gap-3 p-2.5"
            >
              <span className="tnum flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-ink-600 bg-ink-900 font-mono text-sm font-bold text-amber-glow">
                {r.rank}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium text-chalk">
                {r.label}
              </span>
              {r.local && <Pill tone="amber">Local</Pill>}
              <div className="flex gap-0.5">
                <button
                  onClick={() => move(r.rank, -1)}
                  disabled={i === 0}
                  className="rounded border border-ink-600 px-1.5 py-0.5 text-xs text-chalk-dim disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  onClick={() => move(r.rank, 1)}
                  disabled={i === rules.length - 1}
                  className="rounded border border-ink-600 px-1.5 py-0.5 text-xs text-chalk-dim disabled:opacity-30"
                >
                  ▼
                </button>
              </div>
              <button
                onClick={() => remove(r.rank)}
                className="btn btn-danger px-2 py-1 text-xs"
              >
                ✕
              </button>
            </div>
          ))}
          <div className="mt-2 flex gap-2">
            <input
              className="input"
              placeholder="Add a priority rule…"
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
            />
            <button onClick={add} className="btn btn-primary">
              Add
            </button>
          </div>
        </div>

        {/* Special Braves logic */}
        <aside className="panel h-fit p-5">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-amber-accent/80">
            Special logic
          </div>
          <h2 className="mt-1 font-display text-xl font-bold text-chalk">
            ⚾ Braves routing
          </h2>
          <div className="mt-4 space-y-4 text-sm">
            <div>
              <div className="font-semibold text-chalk">Local Braves game</div>
              <ul className="mt-1.5 space-y-1 text-chalk-dim">
                <li>1. Check <strong className="text-amber-glow">BravesVision</strong> first</li>
                <li>2. DIRECTV defaults to <strong className="text-amber-glow tnum">645</strong></li>
                <li>3. Stream via Braves.TV / MLB app if available</li>
              </ul>
              <p className="mt-2 rounded border border-ink-700 bg-ink-900/60 px-3 py-2 text-xs text-chalk-faint">
                Subject to blackout or national exclusivity.
              </p>
            </div>
            <div>
              <div className="font-semibold text-chalk">National Braves game</div>
              <p className="mt-1 text-chalk-dim">Route to whichever has it:</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {BRAVES_NATIONAL_OPTIONS.map((o) => (
                  <span
                    key={o}
                    className="rounded border border-ink-600 bg-ink-800 px-2 py-0.5 text-xs text-chalk-dim"
                  >
                    {o}
                  </span>
                ))}
              </div>
            </div>
            <p className="rounded border border-amber-accent/30 bg-amber-accent/10 px-3 py-2 text-xs text-amber-glow">
              If uncertain: check BravesVision first, then the national listing.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function MarketPanel() {
  const { activeBar } = useStore();
  const market = getMarket(activeBar.market);

  return (
    <div className="panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-amber-accent/80">
            Crowd-draw engine
          </div>
          <h2 className="mt-1 font-display text-xl font-bold text-chalk">
            {market ? `Tuned for ${market.name}` : "No market set"}
          </h2>
        </div>
        <Link href="/setup" className="btn btn-ghost">
          Change market →
        </Link>
      </div>

      <p className="mt-2 max-w-2xl text-sm text-chalk-dim">
        Draw = local-team pull + regional sport taste + event magnitude
        (playoff / final) + national-event draw. The highest-draw games go on the
        best TVs first — the order that fills seats and keeps the room ordering.
      </p>

      {market && (
        <div className="mt-4">
          <div className="field-label mb-2">
            Local teams by crowd draw
          </div>
          <div className="flex flex-wrap gap-2">
            {market.teams
              .slice()
              .sort((a, b) => b.draw - a.draw)
              .map((t) => (
                <span
                  key={t.name}
                  className="inline-flex items-center gap-2 rounded-full border border-amber-accent/40 bg-amber-accent/10 px-3 py-1 text-sm text-amber-glow"
                >
                  {t.name}
                  <span className="tnum rounded bg-ink-950/50 px-1.5 font-mono text-[10px]">
                    {t.draw}
                  </span>
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
