"use client";

import { useState } from "react";
import { useStore, US_TIMEZONES, zoneLabel } from "@/lib/store";
import { SectionHeader, TVBadge, Toggle } from "@/components/ui";
import { SOUND_OPTIONS } from "@/lib/types";
import type { Device, Remote, SoundRuleValue, TV } from "@/lib/types";
import { MARKETS, getMarket, nearestMarket } from "@/lib/markets";
import { PROVIDERS, getProvider } from "@/lib/providers";
import Link from "next/link";

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
              <span className="field-label">TV provider (sets channel numbers)</span>
              <select
                className="input mt-1"
                value={activeBar.providerId ?? ""}
                onChange={(e) => {
                  const p = getProvider(e.target.value);
                  updateBar({
                    providerId: e.target.value,
                    defaultProvider: p?.name ?? activeBar.defaultProvider,
                  });
                }}
              >
                <option value="">— select a provider —</option>
                <optgroup label="Satellite">
                  {PROVIDERS.filter((p) => p.type === "satellite").map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Cable">
                  {PROVIDERS.filter((p) => p.type === "cable").map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Streaming live TV">
                  {PROVIDERS.filter((p) => p.type === "streaming").map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </optgroup>
              </select>
              {activeBar.providerId && (
                <p className="mt-1.5 flex items-center justify-between text-xs text-chalk-faint">
                  <span>{getProvider(activeBar.providerId)?.note}</span>
                  <Link href="/channels" className="text-amber-glow hover:underline">
                    View channel guide →
                  </Link>
                </p>
              )}
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

      {/* Location & market */}
      <LocationMarket />

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

function LocationMarket() {
  const { activeBar, updateBar } = useStore();
  const market = getMarket(activeBar.market);
  const [lat, setLat] = useState(activeBar.lat?.toString() ?? "");
  const [lng, setLng] = useState(activeBar.lng?.toString() ?? "");

  function applyMarket(key: string) {
    const m = getMarket(key);
    if (!m) return;
    updateBar({
      market: m.key,
      timezone: m.timezone,
      lat: m.lat,
      lng: m.lng,
      location: m.name,
      localTeams: m.teams.map((t) => t.name),
    });
    setLat(m.lat.toString());
    setLng(m.lng.toString());
  }

  function applyCoords() {
    const la = parseFloat(lat);
    const ln = parseFloat(lng);
    if (Number.isNaN(la) || Number.isNaN(ln)) return;
    const m = nearestMarket(la, ln);
    applyMarket(m.key);
  }

  return (
    <Card
      title="Location & market"
      hint="The bar's market drives crowd demand — which local teams pull people in, and which sports this region cares about. This powers Auto-prioritize on the board."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <label className="block">
            <span className="field-label">Market (metro area)</span>
            <select
              className="input mt-1"
              value={activeBar.market ?? ""}
              onChange={(e) => applyMarket(e.target.value)}
            >
              <option value="">— select a market —</option>
              {MARKETS.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="field-label">
              Timezone {activeBar.timezone ? `· now ${zoneLabel(activeBar.timezone)}` : ""}
            </span>
            <select
              className="input mt-1"
              value={activeBar.timezone ?? ""}
              onChange={(e) => updateBar({ timezone: e.target.value })}
            >
              <option value="">— select a timezone —</option>
              {US_TIMEZONES.map((z) => (
                <option key={z.value} value={z.value}>
                  {z.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-chalk-faint">
              Picking a market sets this automatically. All board, staff, and print
              times display in this zone.
            </p>
          </label>

          <div className="rounded-md border border-ink-700 bg-ink-900/50 p-3">
            <div className="field-label mb-2">
              Google Maps location (lat / lng)
            </div>
            <div className="flex items-end gap-2">
              <input
                className="input"
                placeholder="33.749"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
              />
              <input
                className="input"
                placeholder="-84.388"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
              />
              <button onClick={applyCoords} className="btn btn-ghost whitespace-nowrap">
                Snap to market
              </button>
            </div>
            <p className="mt-2 text-xs text-chalk-faint">
              Paste coordinates from Google Maps and we map them to the nearest
              market. Add a <span className="font-mono">GOOGLE_MAPS_API_KEY</span>{" "}
              to enable address autocomplete + automatic geocoding.
            </p>
          </div>
        </div>

        <div className="rounded-md border border-ink-700 bg-ink-900/50 p-4">
          {market ? (
            <>
              <div className="mb-1 flex items-center justify-between">
                <span className="font-display text-lg font-bold text-chalk">
                  {market.name}
                </span>
                <span className="rounded border border-ink-600 bg-ink-800 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-chalk-dim">
                  {market.region}
                </span>
              </div>
              <p className="mb-3 text-xs text-chalk-faint">
                Local teams &amp; their crowd-draw weight (0–100):
              </p>
              <div className="flex flex-col gap-1.5">
                {market.teams
                  .slice()
                  .sort((a, b) => b.draw - a.draw)
                  .map((t) => (
                    <div key={t.name} className="flex items-center gap-2">
                      <span className="w-10 shrink-0 text-right font-mono text-xs text-amber-glow tnum">
                        {t.draw}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-800">
                        <div
                          className="h-full rounded-full bg-amber-accent/70"
                          style={{ width: `${t.draw}%` }}
                        />
                      </div>
                      <span className="w-40 shrink-0 truncate text-sm text-chalk-dim">
                        {t.name}
                      </span>
                      <span className="hidden w-12 shrink-0 font-mono text-[10px] uppercase text-chalk-faint sm:block">
                        {t.league}
                      </span>
                    </div>
                  ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-chalk-faint">
              Select a market to see its local teams and demand profile.
            </p>
          )}
        </div>
      </div>
    </Card>
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
