import "server-only";
import { forbidden, unauthorized, unavailable } from "@/server/http/errors";
import { fetchLinkedWallets } from "@/server/auth/privy";
import { rememberWallets } from "@/server/users/service";
import type { AuthenticatedUser } from "./types";

function includes(haystack: string[], needle: string): boolean {
  const wanted = needle.toLowerCase();
  return haystack.some((value) => value.toLowerCase() === wanted);
}

/**
 * Authorizes a request that asks for a *specific wallet's* data.
 *
 * On-chain data is public, but an endpoint that proxies chain reads is also an
 * open RPC proxy, so the caller has to prove the wallet is theirs.
 *
 * The check is deliberately forgiving about WHERE the wallet list comes from:
 * the access token does not always carry `linked_accounts`, so when a wallet is
 * not already known this asks Privy directly — bypassing the cache, so a wallet
 * linked a minute ago is accepted — records the answer, and only then rejects.
 * If Privy cannot be reached the answer is 503, never a false "not your wallet".
 */
export async function requireOwnedWallet(user: AuthenticatedUser | null, address: string): Promise<void> {
  if (!user) throw unauthorized("Authentication required.");

  const known = [user.wallet, ...user.wallets].filter(
    (value): value is string => typeof value === "string" && value !== ""
  );
  if (includes(known, address)) return;

  let fromPrivy: string[];
  try {
    fromPrivy = await fetchLinkedWallets(user.did, { fresh: true });
  } catch (err) {
    console.error(`[authz] wallet lookup for ${user.did} failed:`, err instanceof Error ? err.message : err);
    throw unavailable("Wallet verification is temporarily unavailable. Try again in a moment.");
  }

  if (fromPrivy.length > 0) {
    await rememberWallets(user.id, fromPrivy).catch(() => {
      /* persisting is an optimization; the check below still applies */
    });
    if (includes(fromPrivy, address)) return;
  }

  console.warn(
    `[authz] ${user.did} requested ${address}; known wallets: ${known.join(", ") || "none"}` +
      `; from privy: ${fromPrivy.join(", ") || "none"}`
  );
  throw forbidden("That wallet is not linked to the account making this request.");
}
