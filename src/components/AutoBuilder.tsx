"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { useLive } from "@/lib/live";
import { autoBuildAssignments } from "@/lib/autobuild";

/**
 * Auto-fills an empty board for *today* from the live schedule, once per day,
 * so the app is populated every day with no manual setup. A localStorage flag
 * means a manually-cleared board stays cleared.
 */
export function AutoBuilder() {
  const { activeBar, getBoard, saveBoard, newAssignmentId, currentDate, isToday } =
    useStore();
  const live = useLive();
  const tried = useRef("");

  useEffect(() => {
    if (!isToday || !live || live.all.length === 0) return;
    const key = `gb-autobuilt:${activeBar.id}:${currentDate}`;
    if (tried.current === key) return;
    const board = getBoard(currentDate);
    if (board.assignments.length > 0) return;
    if (typeof localStorage !== "undefined" && localStorage.getItem(key)) return;

    tried.current = key;
    try {
      localStorage.setItem(key, "1");
    } catch {
      /* ignore */
    }
    const fmt = (iso: string) => {
      try {
        return new Intl.DateTimeFormat("en-US", {
          timeZone: activeBar.timezone,
          hour: "numeric",
          minute: "2-digit",
        }).format(new Date(iso));
      } catch {
        return "";
      }
    };
    const built = autoBuildAssignments(live.all, activeBar, fmt, newAssignmentId);
    saveBoard({
      date: currentDate,
      published: true,
      assignments: built,
      generalNotes: board.generalNotes,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isToday, currentDate, live?.all.length, activeBar.id]);

  return null;
}
