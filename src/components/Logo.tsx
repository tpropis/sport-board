/**
 * GameBoard Pro mark — a TV wall inside a command-board badge. The amber parts
 * use `currentColor`, so setting `text-amber-accent` (a CSS variable) lets the
 * logo re-theme with each bar's brand color. The "live" screen stays signal-green.
 */
export function Logo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      role="img"
      aria-label="GameBoard Pro"
      fill="none"
    >
      <defs>
        <linearGradient id="gb-frame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b1f26" />
          <stop offset="1" stopColor="#0e1116" />
        </linearGradient>
      </defs>

      {/* Board frame */}
      <rect
        x="1.5"
        y="1.5"
        width="37"
        height="37"
        rx="10"
        fill="url(#gb-frame)"
        stroke="currentColor"
        strokeOpacity="0.55"
        strokeWidth="2"
      />
      {/* inner hairline */}
      <rect
        x="4.75"
        y="4.75"
        width="30.5"
        height="30.5"
        rx="7"
        stroke="#ffffff"
        strokeOpacity="0.06"
      />

      {/* TV wall — 3 × 2 screens, two lit */}
      {/* row 1 */}
      <rect x="8" y="12" width="6" height="6" rx="1.4" fill="#2b323c" />
      <rect x="17" y="12" width="6" height="6" rx="1.4" fill="currentColor" />
      <rect x="17" y="12" width="6" height="2" rx="1.4" fill="#ffffff" fillOpacity="0.25" />
      <rect x="26" y="12" width="6" height="6" rx="1.4" fill="#2b323c" />
      {/* row 2 */}
      <rect x="8" y="21" width="6" height="6" rx="1.4" fill="#2b323c" />
      <rect x="17" y="21" width="6" height="6" rx="1.4" fill="#2b323c" />
      <rect x="26" y="21" width="6" height="6" rx="1.4" fill="#34d17e" />

      {/* "on air" dot on the active screen */}
      <circle cx="20" cy="9" r="1.15" fill="currentColor" />
    </svg>
  );
}
