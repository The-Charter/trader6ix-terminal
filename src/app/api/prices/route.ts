import { NextResponse } from "next/server";
import { fetchUsdPrices } from "@/server/prices/coingecko";
import { COINGECKO_IDS, type PriceMap } from "@/lib/prices";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const byId = await fetchUsdPrices(Object.values(COINGECKO_IDS));
    const prices: PriceMap = {};
    for (const [symbol, id] of Object.entries(COINGECKO_IDS)) {
      const entry = byId[id];
      if (entry && typeof entry.usd === "number") {
        prices[symbol] = {
          usd: entry.usd,
          change24h: typeof entry.usd_24h_change === "number" ? entry.usd_24h_change : null,
        };
      }
    }
    return NextResponse.json({ prices });
  } catch (err) {
    console.error("Price feed request failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 502 });
  }
}
