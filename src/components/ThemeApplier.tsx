"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { hexToChannels } from "@/lib/branding";

/** Applies the active bar's brand accent to the document CSS variables so the
 *  whole app (every amber-* class) re-themes. Mounted above all routes. */
export function ThemeApplier() {
  const { activeBar } = useStore();
  const accent = activeBar?.branding?.accent;
  const glow = activeBar?.branding?.glow;

  useEffect(() => {
    const root = document.documentElement;
    const a = accent ? hexToChannels(accent) : null;
    const g = glow ? hexToChannels(glow) : null;
    if (a) root.style.setProperty("--brand-accent", a);
    else root.style.removeProperty("--brand-accent");
    if (g) root.style.setProperty("--brand-glow", g);
    else root.style.removeProperty("--brand-glow");
  }, [accent, glow]);

  return null;
}
