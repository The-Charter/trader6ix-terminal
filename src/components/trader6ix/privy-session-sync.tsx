"use client";

import { useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { privySessionFromUser } from "@/components/trader6ix/privy-auth";
import { clearSession, readSession, writeSession } from "@/components/trader6ix/session";
import { apiJson, registerAccessTokenGetter } from "@/components/trader6ix/api-client";

interface SessionProfile {
  id: string;
  wallet: string | null;
  role: "user" | "admin";
}

/**
 * Mirrors Privy auth state into the app's session store so every existing
 * reader (`useSession`, `displayIdentity`) keeps working unchanged, hands the
 * API client a way to mint fresh access tokens, and confirms the token is
 * actually accepted by the backend.
 *
 * Mounted only inside `PrivyProvider` (see `Providers`).
 */
export function PrivySessionSync() {
  const { ready, authenticated, user, getAccessToken } = usePrivy();

  // Access tokens expire, so the API client asks for a fresh one per request.
  // The getter is deliberately NOT unregistered on re-render: clearing it in the
  // effect's cleanup left a window in which requests went out with no token at
  // all (every one a 401). It is cleared only when authentication ends.
  useEffect(() => {
    if (!authenticated) {
      registerAccessTokenGetter(null);
      return;
    }
    registerAccessTokenGetter(() => getAccessToken());
  }, [authenticated, getAccessToken]);

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

  // Prove the token is accepted by the API and record the local identity.
  // A failure here is surfaced in the console rather than blocking the UI.
  useEffect(() => {
    if (!ready || !authenticated || !user) return;
    let cancelled = false;

    (async () => {
      try {
        const profile = await apiJson<SessionProfile>("/api/v1/auth/session");
        if (cancelled) return;
        const current = readSession();
        if (!current || current.via !== "privy") return;
        if (current.userId !== profile.id || current.role !== profile.role) {
          writeSession({ ...current, userId: profile.id, role: profile.role });
        }
      } catch (err) {
        console.warn(
          "Backend session check failed:",
          err instanceof Error ? err.message : err,
          "— if this is a 401, set PRIVY_VERIFICATION_KEY in .env.local."
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, authenticated, user]);

  return null;
}
