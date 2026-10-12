"use client";

import { useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { privySessionFromUser } from "@/components/trader6ix/privy-auth";
import { clearSession, readSession, writeSession } from "@/components/trader6ix/session";

/**
 * Mirrors Privy auth state into the app's session store so every existing
 * reader (`useSession`, `displayIdentity`) keeps working unchanged.
 * Mounted only inside `PrivyProvider` (see `Providers`).
 */
export function PrivySessionSync() {
  const { ready, authenticated, user } = usePrivy();

  useEffect(() => {
    if (!ready) return;
    if (authenticated && user) {
      const next = privySessionFromUser(user);
      const current = readSession();
      if (
        !current ||
        current.via !== "privy" ||
        current.wallet !== next.wallet ||
        current.email !== next.email
      ) {
        writeSession(next);
      }
    } else {
      // Only clear sessions Privy created — never wipe a mock demo session.
      if (readSession()?.via === "privy") clearSession();
    }
  }, [ready, authenticated, user]);

  return null;
}
