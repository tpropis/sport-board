"use client";

/**
 * Unified access layer. When Clerk keys are present (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY),
 * the app uses Clerk for secure manager login; otherwise it falls back to the
 * built-in local session. Either way the app reads access through useAccess(),
 * and the public /staff link stays open without a login.
 *
 * Rollback is trivial: remove the Clerk env vars on Netlify and it reverts to
 * the built-in login on the next deploy.
 */
import { createContext, useContext, useMemo } from "react";
import { usePathname } from "next/navigation";
import {
  ClerkProvider,
  SignIn,
  SignedIn,
  SignedOut,
  useUser,
  useClerk,
} from "@clerk/nextjs";
import { SessionProvider, useSession, type Role } from "./session";
import { LoginScreen } from "@/components/LoginScreen";
import { Logo } from "@/components/Logo";

export const CLERK_ENABLED = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const PUBLIC_ROUTES = ["/staff"];

export interface Access {
  mode: "clerk" | "local";
  signedIn: boolean;
  isManager: boolean;
  name: string;
  role: Role;
  signOut: () => void;
}

const AccessContext = createContext<Access | null>(null);
export function useAccess(): Access {
  const ctx = useContext(AccessContext);
  if (!ctx) throw new Error("useAccess must be used within AccessRoot");
  return ctx;
}

/** Picks the auth backend and gates the app. */
export function AccessRoot({ children }: { children: React.ReactNode }) {
  if (CLERK_ENABLED) {
    return (
      <ClerkProvider>
        <ClerkAccess>{children}</ClerkAccess>
      </ClerkProvider>
    );
  }
  return (
    <SessionProvider>
      <LocalAccess>{children}</LocalAccess>
    </SessionProvider>
  );
}

// ---------------- Clerk ----------------

function ClerkAccess({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Public read-only routes bypass the login entirely.
  if (PUBLIC_ROUTES.includes(pathname)) {
    return (
      <AccessContext.Provider
        value={{ mode: "clerk", signedIn: false, isManager: false, name: "", role: "staff", signOut: () => {} }}
      >
        {children}
      </AccessContext.Provider>
    );
  }

  return (
    <>
      <SignedOut>
        <ClerkSignInScreen />
      </SignedOut>
      <SignedIn>
        <ClerkAccessInner>{children}</ClerkAccessInner>
      </SignedIn>
    </>
  );
}

function ClerkAccessInner({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const value = useMemo<Access>(
    () => ({
      mode: "clerk",
      signedIn: true,
      // Anyone who can sign in (restrict via Clerk allowlist) is a manager;
      // bartenders use the public /staff link.
      isManager: true,
      name: user?.firstName || user?.username || user?.primaryEmailAddress?.emailAddress || "Manager",
      role: "manager",
      signOut: () => signOut(),
    }),
    [user, signOut],
  );
  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

function ClerkSignInScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ink-950 px-4">
      <div className="flex flex-col items-center text-center">
        <Logo className="h-14 w-14 text-amber-accent" />
        <h1 className="mt-3 font-display text-xl font-extrabold tracking-tight text-chalk">
          GameBoard<span className="text-amber-accent"> Pro</span>
        </h1>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.25em] text-chalk-faint">
          Manager sign in
        </p>
      </div>
      <SignIn routing="hash" />
    </div>
  );
}

// ---------------- Local ----------------

function LocalAccess({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { ready, user, isManager, logout } = useSession();

  const value = useMemo<Access>(
    () => ({
      mode: "local",
      signedIn: !!user,
      isManager,
      name: user?.name ?? "",
      role: user?.role ?? "staff",
      signOut: logout,
    }),
    [user, isManager, logout],
  );

  if (PUBLIC_ROUTES.includes(pathname)) {
    return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
  }
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950">
        <span className="font-mono text-sm text-chalk-faint">Loading…</span>
      </div>
    );
  }
  if (!user) return <LoginScreen />;
  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}
