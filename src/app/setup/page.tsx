"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { SectionHeader, TVBadge, Toggle } from "@/components/ui";
import { SOUND_OPTIONS } from "@/lib/types";
import type { Device, Remote, SoundRuleValue, TV } from "@/lib/types";

function Card({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="panel p-5">
      <div className="mb-4">
        <h2 className="font-display text-lg font-bold text-chalk">{title}</h2>
        {hint && <p className="mt-0.5 text-sm text-chalk-faint">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

export default function BarSetup() {
  const { activeBar, updateBar } = useStore();
  const [newTv, setNewTv] = useState("");

  function moveTv(index: number, dir: -1 | 1) {
    const order = [...activeBar.tvOrder];
    const j = index + dir;
    if (j < 0 || j >= order.length) return;
    [order[index], order[j]] = [order[j], order[index]];
    updateBar({
      tvOrder: order,
      tvs: order.map((n, pos) => {
        const tv = activeBar.tvs.find((t) => t.number === n)!;
        return { ...tv, position: pos };
      }),
    });
  }

  function updateTv(number: number, patch: Partial<TV>) {
    updateBar({
      tvs: activeBar.tvs.map((t) => (t.number === number ? { ...t, ...patch } : t)),
    });
  }

  function addTv() {
    const n = parseInt(newTv, 10);
    if (!n || activeBar.tvOrder.includes(n)) {
      setNewTv("");
      return;
    }
    const tv: TV = {
      number: n,
      position: activeBar.tvOrder.length,
      description: "",
      ignored: false,
    };
    updateBar({
      tvOrder: [...activeBar.tvOrder, n],
      tvs: [...activeBar.tvs, tv],
    });
    setNewTv("");
  }

  function removeTv(number: number) {
    updateBar({
      tvOrder: activeBar.tvOrder.filter((x) => x !== number),
      tvs: activeBar.tvs.filter((t) => t.number !== number),
    });
  }

  function updateDevice(id: string, patch: Partial<Device>) {
    updateBar({
      devices: activeBar.devices.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    });
  }
  function updateRemote(id: string, patch: Partial<Remote>) {
    updateBar({
      remotes: activeBar.remotes.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader kicker="Configuration" title="Bar Setup" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Identity">
          <div className="grid gap-4">
            <label className="block">
              <span className="field-label">Bar name</span>
              <input
                className="input mt-1"
                value={activeBar.name}
                onChange={(e) => updateBar({ name: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="field-label">Location</span>
              <input
                className="input mt-1"
                value={activeBar.location}
                onChange={(e) => updateBar({ location: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="field-label">Setup note (shown on staff & print)</span>
              <input
                className="input mt-1"
                value={activeBar.setupNotes}
                onChange={(e) => updateBar({ setupNotes: e.target.value })}
              />
            </label>
          </div>
        </Card>

        <Card title="Defaults">
          <div className="grid gap-4">
            <label className="block">
              <span className="field-label">Default provider</span>
              <input
                className="input mt-1"
                value={activeBar.defaultProvider}
                onChange={(e) => updateBar({ defaultProvider: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="field-label">Default sound rule</span>
              <select
                className="input mt-1"
                value={activeBar.defaultSoundRule}
                onChange={(e) =>
                  updateBar({ defaultSoundRule: e.target.value as SoundRuleValue })
                }
              >
                {SOUND_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center justify-between rounded-md border border-ink-600 bg-ink-900 px-4 py-3">
              <span className="text-sm font-semibold text-chalk">Staff view link enabled</span>
              <Toggle
                checked={activeBar.staffViewEnabled}
                onChange={(v) => updateBar({ staffViewEnabled: v })}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* TV order & descriptions */}
      <Card
        title="TVs · custom order & descriptions"
        hint="Order is exactly how the wall reads left → right. Numbering does not need to be sequential."
      >
        <div className="flex flex-col gap-2">
          {activeBar.tvOrder.map((n, i) => {
            const tv = activeBar.tvs.find((t) => t.number === n)!;
            return (
              <div
                key={n}
                className="flex flex-wrap items-center gap-3 rounded-md border border-ink-700 bg-ink-900/50 p-3"
              >
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveTv(i, -1)}
                    disabled={i === 0}
                    className="rounded border border-ink-600 px-1.5 text-xs text-chalk-dim disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveTv(i, 1)}
                    disabled={i === activeBar.tvOrder.length - 1}
                    className="rounded border border-ink-600 px-1.5 text-xs text-chalk-dim disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>
                <TVBadge number={n} size="md" ignored={tv.ignored} />
                <input
                  className="input min-w-[180px] flex-1"
                  value={tv.description}
                  placeholder="Location description"
                  onChange={(e) => updateTv(n, { description: e.target.value })}
                />
                <label className="flex items-center gap-2 text-xs text-chalk-dim">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-signal"
                    checked={tv.ignored}
                    onChange={(e) => updateTv(n, { ignored: e.target.checked })}
                  />
                  Ignored
                </label>
                <button
                  onClick={() => removeTv(n)}
                  className="btn btn-danger px-2.5 py-1.5"
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            className="input max-w-[160px]"
            placeholder="Add TV number"
            value={newTv}
            type="number"
            onChange={(e) => setNewTv(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTv()}
          />
          <button onClick={addTv} className="btn btn-primary">
            + Add TV
          </button>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Devices */}
        <Card title="Devices">
          <div className="flex flex-col gap-2">
            {activeBar.devices.map((d) => (
              <div key={d.id} className="rounded-md border border-ink-700 bg-ink-900/50 p-3">
                <div className="flex items-center gap-2">
                  <input
                    className="input flex-1"
                    value={d.name}
                    onChange={(e) => updateDevice(d.id, { name: e.target.value })}
                  />
                  <button
                    onClick={() =>
                      updateBar({ devices: activeBar.devices.filter((x) => x.id !== d.id) })
                    }
                    className="btn btn-danger px-2.5 py-1.5"
                  >
                    ✕
                  </button>
                </div>
                <input
                  className="input mt-2 text-sm"
                  value={d.notes ?? ""}
                  placeholder="Notes"
                  onChange={(e) => updateDevice(d.id, { notes: e.target.value })}
                />
              </div>
            ))}
            <button
              onClick={() =>
                updateBar({
                  devices: [
                    ...activeBar.devices,
                    { id: `dev-${Date.now()}`, name: "New device" },
                  ],
                })
              }
              className="btn btn-ghost"
            >
              + Add device
            </button>
          </div>
        </Card>

        {/* Remotes */}
        <Card title="Remotes">
          <div className="flex flex-col gap-2">
            {activeBar.remotes.map((r) => (
              <div key={r.id} className="rounded-md border border-ink-700 bg-ink-900/50 p-3">
                <div className="flex items-center gap-2">
                  <input
                    className="input flex-1"
                    value={r.name}
                    onChange={(e) => updateRemote(r.id, { name: e.target.value })}
                  />
                  <button
                    onClick={() =>
                      updateBar({ remotes: activeBar.remotes.filter((x) => x.id !== r.id) })
                    }
                    className="btn btn-danger px-2.5 py-1.5"
                  >
                    ✕
                  </button>
                </div>
                <input
                  className="input mt-2 text-sm"
                  value={r.notes ?? ""}
                  placeholder="Notes"
                  onChange={(e) => updateRemote(r.id, { notes: e.target.value })}
                />
              </div>
            ))}
            <button
              onClick={() =>
                updateBar({
                  remotes: [
                    ...activeBar.remotes,
                    { id: `rem-${Date.now()}`, name: "New remote" },
                  ],
                })
              }
              className="btn btn-ghost"
            >
              + Add remote
            </button>
          </div>
        </Card>
      </div>

      {/* Local teams */}
      <Card title="Local priority teams" hint="These get top billing in the priority rules.">
        <LocalTeams />
      </Card>
    </div>
  );
}

function LocalTeams() {
  const { activeBar, updateBar } = useStore();
  const [val, setVal] = useState("");
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {activeBar.localTeams.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-2 rounded-full border border-amber-accent/40 bg-amber-accent/10 px-3 py-1.5 text-sm text-amber-glow"
          >
            {t}
            <button
              onClick={() =>
                updateBar({ localTeams: activeBar.localTeams.filter((x) => x !== t) })
              }
              className="text-amber-glow/70 hover:text-amber-glow"
            >
              ✕
            </button>
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <input
          className="input max-w-xs"
          placeholder="Add a local team"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && val.trim()) {
              updateBar({ localTeams: [...activeBar.localTeams, val.trim()] });
              setVal("");
            }
          }}
        />
        <button
          onClick={() => {
            if (val.trim()) {
              updateBar({ localTeams: [...activeBar.localTeams, val.trim()] });
              setVal("");
            }
          }}
          className="btn btn-primary"
        >
          Add
        </button>
      </div>
    </div>
  );
}
