import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Charcoal base — the bar office at night
        ink: {
          950: "#0a0b0d",
          900: "#0e1013",
          850: "#13161a",
          800: "#181b20",
          750: "#1d2127",
          700: "#23282f",
          600: "#2c323b",
          500: "#3a414c",
        },
        // Brand accent — driven by CSS variables so each bar can re-theme the
        // whole app (defaults to warm bar-lighting amber). RGB channels enable
        // Tailwind opacity modifiers like `amber-accent/40`.
        amber: {
          accent: "rgb(var(--brand-accent) / <alpha-value>)",
          glow: "rgb(var(--brand-glow) / <alpha-value>)",
        },
        // Operational scoreboard green
        signal: {
          DEFAULT: "#34d17e",
          dim: "#1f8a52",
          deep: "#0f5132",
        },
        // Alert / needs-check red
        alert: {
          DEFAULT: "#e5484d",
          dim: "#9b2c2f",
        },
        chalk: {
          DEFAULT: "#e8e6e1",
          dim: "#a7a59f",
          faint: "#6f6e6a",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.7)",
        marker: "0 4px 14px -2px rgba(0,0,0,0.8), 0 0 0 1px rgba(245,166,35,0.4)",
      },
      backgroundImage: {
        noise:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};

export default config;
