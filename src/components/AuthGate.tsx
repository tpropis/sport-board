"use client";

import { useSession } from "@/lib/session";
import { LoginScreen } from "./LoginScreen";

/** Requires a login before the app is shown. */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { ready, user } = useSession();

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
