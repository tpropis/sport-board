"use client";

import { useState } from "react";
import { useStore, US_TIMEZONES, zoneLabel } from "@/lib/store";
import { SectionHeader, TVBadge, Toggle } from "@/components/ui";
import { SOUND_OPTIONS } from "@/lib/types";
import type { Device, Remote, SoundRuleValue, TV } from "@/lib/types";
import { MARKETS, getMarket, nearestMarket } from "@/lib/markets";
import { PROVIDERS, getProvider } from "@/lib/providers";
import { BRAND_PRESETS, hexToChannels, lighten } from "@/lib/branding";
import type { Branding } from "@/lib/types";
import { useRef } from "react";
import { useSession, type Role } from "@/lib/session";
import { CLERK_ENABLED } from "@/lib/access";
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
      <BrandingCard />

      <AccountsCard />

      <LocationMarket />

      {/* TV order & descriptions */}
      <Card
        title="TVs · order, main screens & descriptions"
        hint="Order is exactly how the wall reads left → right (numbering needn't be sequential). Mark your center / big screens as ★ Main — the highest-draw games auto-land there first."
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
                  className="input min-w-[160px] flex-1"
                  value={tv.description}
                  placeholder="Location description"
                  onChange={(e) => updateTv(n, { description: e.target.value })}
                />
                <button
                  onClick={() => updateTv(n, { main: !tv.main })}
                  title="Main / priority TV — the big games go here"
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                    tv.main
                      ? "border-amber-accent/60 bg-amber-accent/15 text-amber-glow"
                      : "border-ink-600 bg-ink-800 text-chalk-faint hover:text-chalk-dim"
                  }`}
                >
                  {tv.main ? "★ Main" : "☆ Main"}
                </button>
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

      <Card
        title="Morning board email"
        hint="Email the daily board to staff. Send on demand here, or automate it (see the Print View's kiosk/cron options)."
      >
        <EmailCard />
      </Card>
    </div>
  );
}

function EmailCard() {
  const { activeBar, updateBar, getBoard, currentDate } = useStore();
  const [val, setVal] = useState("");
  const [status, setStatus] = useState<string>("");
  const recipients = activeBar.emailRecipients ?? [];

  async function send() {
    setStatus("Sending…");
    const board = getBoard(currentDate);
    try {
      const res = await fetch("/api/email-board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: recipients, date: currentDate, bar: activeBar, board }),
      });
      const json = await res.json();
      setStatus(
        json.sent
          ? `✓ Sent to ${recipients.length} recipient${recipients.length === 1 ? "" : "s"}.`
          : `Not sent — ${json.reason}`,
      );
    } catch (e) {
      setStatus(`Failed — ${String(e)}`);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {recipients.map((r) => (
          <span
            key={r}
            className="inline-flex items-center gap-2 rounded-full border border-signal/40 bg-signal/10 px-3 py-1.5 text-sm text-signal"
          >
            {r}
            <button
              onClick={() =>
                updateBar({ emailRecipients: recipients.filter((x) => x !== r) })
              }
              className="text-signal/70 hover:text-signal"
            >
              ✕
            </button>
          </span>
        ))}
        {recipients.length === 0 && (
          <span className="text-sm text-chalk-faint">No recipients yet.</span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          className="input max-w-xs"
          type="email"
          placeholder="bartender@bar.com"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && val.includes("@")) {
              updateBar({ emailRecipients: [...recipients, val.trim()] });
              setVal("");
            }
          }}
        />
        <button
          onClick={() => {
            if (val.includes("@")) {
              updateBar({ emailRecipients: [...recipients, val.trim()] });
              setVal("");
            }
          }}
          className="btn btn-ghost"
        >
          Add
        </button>
        <button
          onClick={send}
          disabled={recipients.length === 0}
          className="btn btn-signal"
        >
          ✉ Send today&apos;s board
        </button>
      </div>
      {status && <p className="mt-2 text-sm text-chalk-dim">{status}</p>}
      <p className="mt-2 text-xs text-chalk-faint">
        Requires a Resend API key in the deploy&apos;s environment. Without it, sending
        is a safe no-op and reports that it&apos;s not configured.
      </p>
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

          <label className="block">
            <span className="field-label">ZIP code (channel-lineup key)</span>
            <input
              className="input mt-1 max-w-[160px]"
              value={activeBar.zip ?? ""}
              placeholder="30303"
              onChange={(e) => updateBar({ zip: e.target.value })}
            />
            <p className="mt-1 text-xs text-chalk-faint">
              Cable/premium channel numbers are specific to your ZIP + provider.
              Enter it here, then confirm the numbers on the Channel Guide.
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

function BrandingCard() {
  const { activeBar, updateBar } = useStore();
  const b = activeBar.branding ?? {};
  const fileRef = useRef<HTMLInputElement>(null);

  function set(patch: Partial<Branding>) {
    updateBar({ branding: { ...b, ...patch } });
  }
  function setAccent(accent: string) {
    set({ accent, glow: lighten(accent, 0.35) });
  }
  function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set({ logoUrl: reader.result as string });
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  const activeAccent = b.accent ?? "#f5a623";

  return (
    <Card
      title="Branding & appearance"
      hint="White-label the board for your bar — logo, name, and accent color re-theme the whole app instantly."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Logo + text */}
        <div className="flex flex-col gap-4">
          <div>
            <div className="field-label mb-2">Logo</div>
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-md border border-ink-600 bg-ink-900">
                {b.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.logoUrl} alt="logo" className="h-full w-full object-contain" />
                ) : (
                  <span className="text-xs text-chalk-faint">none</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
                  ⬆ Upload logo
                </button>
                {b.logoUrl && (
                  <button className="btn btn-danger px-2.5 py-1" onClick={() => set({ logoUrl: undefined })}>
                    Remove
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onLogo} />
            </div>
          </div>

          <label className="block">
            <span className="field-label">Brand name (header)</span>
            <input
              className="input mt-1"
              value={b.brandName ?? ""}
              placeholder="GameBoard Pro"
              onChange={(e) => set({ brandName: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="field-label">Tagline</span>
            <input
              className="input mt-1"
              value={b.tagline ?? ""}
              placeholder="TV Command Board"
              onChange={(e) => set({ tagline: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="field-label">Default board layout</span>
            <select
              className="input mt-1"
              value={b.defaultBoardView ?? "byTv"}
              onChange={(e) => set({ defaultBoardView: e.target.value as Branding["defaultBoardView"] })}
            >
              <option value="byTv">By TV (timelines)</option>
              <option value="cards">Cards</option>
              <option value="table">Table</option>
            </select>
          </label>
        </div>

        {/* Accent color */}
        <div>
          <div className="field-label mb-2">Accent color</div>
          <div className="grid grid-cols-4 gap-2">
            {BRAND_PRESETS.map((p) => {
              const active = (b.accent ?? "#f5a623").toLowerCase() === p.accent.toLowerCase();
              return (
                <button
                  key={p.name}
                  onClick={() => set({ accent: p.accent, glow: p.glow })}
                  title={p.name}
                  className={`flex h-12 items-center justify-center rounded-md border-2 ${
                    active ? "border-chalk" : "border-ink-600"
                  }`}
                  style={{ background: `${p.accent}22` }}
                >
                  <span className="h-5 w-5 rounded-full" style={{ background: p.accent }} />
                </button>
              );
            })}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2">
              <input
                type="color"
                value={activeAccent}
                onChange={(e) => setAccent(e.target.value)}
                className="h-10 w-12 cursor-pointer rounded border border-ink-600 bg-ink-900"
                aria-label="Custom accent color"
              />
              <span className="field-label">Accent</span>
              <input
                className="input max-w-[110px] font-mono"
                value={activeAccent}
                onChange={(e) => hexToChannels(e.target.value) && setAccent(e.target.value)}
              />
            </label>
            <label className="flex items-center gap-2">
              <input
                type="color"
                value={b.glow ?? "#ffb84d"}
                onChange={(e) => hexToChannels(e.target.value) && set({ glow: e.target.value })}
                className="h-10 w-12 cursor-pointer rounded border border-ink-600 bg-ink-900"
                aria-label="Highlight color"
              />
              <span className="field-label">Highlight</span>
              <input
                className="input max-w-[110px] font-mono"
                value={b.glow ?? "#ffb84d"}
                onChange={(e) => hexToChannels(e.target.value) && set({ glow: e.target.value })}
              />
            </label>
          </div>
          <div className="mt-2">
            <button
              className="btn btn-ghost text-xs"
              onClick={() =>
                updateBar({ branding: { defaultBoardView: b.defaultBoardView } })
              }
            >
              Reset all branding
            </button>
          </div>

          {/* Live preview */}
          <div className="mt-4 rounded-lg border border-ink-600 bg-ink-900/60 p-4">
            <div className="field-label mb-2">Live preview</div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="tv-badge h-10 w-10 border-2 border-amber-accent/60 bg-amber-accent/10 text-amber-glow">5</span>
              <span className="btn btn-primary px-3 py-1.5 text-xs">Primary</span>
              <span className="label-chip border-amber-accent/50 bg-amber-accent/15 text-amber-glow">LOCAL</span>
              <span className="text-amber-glow">Accent text</span>
            </div>
            <p className="mt-2 text-xs text-chalk-faint">
              Changes apply across the whole app immediately.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

function AccountsCard() {
  if (CLERK_ENABLED) {
    return (
      <Card title="Staff logins" hint="Manager accounts are handled by Clerk.">
        <p className="text-sm text-chalk-dim">
          Logins are managed in your <span className="font-semibold text-chalk">Clerk dashboard</span> →
          Users. Invite your managers/owner there (restrict sign-ups via Clerk → Restrictions so
          only your people can get in). Bartenders use the public Staff View link — no login.
        </p>
      </Card>
    );
  }
  return <LocalAccountsCard />;
}

function LocalAccountsCard() {
  const { accounts, addAccount, updateAccount, removeAccount, user } = useSession();
  const [draft, setDraft] = useState({ name: "", username: "", password: "", role: "staff" as Role });
  const canManage = user?.role === "owner" || user?.role === "manager";

  return (
    <Card
      title="Staff logins"
      hint="Who can sign in and what they can do. Owners & managers get full access; staff see the board read-only."
    >
      {!canManage ? (
        <p className="text-sm text-chalk-faint">Only owners and managers can manage logins.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {accounts.map((a) => (
            <div
              key={a.id}
              className="flex flex-wrap items-center gap-2 rounded-md border border-ink-700 bg-ink-900/50 p-3"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-ink-600 bg-ink-800 text-sm font-bold text-amber-glow">
                {a.name.charAt(0)}
              </span>
              <input
                className="input max-w-[140px]"
                value={a.name}
                onChange={(e) => updateAccount(a.id, { name: e.target.value })}
              />
              <input
                className="input max-w-[120px] font-mono"
                value={a.username}
                onChange={(e) => updateAccount(a.id, { username: e.target.value })}
                placeholder="username"
              />
              <input
                className="input max-w-[120px] font-mono"
                value={a.password}
                onChange={(e) => updateAccount(a.id, { password: e.target.value })}
                placeholder="password"
              />
              <select
                className="input max-w-[120px]"
                value={a.role}
                onChange={(e) => updateAccount(a.id, { role: e.target.value as Role })}
              >
                <option value="owner">Owner</option>
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
              </select>
              <button
                onClick={() => removeAccount(a.id)}
                disabled={a.id === user?.id}
                className="btn btn-danger px-2.5 py-1.5 disabled:opacity-30"
                title={a.id === user?.id ? "You can't remove your own account" : "Remove"}
              >
                ✕
              </button>
            </div>
          ))}

          <div className="mt-2 flex flex-wrap items-end gap-2 rounded-md border border-dashed border-ink-600 p-3">
            <input
              className="input max-w-[140px]"
              placeholder="Name"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
            <input
              className="input max-w-[120px] font-mono"
              placeholder="username"
              value={draft.username}
              onChange={(e) => setDraft({ ...draft, username: e.target.value })}
            />
            <input
              className="input max-w-[120px] font-mono"
              placeholder="password"
              value={draft.password}
              onChange={(e) => setDraft({ ...draft, password: e.target.value })}
            />
            <select
              className="input max-w-[120px]"
              value={draft.role}
              onChange={(e) => setDraft({ ...draft, role: e.target.value as Role })}
            >
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
              <option value="owner">Owner</option>
            </select>
            <button
              className="btn btn-primary"
              disabled={!draft.name || !draft.username || !draft.password}
              onClick={() => {
                addAccount(draft);
                setDraft({ name: "", username: "", password: "", role: "staff" });
              }}
            >
              + Add login
            </button>
          </div>
          <p className="mt-1 text-xs text-chalk-faint">
            Passwords are stored on this device for the MVP gate. For real multi-device
            logins, wire Clerk (keys in the deploy environment).
          </p>
        </div>
      )}
    </Card>
  );
}
