"use client";

import { useState } from "react";
import type { Assignment, AssignmentLabel, SoundRuleValue } from "@/lib/types";
import { SOUND_OPTIONS } from "@/lib/types";
import { useStore } from "@/lib/store";
import { Toggle } from "./ui";
import { BRAVES_NATIONAL_OPTIONS } from "@/lib/constants";
import { NETWORKS, channelFor, matchNetwork, getProvider } from "@/lib/providers";

const MANUAL_LABELS: AssignmentLabel[] = ["LOCAL", "BIG GAME", "PLAYOFF"];

function Labeled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export function AssignmentEditor({
  draft,
  onSave,
  onCancel,
}: {
  draft: Assignment;
  onSave: (a: Assignment) => void;
  onCancel: () => void;
}) {
  const { activeBar } = useStore();
  const [a, setA] = useState<Assignment>(draft);

  const set = <K extends keyof Assignment>(key: K, value: Assignment[K]) =>
    setA((prev) => ({ ...prev, [key]: value }));

  const toggleLabel = (l: AssignmentLabel) =>
    setA((prev) => ({
      ...prev,
      labels: prev.labels.includes(l)
        ? prev.labels.filter((x) => x !== l)
        : [...prev.labels, l],
    }));

  // Special Braves logic — one-tap local Braves routing.
  const bravesLocal = () =>
    setA((prev) => ({
      ...prev,
      watchOn: "BravesVision",
      directvChannel: "645",
      streamingApp: "Braves.TV / MLB app",
      sport: prev.sport || "Baseball",
      league: prev.league || "MLB",
      labels: prev.labels.includes("LOCAL") ? prev.labels : [...prev.labels, "LOCAL"],
      notes:
        prev.notes ||
        "Check BravesVision first. Subject to blackout or national exclusivity — then check national listing.",
    }));

  const tvOptions = activeBar.tvOrder;
  const provider = getProvider(activeBar.providerId);

  // Picking a known network auto-fills the channel number for the bar's provider.
  function setWatchOn(value: string) {
    const net = matchNetwork(value);
    const ch = channelFor(net ?? "", activeBar.providerId);
    setA((prev) => ({
      ...prev,
      watchOn: value,
      ...(ch ? { directvChannel: ch } : {}),
    }));
  }
  const suggestedChannel = channelFor(matchNetwork(a.watchOn) ?? "", activeBar.providerId);

  return (
    <div className="flex max-h-[88vh] flex-col">
      <div className="flex items-center justify-between border-b border-ink-700 px-5 py-4">
        <h3 className="font-display text-lg font-bold text-chalk">
          {draft.eventName ? "Edit assignment" : "New assignment"}
        </h3>
        <button onClick={onCancel} className="btn btn-ghost px-2.5 py-1">
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="mb-4 flex flex-wrap gap-2">
          <button onClick={bravesLocal} className="btn btn-primary px-3 py-1.5 text-xs">
            ⚾ Braves local quick-fill (645)
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Labeled label="TV assignment">
            <select
              className="input"
              value={a.tvNumber}
              onChange={(e) => set("tvNumber", Number(e.target.value))}
            >
              {tvOptions.map((n) => {
                const tv = activeBar.tvs.find((t) => t.number === n);
                return (
                  <option key={n} value={n}>
                    TV {n}
                    {tv?.description ? ` — ${tv.description}` : ""}
                  </option>
                );
              })}
            </select>
          </Labeled>
          <Labeled label="Priority level (1 = highest)">
            <input
              type="number"
              min={1}
              className="input"
              value={a.priority}
              onChange={(e) => set("priority", Number(e.target.value))}
            />
          </Labeled>

          <Labeled label="Event name">
            <input
              className="input"
              value={a.eventName}
              placeholder="e.g. Braves vs Mets"
              onChange={(e) => set("eventName", e.target.value)}
            />
          </Labeled>
          <div className="grid grid-cols-2 gap-3">
            <Labeled label="Team 1">
              <input
                className="input"
                value={a.team1 ?? ""}
                onChange={(e) => set("team1", e.target.value)}
              />
            </Labeled>
            <Labeled label="Team 2 / opponent">
              <input
                className="input"
                value={a.team2 ?? ""}
                onChange={(e) => set("team2", e.target.value)}
              />
            </Labeled>
          </div>

          <Labeled label="Sport">
            <input
              className="input"
              value={a.sport ?? ""}
              placeholder="Baseball, Football…"
              onChange={(e) => set("sport", e.target.value)}
            />
          </Labeled>
          <Labeled label="League">
            <input
              className="input"
              value={a.league ?? ""}
              placeholder="MLB, NFL, SEC…"
              onChange={(e) => set("league", e.target.value)}
            />
          </Labeled>

          <Labeled label="Start time">
            <input
              className="input"
              value={a.startTime ?? ""}
              placeholder="7:20 PM"
              onChange={(e) => set("startTime", e.target.value)}
            />
          </Labeled>
          <Labeled label="End time (optional)">
            <input
              className="input"
              value={a.endTime ?? ""}
              placeholder="10:30 PM"
              onChange={(e) => set("endTime", e.target.value)}
            />
          </Labeled>

          <Labeled label="Watch On (channel / network)">
            <input
              className="input"
              value={a.watchOn ?? ""}
              placeholder="BravesVision, FOX, ESPN…"
              onChange={(e) => setWatchOn(e.target.value)}
              list="network-list"
            />
            <datalist id="network-list">
              {NETWORKS.map((o) => (
                <option key={o} value={o} />
              ))}
              {BRAVES_NATIONAL_OPTIONS.map((o) => (
                <option key={o} value={o} />
              ))}
            </datalist>
          </Labeled>
          <Labeled label={`Channel #${provider ? ` · ${provider.name}` : ""}`}>
            <input
              className="input"
              value={a.directvChannel ?? ""}
              placeholder={provider?.type === "streaming" ? "by app" : "e.g. 219"}
              onChange={(e) => set("directvChannel", e.target.value)}
            />
            {suggestedChannel && a.directvChannel !== suggestedChannel && (
              <button
                type="button"
                onClick={() => set("directvChannel", suggestedChannel)}
                className="mt-1 text-xs text-amber-glow hover:underline"
              >
                Use {provider?.name} ch {suggestedChannel} →
              </button>
            )}
          </Labeled>

          <Labeled label="Streaming app">
            <select
              className="input"
              value={a.streamingApp ?? ""}
              onChange={(e) => set("streamingApp", e.target.value)}
            >
              <option value="">— none —</option>
              {activeBar.services
                .filter((s) => s.available)
                .map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
            </select>
          </Labeled>
          <div className="grid grid-cols-2 gap-3">
            <Labeled label="Device">
              <select
                className="input"
                value={a.device ?? ""}
                onChange={(e) => set("device", e.target.value)}
              >
                <option value="">—</option>
                {activeBar.devices.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </Labeled>
            <Labeled label="Remote">
              <select
                className="input"
                value={a.remote ?? ""}
                onChange={(e) => set("remote", e.target.value)}
              >
                <option value="">—</option>
                {activeBar.remotes.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
            </Labeled>
          </div>

          <Labeled label="Sound recommendation">
            <select
              className="input"
              value={a.soundRule}
              onChange={(e) => set("soundRule", e.target.value as SoundRuleValue)}
            >
              {SOUND_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Labeled>
          <Labeled label="Quick labels">
            <div className="flex flex-wrap gap-2 pt-1">
              {MANUAL_LABELS.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => toggleLabel(l)}
                  className={`label-chip ${
                    a.labels.includes(l)
                      ? "border-amber-accent/60 bg-amber-accent/15 text-amber-glow"
                      : "border-ink-600 text-chalk-faint"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </Labeled>
        </div>

        <div className="mt-4">
          <Labeled label="Notes for bartenders">
            <textarea
              className="input h-20 resize-none"
              value={a.notes ?? ""}
              placeholder="Local priority. Check national listing if blacked out."
              onChange={(e) => set("notes", e.target.value)}
            />
          </Labeled>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-md border border-ink-600 bg-ink-900 px-4 py-3">
          <span className="text-sm font-semibold text-chalk">
            Confirmed for tonight?
          </span>
          <Toggle checked={a.confirmed} onChange={(v) => set("confirmed", v)} />
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-ink-700 px-5 py-4">
        <button onClick={onCancel} className="btn btn-ghost">
          Cancel
        </button>
        <button
          onClick={() => onSave(a)}
          className="btn btn-signal"
          disabled={!a.eventName.trim()}
        >
          Save assignment
        </button>
      </div>
    </div>
  );
}
