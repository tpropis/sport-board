"use client";

import { useState } from "react";
import { useSession } from "@/lib/session";
import { useStore } from "@/lib/store";
import { Logo } from "./Logo";
import { Quip } from "./Quip";

export function LoginScreen() {
  const { login } = useSession();
  const { activeBar } = useStore();
  const brand = activeBar?.branding?.brandName;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = login(username, password);
    if (!res.ok) setError(res.error ?? "Sign-in failed.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          {activeBar?.branding?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeBar.branding.logoUrl}
              alt=""
              className="h-16 w-16 rounded-lg border border-ink-600 object-contain"
            />
          ) : (
            <Logo className="h-16 w-16 text-amber-accent" />
          )}
          <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-chalk">
            {brand || (
              <>
                GameBoard<span className="text-amber-accent"> Pro</span>
              </>
            )}
          </h1>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.25em] text-chalk-faint">
            {activeBar?.name ?? "TV Command Board"}
          </p>
          <Quip className="mt-4 block min-h-[2.5rem] max-w-xs text-sm italic text-amber-glow/90" />
        </div>

        <form onSubmit={submit} className="panel flex flex-col gap-3 p-5">
          <label className="block">
            <span className="field-label">Username</span>
            <input
              className="input mt-1"
              value={username}
              autoFocus
              autoCapitalize="none"
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
            />
          </label>
          <label className="block">
            <span className="field-label">Password</span>
            <input
              type="password"
              className="input mt-1"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
            />
          </label>
          {error && (
            <p className="rounded-md border border-alert/40 bg-alert/10 px-3 py-2 text-sm text-alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-primary mt-1 py-2.5">
            Sign in
          </button>
        </form>

        <div className="mt-4 rounded-md border border-ink-700 bg-ink-900/50 px-4 py-3 text-xs text-chalk-faint">
          <div className="mb-1 font-semibold text-chalk-dim">Demo logins</div>
          <div className="tnum font-mono">
            owner / hooligans · manager / hooligans · bartender / hooligans
          </div>
          <p className="mt-1.5">
            Owner &amp; manager get full access; bartenders see the board read-only.
            Set real names &amp; passwords in Bar Setup → Staff logins.
          </p>
        </div>
      </div>
    </div>
  );
}
