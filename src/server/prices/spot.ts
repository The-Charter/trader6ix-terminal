import "server-only";
import { getTowerPrices } from "@/server/tower/client";
import { SPOT_PRICE_SYMBOLS } from "@/lib/prices";

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { at: number; data: Record<string, number> }>();

/**
 * USD prices for the Spot (Tower) tokens, cached for 60s. Tower's /prices
 * response is a flat, mixed map: token symbols map to a number, while provider
 * coin ids map to a { usd } object — only the token symbols are used.
 */
export async function fetchSpotPrices(): Promise<Record<string, number>> {
  const cacheKey = "spot";
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.data;

  const raw = await getTowerPrices();
  const source = raw as Record<string, unknown>;

  const prices: Record<string, number> = {};
  for (const symbol of SPOT_PRICE_SYMBOLS) {
    const value = source[symbol];
    if (typeof value === "number") {
      prices[symbol] = value;
    } else if (value && typeof value === "object" && typeof (value as { usd?: unknown }).usd === "number") {
      prices[symbol] = (value as { usd: number }).usd;
    }
  }

  cache.set(cacheKey, { at: Date.now(), data: prices });
  return prices;
}
