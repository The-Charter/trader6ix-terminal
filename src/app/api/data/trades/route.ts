import { NextResponse } from "next/server";
import { formatUnits } from "ethers";
import { withApi } from "@/server/http/with-api";
import { requireOwnedWallet } from "@/server/auth/ownership";
import { badRequest } from "@/server/http/errors";
import { getTokenTransfers, type TokenTransfer } from "@/server/arc-rpc/client";
import { fetchSpotPrices } from "@/server/prices/spot";
import { isTrustedArcToken } from "@/lib/arc-tokens";
import type { IndexedTrade } from "@/adapters/data-adapter";

export const dynamic = "force-dynamic";

const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

/**
 * Executed swaps for one of the caller's own wallets.
 *
 * A swap is identified structurally — one transaction where the wallet sends
 * one trusted token and receives a different one — rather than by a venue's
 * method selector, so it keeps working across routers (Tower's executor,
 * Uniswap, Kyber, Aerodrome…). Multi-hop legs that net out are ignored by
 * pairing the sold leg with a bought leg of a different token.
 */
export const GET = withApi(
  async (req, ctx) => {
    const address = req.nextUrl.searchParams.get("address") ?? "";
    if (!ADDRESS_PATTERN.test(address)) {
      throw badRequest("address query param must be a valid 0x address.");
    }
    requireOwnedWallet(ctx.user, address);

    const transfers = (await getTokenTransfers(address)).filter((transfer) =>
      isTrustedArcToken(transfer.tokenAddress)
    );
    const wallet = address.toLowerCase();

    const grouped = new Map<string, TokenTransfer[]>();
    for (const transfer of transfers) {
      const group = grouped.get(transfer.txHash) ?? [];
      group.push(transfer);
      grouped.set(transfer.txHash, group);
    }

    const prices = await fetchSpotPrices().catch(() => ({}) as Record<string, number>);

    const trades: IndexedTrade[] = [];
    for (const group of grouped.values()) {
      const outgoing = group.filter((transfer) => transfer.from.toLowerCase() === wallet);
      const incoming = group.filter((transfer) => transfer.to.toLowerCase() === wallet);
      if (outgoing.length === 0 || incoming.length === 0) continue;

      const sold = outgoing.find((out) => incoming.some((inc) => inc.tokenSymbol !== out.tokenSymbol));
      if (!sold) continue;
      const bought = incoming.find((inc) => inc.tokenSymbol !== sold.tokenSymbol);
      if (!bought) continue;

      const soldAmount = Number(formatUnits(sold.rawValue, sold.decimals));
      const boughtAmount = Number(formatUnits(bought.rawValue, bought.decimals));
      if (soldAmount <= 0 || boughtAmount <= 0) continue;

      const soldUsdPrice = prices[sold.tokenSymbol];
      const boughtUsdPrice = prices[bought.tokenSymbol];
      const pnl =
        soldUsdPrice !== undefined && boughtUsdPrice !== undefined
          ? boughtAmount * boughtUsdPrice - soldAmount * soldUsdPrice
          : undefined;

      trades.push({
        venue: "tower",
        symbol: `${sold.tokenSymbol}/${bought.tokenSymbol}`,
        side: "sell",
        quantity: String(soldAmount),
        price: (boughtAmount / soldAmount).toFixed(8),
        timestamp: Math.floor(new Date(sold.timestamp).getTime() / 1000),
        pnl: pnl !== undefined ? pnl.toFixed(2) : undefined,
      });
    }

    trades.sort((a, b) => b.timestamp - a.timestamp);
    return NextResponse.json(trades);
  },
  { auth: true, rateLimit: { limit: 60 } }
);
