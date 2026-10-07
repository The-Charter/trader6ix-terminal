import { NextResponse } from "next/server";
import { fetchSpotPrices } from "@/server/prices/spot";
import type { PriceMap } from "@/lib/prices";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const prices = await fetchSpotPrices();
    const map: PriceMap = {};
    for (const [symbol, usd] of Object.entries(prices)) {
      map[symbol] = { usd, change24h: null };
    }
    return NextResponse.json({ prices: map });
  } catch (err) {
    console.error("Price feed request failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 502 });
  }
}
