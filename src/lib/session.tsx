"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Role = "owner" | "manager" | "staff";

export interface Account {
  id: string;
  username: string;
  password: string;
  name: string;
  role: Role;
}

const ACCOUNTS_KEY = "gb-accounts:v2";
const SESSION_KEY = "gb-session:v2";

/** Seeded logins for Hooligans (the single client). The owner manages these in
 *  Bar Setup. This is a simple built-in gate for the MVP — Clerk is the
 *  production path when keys are configured. */
function seedAccounts(): Account[] {
  return [
    { id: "owner", username: "owner", password: "hooligans", name: "Owner", role: "owner" },
    { id: "manager", username: "manager", password: "hooligans", name: "Manager", role: "manager" },
    { id: "bartender", username: "bartender", password: "hooligans", name: "Bartender", role: "staff" },
  ];
}

interface SessionValue {
  ready: boolean;
  user: Account | null;
  accounts: Account[];
  isManager: boolean;
  login: (username: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  addAccount: (a: Omit<Account, "id">) => void;
  updateAccount: (id: string, patch: Partial<Account>) => void;
  removeAccount: (id: string) => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>(seedAccounts);
  const [user, setUser] = useState<Account | null>(null);

  useEffect(() => {
    try {
      const a = localStorage.getItem(ACCOUNTS_KEY);
      const list: Account[] = a ? JSON.parse(a) : seedAccounts();
      setAccounts(list);
      const s = localStorage.getItem(SESSION_KEY);
      if (s) {
        const id = JSON.parse(s)?.id;
        const found = list.find((x) => x.id === id) ?? null;
        setUser(found);
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const persistAccounts = useCallback((list: Account[]) => {
    setAccounts(list);
    try {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));
    } catch {
      /* ignore */
    }
  }, []);

  const login = useCallback(
    (username: string, password: string) => {
      const u = username.trim().toLowerCase();
      const found = accounts.find(
        (a) => a.username.toLowerCase() === u && a.password === password,
      );
      if (!found) return { ok: false, error: "Wrong username or password." };
      setUser(found);
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify({ id: found.id }));
      } catch {
        /* ignore */
      }
      return { ok: true };
    },
    [accounts],
  );

  const logout = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const addAccount = useCallback(
    (a: Omit<Account, "id">) =>
      persistAccounts([...accounts, { ...a, id: `u-${Math.random().toString(36).slice(2, 8)}` }]),
    [accounts, persistAccounts],
  );
  const updateAccount = useCallback(
    (id: string, patch: Partial<Account>) =>
      persistAccounts(accounts.map((a) => (a.id === id ? { ...a, ...patch } : a))),
    [accounts, persistAccounts],
  );
  const removeAccount = useCallback(
    (id: string) => persistAccounts(accounts.filter((a) => a.id !== id)),
    [accounts, persistAccounts],
  );

  const value = useMemo<SessionValue>(
    () => ({
      ready,
      user,
      accounts,
      isManager: user?.role === "owner" || user?.role === "manager",
      login,
      logout,
      addAccount,
      updateAccount,
      removeAccount,
    }),
    [ready, user, accounts, login, logout, addAccount, updateAccount, removeAccount],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
