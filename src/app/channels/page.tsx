"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { SectionHeader, Pill } from "@/components/ui";
import {
  PROVIDERS,
  NETWORKS,
  CHANNEL_LINEUP,
  LOCAL_NETWORKS,
  getProvider,
} from "@/lib/providers";

export default function ChannelGuide() {
  const { activeBar, updateBar } = useStore();
  const [providerId, setProviderId] = useState(activeBar.providerId ?? "directv");
  const provider = getProvider(providerId);
  const [q, setQ] = useState("");

  const overrides = activeBar.channelOverrides?.[providerId] ?? {};

  function setChannel(network: string, value: string) {
    const all = { ...(activeBar.channelOverrides ?? {}) };
    const forProvider = { ...(all[providerId] ?? {}) };
    if (value.trim()) forProvider[network] = value.trim();
    else delete forProvider[network];
    all[providerId] = forProvider;
    updateBar({ channelOverrides: all });
  }

  const rows = NETWORKS.filter((n) =>
    n.toLowerCase().includes(q.trim().toLowerCase()),
  );

  const confirmedCount = Object.keys(overrides).length;
  const seededCount = NETWORKS.filter((n) => CHANNEL_LINEUP[n]?.[providerId]).length;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader kicker="Configuration · Reference" title="Channel Guide">
        {provider && (
          <Pill tone={provider.type === "satellite" ? "signal" : "amber"}>
            {provider.name}
          </Pill>
        )}
      </SectionHeader>

      <p className="max-w-3xl text-sm text-chalk-dim">
        The channel number for every network on your provider, so a bartender can
        always find the game — and the board auto-fills it. Satellite numbers
        (DIRECTV / DISH) are national. <strong className="text-chalk">Cable numbers
        vary by market</strong>, so confirm yours once here and they&apos;re locked
        in for this bar everywhere.
      </p>

      <div className="panel flex flex-wrap items-center gap-3 p-4">
        <label className="flex items-center gap-2">
          <span className="field-label">Provider</span>
          <select
            className="input"
            value={providerId}
            onChange={(e) => setProviderId(e.target.value)}
          >
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <input
          className="input max-w-xs"
          placeholder="Filter networks…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {provider?.type !== "streaming" && (
          <span className="text-xs text-chalk-faint">
            {seededCount} seeded · {confirmedCount} confirmed by you
          </span>
        )}
      </div>

      {provider?.type === "streaming" ? (
        <div className="panel p-6">
          <p className="text-chalk-dim">
            <span className="font-semibold text-chalk">{provider.name}</span> tunes
            by network name in the app — there are no channel numbers. Bartenders
            search the network (e.g. &quot;FS1&quot;) in the {provider.name} guide.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {rows.map((n) => (
              <span
                key={n}
                className="rounded-md border border-ink-600 bg-ink-800 px-2.5 py-1 text-sm text-chalk-dim"
              >
                {n}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="panel overflow-hidden">
          <div className="grid grid-cols-[1fr_140px] gap-2 border-b border-ink-600 px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-chalk-faint">
            <span>Network</span>
            <span>Channel #</span>
          </div>
          <div className="divide-y divide-ink-700/60">
            {rows.map((n) => {
              const seeded = CHANNEL_LINEUP[n]?.[providerId];
              const override = overrides[n];
              const isLocal = LOCAL_NETWORKS.has(n);
              return (
                <div
                  key={n}
                  className="grid grid-cols-[1fr_140px] items-center gap-2 px-4 py-2"
                >
                  <span className="flex items-center gap-2 font-medium text-chalk">
                    {n}
                    {isLocal && (
                      <span className="rounded border border-ink-600 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-chalk-faint">
                        local
                      </span>
                    )}
                    {override && (
                      <span
                        className="rounded border border-signal/40 bg-signal/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-signal"
                        title="Confirmed by you"
                      >
                        ✓ yours
                      </span>
                    )}
                  </span>
                  <input
                    className="input tnum px-2 py-1 text-center font-mono"
                    value={override ?? ""}
                    placeholder={seeded ?? (isLocal ? "local #" : "set #")}
                    onChange={(e) => setChannel(n, e.target.value)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-xs text-chalk-faint">
        Type a number to confirm it for this bar (overrides the seeded value and
        wins everywhere). Clear it to fall back to the seeded number. Satellite
        seeds are national; cable seeds are a starting point — verify against your
        box.
      </p>
    </div>
  );
}
