"use client";

/**
 * Graceful Clerk integration.
 *
 * When NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is set, the app uses Clerk for manager
 * login: the staff/print views stay public and read-only, while editing &
 * configuration routes require a signed-in manager. When the key is absent
 * (e.g. the MVP / this sandbox) everything falls back to the local Manager/Staff
 * toggle so the app stays fully usable with zero setup.
 */
import { createContext, useContext } from "react";
import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useAuth,
} from "@clerk/nextjs";
import { useStore } from "./store";

export const CLERK_ENABLED = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const ManagerContext = createContext<boolean>(false);

function ClerkBridge({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth();
  return (
    <ManagerContext.Provider value={!!isSignedIn}>
      {children}
    </ManagerContext.Provider>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (!CLERK_ENABLED) return <>{children}</>;
  return (
    <ClerkProvider>
      <ClerkBridge>{children}</ClerkBridge>
    </ClerkProvider>
  );
}

/** True when the current user may edit. Clerk sign-in when configured, else the
 *  local manager toggle. */
export function useIsManager(): boolean {
  const signedIn = useContext(ManagerContext);
  const { managerMode } = useStore();
  return CLERK_ENABLED ? signedIn : managerMode;
}

/** Header auth control — only renders when Clerk is configured. */
export function AuthButton() {
  if (!CLERK_ENABLED) return null;
  return (
    <>
      <SignedOut>
        <SignInButton mode="modal">
          <button className="btn btn-primary px-3 py-1.5 text-xs">Manager sign in</button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </>
  );
}
