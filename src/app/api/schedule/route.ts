import { NextResponse } from "next/server";
import { assembleSchedule } from "@/lib/schedule/assemble";

// Always fresh — this is the live surface.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const date = url.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  return NextResponse.json(await assembleSchedule(date));
}
