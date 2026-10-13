import "server-only";
import { forbidden, unauthorized } from "@/server/http/errors";
import type { AuthenticatedUser } from "./types";

/**
 * Authorizes a request that asks for a *specific wallet's* data.
 *
 * On-chain data is public, but an endpoint that proxies chain reads is also an
 * open RPC proxy: requiring proof that the caller actually controls the wallet
 * keeps the API accountable and the rate limit meaningful.
 */
export function requireOwnedWallet(user: AuthenticatedUser | null, address: string): void {
  if (!user) throw unauthorized("Authentication required.");

  const owned = new Set(
    [user.wallet, ...user.wallets]
      .filter((value): value is string => typeof value === "string" && value !== "")
      .map((value) => value.toLowerCase())
  );

  if (!owned.has(address.toLowerCase())) {
    throw forbidden("That wallet is not linked to the account making this request.");
  }
}
