"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Toggle } from "./ui";

const NAV: { href: string; label: string; group: string }[] = [
  { href: "/", label: "Command Center", group: "Operate" },
  { href: "/board", label: "Today's Board", group: "Operate" },
  { href: "/edit", label: "Edit Board", group: "Operate" },
  { href: "/staff", label: "Staff View", group: "Operate" },
  { href: "/print", label: "Print View", group: "Operate" },
  { href: "/tv-layout", label: "TV Layout & Photos", group: "Configure" },
  { href: "/setup", label: "Bar Setup", group: "Configure" },
  { href: "/services", label: "Services & Streaming", group: "Configure" },
  { href: "/channels", label: "Channel Guide", group: "Configure" },
  { href: "/priority", label: "Priority Rules", group: "Configure" },
  { href: "/sound", label: "Sound Rules", group: "Configure" },
  { href: "/vision", label: "Platform Vision", group: "About" },
];

// Routes that render bare (no manager chrome).
const BARE_ROUTES = ["/print", "/staff"];

function Wordmark() {
  return (
    <Link href="/" className="group flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-md border border-amber-accent/50 bg-amber-accent/10">
        <span className="block h-3.5 w-3.5 rounded-[3px] bg-amber-accent shadow-[0_0_10px_2px_rgba(245,166,35,0.5)]" />
      </span>
      <span className="leading-none">
        <span className="block font-display text-[15px] font-extrabold tracking-tight text-chalk">
          GameBoard<span className="text-amber-accent"> Pro</span>
        </span>
        <span className="block font-mono text-[9px] uppercase tracking-[0.25em] text-chalk-faint">
          TV Command Board
        </span>
      </span>
    </Link>
  );
}

function BarSelector() {
  const { state, activeBar, setActiveBar } = useStore();
  if (state.bars.length <= 1) {
    return (
      <div className="hidden items-center gap-2 rounded-md border border-ink-600 bg-ink-900 px-3 py-1.5 lg:flex">
        <span className="h-1.5 w-1.5 rounded-full bg-signal shadow-[0_0_8px_1px_rgba(52,209,126,0.7)]" />
        <span className="text-sm font-semibold text-chalk">{activeBar.name}</span>
        <span className="text-xs text-chalk-faint">· {activeBar.location}</span>
      </div>
    );
  }
  return (
    <select
      value={activeBar.id}
      onChange={(e) => setActiveBar(e.target.value)}
      className="input max-w-[220px]"
    >
      {state.bars.map((b) => (
        <option key={b.id} value={b.id}>
          {b.name}
        </option>
      ))}
    </select>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { managerMode, setManagerMode, ready } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (BARE_ROUTES.includes(pathname)) {
    return <>{children}</>;
  }

  const groups = Array.from(new Set(NAV.map((n) => n.group)));

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Sidebar */}
      <aside
        className={`no-print fixed inset-y-0 left-0 z-40 w-64 transform border-r border-ink-700 bg-ink-900/95 backdrop-blur transition-transform lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center border-b border-ink-700 px-4">
          <Wordmark />
        </div>
        <nav className="flex flex-col gap-5 overflow-y-auto px-3 py-5">
          {groups.map((group) => (
            <div key={group}>
              <div className="mb-1.5 px-3 font-mono text-[10px] uppercase tracking-[0.2em] text-chalk-faint">
                {group}
              </div>
              <div className="flex flex-col gap-0.5">
                {NAV.filter((n) => n.group === group).map((n) => {
                  const active = pathname === n.href;
                  return (
                    <Link
                      key={n.href}
                      href={n.href}
                      onClick={() => setMobileOpen(false)}
                      className={`nav-link ${active ? "nav-link-active border-l-2 border-amber-accent pl-2.5" : ""}`}
                    >
                      {n.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {mobileOpen && (
        <div
          className="no-print fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-ink-700 bg-ink-950/85 px-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="btn btn-ghost px-2.5 py-1.5 lg:hidden"
              aria-label="Toggle navigation"
            >
              ☰
            </button>
            <div className="lg:hidden">
              <Wordmark />
            </div>
            <div className="hidden lg:block">
              <BarSelector />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <span className="field-label">
                {managerMode ? "Manager" : "Staff"} mode
              </span>
              <Toggle
                checked={managerMode}
                onChange={setManagerMode}
                label="Manager mode"
              />
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            {ready ? children : <BootSkeleton />}
          </div>
        </main>
      </div>
    </div>
  );
}

function BootSkeleton() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="flex items-center gap-3 font-mono text-sm text-chalk-faint">
        <span className="h-2 w-2 animate-pulse rounded-full bg-amber-accent" />
        Loading command board…
      </div>
    </div>
  );
}
