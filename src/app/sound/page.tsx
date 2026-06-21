"use client";

import { useStore } from "@/lib/store";
import { SectionHeader, Pill } from "@/components/ui";
import { MAIN_AUDIO_EVENTS, DEFAULT_SOUND_RULES } from "@/lib/constants";
import { SOUND_OPTIONS } from "@/lib/types";

const SOUND_TONE: Record<string, string> = {
  "Music stays on": "border-ink-600 bg-ink-800 text-chalk-dim",
  "Main audio recommended": "border-signal/50 bg-signal/10 text-signal",
  "Audio optional": "border-amber-accent/40 bg-amber-accent/10 text-amber-glow",
  "Crowd request only": "border-amber-accent/40 bg-amber-accent/10 text-amber-glow",
  "Manager decision": "border-ink-600 bg-ink-800 text-chalk-dim",
};

export default function SoundRulesPage() {
  const { activeBar } = useStore();

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader kicker="Configuration" title="Sound Rules">
        <Pill tone="neutral">Default: music stays on</Pill>
      </SectionHeader>

      {/* Hero rule */}
      <div className="panel relative overflow-hidden p-6">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-signal/50 to-transparent" />
        <div className="flex items-start gap-4">
          <span className="text-4xl">🎵</span>
          <div>
            <h2 className="font-display text-2xl font-bold text-chalk">
              Most of the time, music stays on.
            </h2>
            <p className="mt-1 max-w-2xl text-chalk-dim">
              The room runs on music by default. Only switch to game audio for the
              marquee moments below — or on a manager / crowd call.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* When to switch */}
        <section className="panel p-5">
          <h3 className="mb-3 font-display text-lg font-bold text-chalk">
            When sports audio is recommended
          </h3>
          <ul className="grid gap-1.5">
            {MAIN_AUDIO_EVENTS.map((e) => (
              <li
                key={e}
                className="flex items-center gap-2.5 rounded-md border border-ink-700 bg-ink-900/40 px-3 py-2 text-sm text-chalk-dim"
              >
                <span className="text-signal">🔊</span>
                {e}
              </li>
            ))}
          </ul>
        </section>

        {/* Sound options */}
        <section className="panel p-5">
          <h3 className="mb-3 font-display text-lg font-bold text-chalk">
            Sound options
          </h3>
          <div className="flex flex-col gap-2.5">
            {DEFAULT_SOUND_RULES.map((r) => (
              <div
                key={r.label}
                className="rounded-md border border-ink-700 bg-ink-900/40 p-3"
              >
                <span
                  className={`label-chip ${SOUND_TONE[r.label] ?? "border-ink-600 text-chalk-dim"}`}
                >
                  {r.label}
                </span>
                <p className="mt-1.5 text-sm text-chalk-dim">{r.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-md border border-ink-700 bg-ink-900/60 p-3 text-xs text-chalk-faint">
            This bar&apos;s default rule:{" "}
            <span className="font-semibold text-chalk">{activeBar.defaultSoundRule}</span>.
            Change it in Bar Setup. Options available on every assignment:{" "}
            {SOUND_OPTIONS.join(" · ")}.
          </div>
        </section>
      </div>
    </div>
  );
}
