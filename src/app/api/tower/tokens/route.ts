import { NextResponse } from "next/server";
import { getTowerDexes, getTowerTokens } from "@/server/tower/client";
import { ARC_CHAIN_ID, IS_ARC_MAINNET } from "@/lib/arc-network";
import { ARC_TOKENS } from "@/lib/arc-tokens";
import { corsPreflight, corsRoute } from "@/server/http/cors";

export const dynamic = "force-dynamic";

/**
 * Tokens the swap ticket can trade on the active network.
 *
 * The registry in `@/lib/arc-tokens` is the source of truth — its addresses and
 * decimals were read directly off Arc (mainnet: USDC 6, EURC 6, cirBTC 8).
 *
 * Tower's own `/tokens` endpoint ignores `chainId` and always answers with its
 * TESTNET registry, so it can never be used to build a mainnet request. On
 * mainnet the cross-check therefore reads `/swap/dexes` (which does report the
 * real per-chain `supportedTokens`); on testnet it reads `/tokens`.
 *
 * Drift is logged, never silently trusted: a token Tower routes but the
 * registry does not know about would otherwise be invisible to users.
 */
async function towerSupportedAddresses(): Promise<string[]> {
  if (IS_ARC_MAINNET) {
    const dexes = await getTowerDexes();
    const supported = new Set<string>();
    for (const dex of dexes.data ?? []) {
      if (Number(dex.chainId) !== ARC_CHAIN_ID) continue;
      for (const address of dex.supportedTokens ?? []) supported.add(address.toLowerCase());
    }
    return [...supported];
  }

  const tokens = await getTowerTokens();
  return (tokens.data ?? [])
    .filter((token) => Number(token.chainId) === ARC_CHAIN_ID)
    .map((token) => token.address.toLowerCase());
}

export const GET = corsRoute(async () => {
  const registered = new Set(ARC_TOKENS.map((token) => token.address.toLowerCase()));

  await towerSupportedAddresses()
    .then((supported) => {
      const missing = supported.filter((address) => !registered.has(address));
      if (missing.length > 0) {
        console.warn(
          `Tower routes ${missing.length} token(s) missing from the Arc ${
            IS_ARC_MAINNET ? "mainnet" : "testnet"
          } registry — add them to src/lib/arc-tokens.ts:`,
          missing
        );
      }
    })
    .catch((err) => {
      // The registry alone is enough to serve the ticket.
      console.warn(
        "Tower token cross-check failed (registry is still authoritative):",
        err instanceof Error ? err.message : err
      );
    });

  return NextResponse.json({
    success: true,
    chainId: ARC_CHAIN_ID,
    source: "registry",
    data: ARC_TOKENS.map((token) => ({ ...token, isNativeGas: false })),
  });
});

/** Answers the CORS preflight; Next's own OPTIONS answer carries no CORS headers. */
export const OPTIONS = corsPreflight;
