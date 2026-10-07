import { NextRequest, NextResponse } from "next/server";
import { formatUnits } from "ethers";
import { getTokenTransfers, type ExplorerTokenTransfer } from "@/server/arc-explorer/client";
import { fetchSpotPrices } from "@/server/prices/spot";
import { isTrustedArcToken } from "@/lib/arc-tokens";
import type { IndexedTrade } from "@/adapters/data-adapter";

export const dynamic = "force-dynamic";

const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

/** Known swap entrypoints, keyed by 4-byte method selector. */
const SWAP_METHODS = new Set(["0xcd6267d5"]); // TowerSwapExecutor.executeSwap

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  if (!address || !ADDRESS_PATTERN.test(address)) {
    return NextResponse.json({ error: "address query param must be a valid 0x address" }, { status: 400 });
  }

  try {
    const transfers = (await getTokenTransfers(address)).filter((transfer) => isTrustedArcToken(transfer.tokenAddress));
    const wallet = address.toLowerCase();

    // Group swap-transaction transfers by their transaction hash.
    const byTransaction = new Map<string, ExplorerTokenTransfer[]>();
    for (const transfer of transfers) {
      if (!transfer.method || !SWAP_METHODS.has(transfer.method)) continue;
      const group = byTransaction.get(transfer.txHash) ?? [];
      group.push(transfer);
      byTransaction.set(transfer.txHash, group);
    }

    const prices = await fetchSpotPrices().catch(() => ({}) as Record<string, number>);

    const trades: IndexedTrade[] = [];
    for (const group of byTransaction.values()) {
      const outgoing = group.filter((transfer) => transfer.from.toLowerCase() === wallet);
      const incoming = group.filter((transfer) => transfer.to.toLowerCase() === wallet);
      if (outgoing.length === 0 || incoming.length === 0) continue;

      // Pick an outgoing/incoming pair of DIFFERENT tokens; multi-hop routing
      // produces same-token legs that are not the user's swap.
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
  } catch (err) {
    console.error("Trades request failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 502 });
  }
}
