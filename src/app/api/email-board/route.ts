import { NextResponse } from "next/server";
import type { Bar, DailyBoard } from "@/lib/types";
import { renderBoardEmailHtml } from "@/lib/emailBoard";
import { buildSeedState } from "@/lib/seed";
import { assembleSchedule } from "@/lib/schedule/assemble";
import { autoBuildAssignments } from "@/lib/autobuild";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const FROM = process.env.RESEND_FROM || "GameBoard Pro <onboarding@resend.dev>";

async function sendViaResend(to: string[], subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: false, reason: "RESEND_API_KEY not configured" };
  if (to.length === 0) return { sent: false, reason: "No recipients" };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });
  if (!res.ok) {
    return { sent: false, reason: `Resend error ${res.status}: ${await res.text()}` };
  }
  return { sent: true, id: (await res.json())?.id };
}

function todayInZone(tz: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Client-driven: email the board exactly as it is in the app (with edits). */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      to?: string[];
      date?: string;
      bar?: Bar;
      board?: DailyBoard;
    };
    if (!body.bar || !body.board || !body.date) {
      return NextResponse.json({ sent: false, reason: "Missing bar/board/date" }, { status: 400 });
    }
    const to = (body.to ?? []).filter(Boolean);
    const html = renderBoardEmailHtml(body.bar, body.board, body.date);
    const subject = `${body.bar.name} GameBoard — ${body.date}`;
    const result = await sendViaResend(to, subject, html);
    return NextResponse.json(result, { status: result.sent ? 200 : 200 });
  } catch (e) {
    return NextResponse.json({ sent: false, reason: String(e) }, { status: 500 });
  }
}

/**
 * Cron-driven: build today's board server-side from the live schedule and email
 * it — no browser needed. Protect with ?token=EMAIL_CRON_TOKEN. Recipients come
 * from MORNING_BOARD_TO (comma-separated).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!process.env.EMAIL_CRON_TOKEN || token !== process.env.EMAIL_CRON_TOKEN) {
    return NextResponse.json({ sent: false, reason: "Unauthorized" }, { status: 401 });
  }
  const bar = buildSeedState().bars[0];
  const date = url.searchParams.get("date") ?? todayInZone(bar.timezone ?? "America/New_York");
  const { events } = await assembleSchedule(date);
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat("en-US", {
      timeZone: bar.timezone,
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  const assignments = autoBuildAssignments(
    events,
    bar,
    (iso) => (fmt(iso) === "12:00 AM" ? "All day" : fmt(iso)),
    () => `as-${Math.random().toString(36).slice(2, 8)}`,
  );
  const board: DailyBoard = { date, published: true, assignments, generalNotes: "" };
  const to = (process.env.MORNING_BOARD_TO ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const html = renderBoardEmailHtml(bar, board, date);
  const result = await sendViaResend(to, `${bar.name} GameBoard — ${date}`, html);
  return NextResponse.json({ ...result, date, games: assignments.length });
}
