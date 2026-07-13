"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { SectionHeader, Toggle, Pill } from "@/components/ui";
import type { Service } from "@/lib/types";
import { coverageFor } from "@/lib/streaming";

export default function ServicesPage() {
  const { activeBar, updateBar } = useStore();
  const [filter, setFilter] = useState<"all" | "available">("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  function update(id: string, patch: Partial<Service>) {
    updateBar({
      services: activeBar.services.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  }

  const availableCount = activeBar.services.filter((s) => s.available).length;
  const shown = activeBar.services.filter((s) =>
    filter === "available" ? s.available : true,
  );

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader kicker="Configuration" title="Services & Streaming">
        <Pill tone="signal">{availableCount} available</Pill>
        <div className="flex overflow-hidden rounded-md border border-ink-600">
          {(["all", "available"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm font-semibold capitalize ${
                filter === f ? "bg-amber-accent/20 text-amber-glow" : "bg-ink-800 text-chalk-dim"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </SectionHeader>

      <p className="max-w-3xl text-sm text-chalk-dim">
        Mark what this bar actually has access to. Each service can carry the device,
        remote, channel number, and a note so a bartender always knows how to pull it up.
      </p>

      <div className="grid gap-2.5 md:grid-cols-2">
        {shown.map((s) => {
          const open = expanded === s.id;
          return (
            <div
              key={s.id}
              className={`panel overflow-hidden ${s.available ? "" : "opacity-70"}`}
            >
              <div className="flex items-center gap-3 p-3">
                <Toggle
                  checked={s.available}
                  onChange={(v) => update(s.id, { available: v })}
                  label={s.name}
                />
                <button
                  onClick={() => setExpanded(open ? null : s.id)}
                  className="flex min-w-0 flex-1 items-center justify-between text-left"
                >
                  <span>
                    <span className="font-semibold text-chalk">{s.name}</span>
                    <span className="ml-2 flex-wrap gap-1 text-xs text-chalk-faint">
                      {s.channelNumber && s.channelNumber !== "—" ? `Ch ${s.channelNumber}` : ""}
                      {s.deviceUsed ? ` · ${s.deviceUsed}` : ""}
                    </span>
                  </span>
                  <span className="ml-2 flex shrink-0 items-center gap-1.5">
                    {s.businessAccount && <Pill tone="amber">Biz</Pill>}
                    {s.loginSaved && <Pill tone="signal">Login</Pill>}
                    <span className="text-chalk-faint">{open ? "▲" : "▼"}</span>
                  </span>
                </button>
              </div>

              {open && (
                <div className="grid gap-3 border-t border-ink-700 bg-ink-900/40 p-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="field-label">Channel #</span>
                    <input
                      className="input mt-1"
                      value={s.channelNumber ?? ""}
                      onChange={(e) => update(s.id, { channelNumber: e.target.value })}
                    />
                  </label>
                  <label className="block">
                    <span className="field-label">Device used</span>
                    <select
                      className="input mt-1"
                      value={s.deviceUsed ?? ""}
                      onChange={(e) => update(s.id, { deviceUsed: e.target.value })}
                    >
                      <option value="">—</option>
                      {activeBar.devices.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="field-label">Remote used</span>
                    <select
                      className="input mt-1"
                      value={s.remoteUsed ?? ""}
                      onChange={(e) => update(s.id, { remoteUsed: e.target.value })}
                    >
                      <option value="">—</option>
                      {activeBar.remotes.map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="flex items-end gap-4">
                    <label className="flex items-center gap-2 text-sm text-chalk-dim">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-signal"
                        checked={s.loginSaved}
                        onChange={(e) => update(s.id, { loginSaved: e.target.checked })}
                      />
                      Login saved
                    </label>
                    <label className="flex items-center gap-2 text-sm text-chalk-dim">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-amber-accent"
                        checked={s.businessAccount}
                        onChange={(e) => update(s.id, { businessAccount: e.target.checked })}
                      />
                      Business acct
                    </label>
                  </div>
                  <label className="block sm:col-span-2">
                    <span className="field-label">Note for bartender</span>
                    <input
                      className="input mt-1"
                      value={s.notes ?? ""}
                      placeholder="e.g. Check first for local Braves. Subject to blackout."
                      onChange={(e) => update(s.id, { notes: e.target.value })}
                    />
                  </label>
                  <ServiceCoverage name={s.name} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ServiceCoverage({ name }: { name: string }) {
  const info = coverageFor(name);
  if (!info) return null;
  return (
    <div className="sm:col-span-2">
      <div className="field-label mb-1.5">Carries (2026)</div>
      <div className="flex flex-wrap gap-1.5">
        {info.carries.map((c) => (
          <span
            key={c}
            className="rounded-md border border-signal/30 bg-signal/10 px-2 py-0.5 text-xs text-signal"
          >
            {c}
          </span>
        ))}
      </div>
      {info.howTo && (
        <p className="mt-1.5 text-xs text-chalk-faint">→ {info.howTo}</p>
      )}
    </div>
  );
}
