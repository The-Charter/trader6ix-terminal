import "server-only";
import type { NextRequest } from "next/server";
import { jsonOk } from "@/server/http/responses";
import { badRequest } from "@/server/http/errors";
import { parseJson } from "@/server/http/validation";
import type { RequestContext } from "@/server/http/context";
import { ARC_CHAIN_ID, ARC_CHAIN_NAME, IS_ARC_MAINNET } from "@/lib/arc-network";
import { ARC_TOKENS, type ArcToken } from "@/lib/arc-tokens";
import { requireOwnedWallet } from "@/server/auth/ownership";
import { buildTowerSwapTx, getTowerQuote } from "@/server/tower/client";
import { toSwapApiError } from "@/server/tower/errors";
import type { TowerQuoteResponseData } from "@/lib/tower/types";
import { buildRequestSchema, quoteRequestSchema } from "./schemas";

/**
 * Swap endpoints. These are the only routes that reach Tower's `swaps` scope,
 * and they are deliberately strict:
 *
 *  - authentication is required (a swap is user state, not market data)
 *  - the chain is pinned server-side, so a caller cannot route us elsewhere
 *  - only registry tokens are accepted, by canonical address
 *  - `build` is idempotent, so a client retry replays the first transaction
 *    instead of building — and the user signing — a second one
 *  - a transaction is only ever built for a wallet the caller controls
 */

/**
 * Venue pinning, per network (verified 2026-10 against /swap/dexes and
 * /swap/build-tx):
 *
 *  - Arc testnet: only Tower's own DEX can build a transaction; auto-routed
 *    quotes that pick synthra/unitflow/xylonet fail with QUOTE_STALE.
 *  - Arc mainnet: `tower-dex` has no route at all, while aero, kyberswap,
 *    uniswap AND auto-routing all build, so routing is left to the aggregator.
 */
const PINNED_DEX_ID = IS_ARC_MAINNET ? undefined : "tower-dex";

/** Resolves a symbol or address to a trusted registry entry. */
function requireTrustedToken(reference: string, field: string): ArcToken {
  const wanted = reference.trim().toLowerCase();
  const token = ARC_TOKENS.find(
    (item) => item.symbol.toLowerCase() === wanted || item.address.toLowerCase() === wanted
  );
  if (!token) {
    throw badRequest(
      `${field} must be one of the tokens available on ${ARC_CHAIN_NAME}: ` +
        `${ARC_TOKENS.map((item) => item.symbol).join(", ")}.`
    );
  }
  return token;
}

/** The venue is pinned server-side; a client cannot redirect a swap to another chain. */
function requireCurrentChain(chainId: number | undefined): void {
  if (chainId !== undefined && chainId !== ARC_CHAIN_ID) {
    throw badRequest(`This API is pinned to ${ARC_CHAIN_NAME} (chain ${ARC_CHAIN_ID}).`);
  }
}

export async function quoteHandler(req: NextRequest, _ctx: RequestContext) {
  const parsed = await parseJson(req, quoteRequestSchema);
  const input = requireTrustedToken(parsed.inputToken, "inputToken");
  const output = requireTrustedToken(parsed.outputToken, "outputToken");
  if (input.address.toLowerCase() === output.address.toLowerCase()) {
    throw badRequest("inputToken and outputToken must be different assets.");
  }
  requireCurrentChain(parsed.chainId);

  try {
    const response = await getTowerQuote({
      inputToken: input.address,
      outputToken: output.address,
      inputAmount: parsed.inputAmount,
      slippageTolerance: parsed.slippageTolerance,
      chainId: ARC_CHAIN_ID,
      ...(PINNED_DEX_ID ? { dexId: PINNED_DEX_ID } : {}),
    });
    return jsonOk(response.data);
  } catch (err) {
    throw toSwapApiError(err);
  }
}

export async function buildHandler(req: NextRequest, ctx: RequestContext) {
  const parsed = await parseJson(req, buildRequestSchema);

  // Only ever build a transaction for a wallet the caller actually controls.
  requireOwnedWallet(ctx.user, parsed.userAddress);

  // The client echoes the quote back, so re-validate it rather than trusting it.
  // (Tower's quote payload carries no chainId — the registry is per-network, so
  // requiring registry tokens on both sides pins the chain implicitly, and the
  // built transaction's own chainId is checked before anything is signed.)
  requireTrustedToken(parsed.quote.inputToken, "quote.inputToken");
  requireTrustedToken(parsed.quote.outputToken, "quote.outputToken");

  try {
    const response = await buildTowerSwapTx({
      quote: parsed.quote as unknown as TowerQuoteResponseData,
      userAddress: parsed.userAddress,
    });
    if (!response.data) {
      throw badRequest("Tower did not return a transaction for this quote. Request a fresh quote.");
    }
    return jsonOk(response.data);
  } catch (err) {
    throw toSwapApiError(err);
  }
}
