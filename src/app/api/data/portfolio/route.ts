import { NextRequest, NextResponse } from "next/server";
import { formatUnits } from "ethers";
import { getTokenBalances } from "@/server/arc-explorer/client";
import { fetchSpotPrices } from "@/server/prices/spot";
import { isTrustedArcToken } from "@/lib/arc-tokens";
import type { PortfolioSnapshot } from "@/adapters/data-adapter";

export const dynamic = "force-dynamic";

const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  if (!address || !ADDRESS_PATTERN.test(address)) {
    return NextResponse.json({ error: "address query param must be a valid 0x address" }, { status: 400 });
  }

  try {
    const balances = (await getTokenBalances(address)).filter((balance) => isTrustedArcToken(balance.address));
    const prices = await fetchSpotPrices().catch(() => ({}) as Record<string, number>);

    let totalUsdValue = 0;
    const mappedBalances = balances.map((balance) => {
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
    };
    return NextResponse.json(snapshot);
  } catch (err) {
    console.error("Portfolio request failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 502 });
  }
}
