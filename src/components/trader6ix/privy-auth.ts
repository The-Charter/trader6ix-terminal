"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLogin, usePrivy, useWallets, type User } from "@privy-io/react-auth";
import { useSession, type Session } from "@/components/trader6ix/session";
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

/**
 * Sign-in is the Privy wallet modal itself — there is no sign-in page. Returns
 * a handler that opens the modal, or, when the visitor is already signed in,
 * goes straight to `redirectTo`.
 *
 * With `redirectTo`, a freshly completed sign-in lands there (marketing "Get
 * Started" buttons send people into the app). Without it the user stays on the
 * current screen, which then re-renders with their session.
 *
 * login(), not connectWallet(): connectWallet only LINKS another wallet to an
 * already-authenticated user. Signing in needs login(), which authenticates
 * (and creates the account on first use).
 */
export function useConnectWallet(redirectTo?: string): () => void {
  const router = useRouter();
  const session = useSession();
  const login = PRIVY_ENABLED
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useLogin({
        onComplete: (_user, _isNewUser, wasAlreadyAuthenticated) => {
          // Privy also reports already-signed-in visitors on mount; only a
          // sign-in that just happened should navigate.
          if (redirectTo && !wasAlreadyAuthenticated) router.push(redirectTo);
        },
      }).login
    : null;

  return useCallback(() => {
    if (session) {
      if (redirectTo) router.push(redirectTo);
      return;
    }
    login?.();
  }, [session, redirectTo, router, login]);
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
