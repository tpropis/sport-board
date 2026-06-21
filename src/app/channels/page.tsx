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
  const { activeBar } = useStore();
  const [providerId, setProviderId] = useState(activeBar.providerId ?? "directv");
  const provider = getProvider(providerId);
  const [q, setQ] = useState("");

  const rows = NETWORKS.filter((n) =>
    n.toLowerCase().includes(q.trim().toLowerCase()),
  );

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
        always find the game. Pick a network on the board and the channel auto-fills
        from here. Switch providers to compare — the same network lives on a
        different number for each one.
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
        {provider?.note && (
          <span className="text-xs text-chalk-faint">{provider.note}</span>
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
          <div className="grid grid-cols-[1fr_auto] gap-2 border-b border-ink-600 px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-chalk-faint">
            <span>Network</span>
            <span>Channel</span>
          </div>
          <div className="divide-y divide-ink-700/60">
            {rows.map((n) => {
              const num = CHANNEL_LINEUP[n]?.[providerId];
              const isLocal = LOCAL_NETWORKS.has(n);
              return (
                <div
                  key={n}
                  className="grid grid-cols-[1fr_auto] items-center gap-2 px-4 py-2.5"
                >
                  <span className="flex items-center gap-2 font-medium text-chalk">
                    {n}
                    {isLocal && (
                      <span className="rounded border border-ink-600 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-chalk-faint">
                        local
                      </span>
                    )}
                  </span>
                  {num ? (
                    <span className="tnum rounded-md border border-amber-accent/40 bg-amber-accent/10 px-3 py-1 font-mono text-base font-bold text-amber-glow">
                      {num}
                    </span>
                  ) : (
                    <span className="tnum px-3 py-1 font-mono text-sm text-chalk-faint">
                      {isLocal ? "local affiliate" : "—"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-xs text-chalk-faint">
        Satellite (DIRECTV / DISH) numbers are national. Cable numbers vary by
        region — confirm against your box and edit as needed. Broadcast locals
        (FOX / NBC / ABC / CBS / CW) follow your market&apos;s affiliate; Atlanta
        numbers are shown.
      </p>
    </div>
  );
}
