"use client";

import { usePrivy, useWallets, type User } from "@privy-io/react-auth";
import type { Session } from "@/components/trader6ix/session";
import { PRIVY_ENABLED } from "@/lib/privy-app";

export { PRIVY_ENABLED };

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

/**
 * The user's connected wallets, or an empty list when Privy is disabled.
 *
 * Needed because Privy's `sendTransaction` only signs for its own EMBEDDED
 * wallets. Anyone who signed in with an injected wallet (MetaMask, OKX…) has to
 * be sent through that wallet's own provider instead.
 */
export function useWalletsOptional(): ReturnType<typeof useWallets>["wallets"] {
  if (!PRIVY_ENABLED) return [];
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useWallets().wallets;
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
