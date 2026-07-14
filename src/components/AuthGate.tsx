"use client";

import { usePathname } from "next/navigation";
import { useSession } from "@/lib/session";
import { LoginScreen } from "./LoginScreen";

// Public, read-only routes — the shareable staff link works without a login.
const PUBLIC_ROUTES = ["/staff"];

/** Requires a login before the app is shown (except public routes). */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { ready, user } = useSession();
  const pathname = usePathname();

  if (PUBLIC_ROUTES.includes(pathname)) return <>{children}</>;

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950">
        <span className="font-mono text-sm text-chalk-faint">Loading…</span>
      </div>
    );
  }
  if (!user) return <LoginScreen />;
  return <>{children}</>;
}
