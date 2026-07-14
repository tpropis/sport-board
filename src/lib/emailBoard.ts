import type { Bar, DailyBoard, Assignment } from "./types";
import { getProvider } from "./providers";

const ZONE_ABBREV: Record<string, string> = {
  "America/New_York": "ET",
  "America/Chicago": "CT",
  "America/Denver": "MT",
  "America/Phoenix": "MST",
  "America/Los_Angeles": "PT",
  "America/Anchorage": "AKT",
  "Pacific/Honolulu": "HT",
};
function zoneLabel(tz?: string): string {
  return tz ? ZONE_ABBREV[tz] ?? "" : "";
}

function esc(s?: string): string {
  return (s ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string,
  );
}

function longDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function title(a: Assignment): string {
  const real = (x?: string) => !!x && !/^(tbd|tba|undecided)$/i.test(x.trim());
  return real(a.team1) && real(a.team2) ? `${a.team1} vs ${a.team2}` : a.eventName;
}

/** Render the daily board as a self-contained HTML email (inline styles). */
export function renderBoardEmailHtml(bar: Bar, board: DailyBoard, date: string): string {
  const provider = getProvider(bar.providerId)?.name ?? "Channel";
  const tz = zoneLabel(bar.timezone);
  const order = bar.tvOrder;

  const tvStrip = order
    .map(
      (n) =>
        `<span style="display:inline-block;border:2px solid #111;border-radius:4px;font:700 14px monospace;padding:3px 8px;margin:0 4px 4px 0;">${n}</span>`,
    )
    .join("");

  const rows = board.assignments
    .slice()
    .sort((a, b) => order.indexOf(a.tvNumber) - order.indexOf(b.tvNumber))
    .map((a) => {
      const note = a.notes
        ? `<div style="font-size:11px;color:#555;font-style:italic;">${esc(a.notes)}</div>`
        : "";
      return `<tr style="border-bottom:1px solid #ddd;vertical-align:top;">
        <td style="padding:6px 4px;text-align:center;font:700 16px monospace;">${a.tvNumber}</td>
        <td style="padding:6px 4px;"><strong>${esc(title(a))}</strong>
          <div style="font-size:11px;color:#666;">${esc([a.sport, a.league].filter(Boolean).join(" · "))}</div>${note}</td>
        <td style="padding:6px 4px;white-space:nowrap;font-family:monospace;">${esc(a.startTime)}</td>
        <td style="padding:6px 4px;font-weight:600;">${esc(a.watchOn)}</td>
        <td style="padding:6px 4px;font-family:monospace;">${esc(a.directvChannel)}</td>
        <td style="padding:6px 4px;">${esc(a.streamingApp)}</td>
        <td style="padding:6px 4px;">${esc(a.soundRule)}</td>
      </tr>`;
    })
    .join("");

  return `<!doctype html><html><body style="margin:0;background:#f4f4f2;padding:20px;font-family:Arial,Helvetica,sans-serif;color:#111;">
  <div style="max-width:720px;margin:0 auto;background:#fff;padding:24px;border-radius:8px;">
    <div style="display:flex;justify-content:space-between;border-bottom:4px solid #111;padding-bottom:8px;">
      <div>
        <h1 style="margin:0;font-size:24px;text-transform:uppercase;letter-spacing:-0.5px;">${esc(bar.name)} GameBoard</h1>
        <div style="font-size:13px;color:#666;">${longDate(date)}${tz ? ` · all times ${tz}` : ""}</div>
      </div>
      <div style="text-align:right;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#888;">GameBoard&nbsp;Pro<br><span style="font-weight:400;text-transform:none;letter-spacing:0;">${esc(bar.location)}</span></div>
    </div>

    <div style="margin-top:14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#888;">TV order · left → right</div>
    <div style="margin-top:4px;">${tvStrip}</div>

    <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:12px;text-align:left;">
      <thead><tr style="border-top:2px solid #111;border-bottom:2px solid #111;">
        <th style="padding:6px 4px;">TV</th><th style="padding:6px 4px;">Game / Event</th>
        <th style="padding:6px 4px;">Time${tz ? ` (${tz})` : ""}</th><th style="padding:6px 4px;">Watch On</th>
        <th style="padding:6px 4px;">${esc(provider)}</th><th style="padding:6px 4px;">Streaming</th>
        <th style="padding:6px 4px;">Sound</th>
      </tr></thead>
      <tbody>${rows || `<tr><td colspan="7" style="padding:16px;text-align:center;color:#888;">No games assigned.</td></tr>`}</tbody>
    </table>

    <div style="margin-top:16px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#888;">Notes</div>
    <div style="margin-top:4px;border:1px solid #ddd;padding:8px;font-size:12px;min-height:24px;">${esc(board.generalNotes) || "—"}</div>

    <div style="margin-top:20px;border-top:2px solid #111;padding-top:8px;font-size:11px;font-weight:600;text-transform:uppercase;color:#666;display:flex;justify-content:space-between;">
      <span>${esc(bar.setupNotes)}</span><span>Default sound is music unless marked otherwise.</span>
    </div>
  </div>
  </body></html>`;
}
