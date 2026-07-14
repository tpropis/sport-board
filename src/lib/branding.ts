/** Branding color helpers — hex ⇆ "r g b" channels for the CSS variables. */

export function hexToChannels(hex: string): string | null {
  const m = hex.trim().replace(/^#/, "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

/** Lighten a hex color toward white by `amt` (0-1) — used to derive the glow. */
export function lighten(hex: string, amt = 0.35): string {
  const ch = hexToChannels(hex);
  if (!ch) return hex;
  const [r, g, b] = ch.split(" ").map(Number);
  const up = (v: number) => Math.round(v + (255 - v) * amt);
  const h = (v: number) => up(v).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** Curated accent presets (accent + derived glow). */
export const BRAND_PRESETS: { name: string; accent: string; glow: string }[] = [
  { name: "Amber (default)", accent: "#f5a623", glow: "#ffb84d" },
  { name: "Signal Green", accent: "#34d17e", glow: "#6ff0a8" },
  { name: "Tavern Red", accent: "#e5484d", glow: "#ff7a7e" },
  { name: "Ice Blue", accent: "#3b9eff", glow: "#7cc4ff" },
  { name: "Royal Purple", accent: "#8b5cf6", glow: "#b79cff" },
  { name: "Gold", accent: "#d4af37", glow: "#ecd07a" },
  { name: "Teal", accent: "#14b8a6", glow: "#5fe3d3" },
  { name: "Hot Pink", accent: "#ec4899", glow: "#ff7ab8" },
];
