"use client";

import { useSyncExternalStore } from "react";

/** Where a finished sign-in lands. */
export const AUTH_REDIRECT_PATH = "/perps" as const;

const STORAGE_KEY = "trader6ix-session";

export type Session = {
  email?: string;
  wallet?: string;
  signedInAt: string;
  /** Which backend established this session. Mock is the local demo fallback. */
  via?: "privy" | "mock";
};

export function shortAddress(address: string) {
  return address.length > 14 ? `${address.slice(0, 12)}…${address.slice(-4)}` : address;
}

/** What the top bar shows for the current session, kept short enough to fit. */
export function displayIdentity(session: Session | null) {
  if (session?.email)
    return session.email.length > 26 ? `${session.email.slice(0, 23)}…` : session.email;
  if (session?.wallet) return shortAddress(session.wallet);
  return "Not connected";
}

const listeners = new Set<() => void>();

function notify() {
  for (const listener of [...listeners]) listener();
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) notify();
  });
}

function subscribeSession(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readRaw(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function parseSession(raw: string | null): Session | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    return value && typeof value === "object" ? (value as Session) : null;
  } catch {
    return null;
  }
}

/* The snapshot must be referentially stable, so cache the parse per stored string. */
let cachedRaw: string | null = null;
let cachedSession: Session | null = null;

export function readSession(): Session | null {
  const raw = readRaw();
  if (raw === cachedRaw) return cachedSession;
  cachedRaw = raw;
  cachedSession = parseSession(raw);
  return cachedSession;
}

export function writeSession(session: Session) {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      /* storage unavailable — the sign-in still redirects */
    }
  }
  notify();
}

export function clearSession() {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nothing stored */
    }
  }
  notify();
}

export function useSession() {
  return useSyncExternalStore(subscribeSession, readSession, () => null);
}
