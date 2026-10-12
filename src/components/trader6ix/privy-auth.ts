"use client";

import { usePrivy, type User } from "@privy-io/react-auth";
import type { Session } from "@/components/trader6ix/session";

/**
 * Build-time constant: whether Privy auth is configured. Used to gate
 * `usePrivy()` calls — safe for hook order because it never changes at runtime.
 */
export const PRIVY_ENABLED = !!process.env.NEXT_PUBLIC_PRIVY_APP_ID;

/**
 * `usePrivy()` outside a `PrivyProvider` throws, and the provider is only
 * mounted when an app ID is configured — so callers must go through this
 * wrapper, which returns `null` when Privy is disabled.
 */
export function usePrivyOptional() {
  if (!PRIVY_ENABLED) return null;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return usePrivy();
}

/** Maps a Privy user onto the app's session shape (wallet preferred, else email). */
export function privySessionFromUser(user: User): Session {
  const wallet = user.wallet?.address;
  const email = user.email?.address;
  return {
    ...(email ? { email } : {}),
    ...(wallet ? { wallet } : {}),
    signedInAt: new Date().toISOString(),
    via: "privy",
  };
}
