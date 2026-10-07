import "server-only";
import { getTowerPrices } from "@/server/tower/client";

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { at: number; data: Record<string, number> }>();

/**
 * USD prices for the Spot (Tower) tokens, cached for 60s. Tower's /prices
 * response is a flat, mixed map: token symbols map to a number, while provider
 * coin ids map to a { usd } object. Everything is returned, so any token Tower
 * can price is available to the app by symbol.
 */
export async function fetchSpotPrices(): Promise<Record<string, number>> {
  const cached = cache.get("spot");
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.data;

  const source = (await getTowerPrices()) as Record<string, unknown>;

  // Tower maps token symbols to a USD number and provider coin ids to a
  // { usd } object; keep only the symbol -> number entries.
  const prices: Record<string, number> = {};
  for (const [symbol, value] of Object.entries(source)) {
    if (typeof value === "number") prices[symbol] = value;
  }

  cache.set("spot", { at: Date.now(), data: prices });
  return prices;
}
