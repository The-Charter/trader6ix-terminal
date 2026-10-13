import { NextResponse } from "next/server";
import { formatUnits } from "ethers";
import { withApi } from "@/server/http/with-api";
import { requireOwnedWallet } from "@/server/auth/ownership";
import { badRequest } from "@/server/http/errors";
import { getTokenBalances } from "@/server/arc-rpc/client";
import { fetchSpotPrices } from "@/server/prices/spot";
import { isTrustedArcToken } from "@/lib/arc-tokens";
import type { PortfolioSnapshot } from "@/adapters/data-adapter";

export const dynamic = "force-dynamic";

const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

/**
 * Balances for one of the caller's own wallets, valued with Tower's prices.
 *
 * Balances are read straight from Arc over JSON-RPC (the mainnet explorer API
 * is Cloudflare-gated, see src/server/arc-rpc/client.ts) and filtered to the
 * trusted token registry so airdrop spam never shows up as a holding.
 */
export const GET = withApi(
  async (req, ctx) => {
    const address = req.nextUrl.searchParams.get("address") ?? "";
    if (!ADDRESS_PATTERN.test(address)) {
      throw badRequest("address query param must be a valid 0x address.");
    }
    requireOwnedWallet(ctx.user, address);

    const { balances, unavailable } = await getTokenBalances(address);
    const trusted = balances.filter((balance) => isTrustedArcToken(balance.address));
    const prices = await fetchSpotPrices().catch(() => ({}) as Record<string, number>);

    let totalUsdValue = 0;
    const mappedBalances = trusted.map((balance) => {
      const amount = formatUnits(balance.rawValue, balance.decimals);
      const price = prices[balance.symbol];
      const usdValue = price !== undefined ? Number(amount) * price : undefined;
      if (usdValue !== undefined) totalUsdValue += usdValue;
      return {
        symbol: balance.symbol,
        amount,
        usdValue: usdValue !== undefined ? usdValue.toFixed(2) : undefined,
      };
    });

    const snapshot: PortfolioSnapshot = {
      walletAddress: address,
      totalUsdValue: totalUsdValue.toFixed(2),
      balances: mappedBalances,
      unavailableAssets: unavailable,
    };
    return NextResponse.json(snapshot);
  },
  { auth: true, rateLimit: { limit: 60 } }
);
