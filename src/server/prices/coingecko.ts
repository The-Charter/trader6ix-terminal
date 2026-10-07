import "server-only";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

export interface CoinGeckoPriceEntry {
  usd: number;
  usd_24h_change?: number;
}

/**
 * Fetches USD spot prices (and 24h change) for the given CoinGecko coin ids.
 * The public API works without a key at a lower rate limit; when
 * COINGECKO_API_KEY is set it is sent as a demo-plan key.
 */
export async function fetchUsdPrices(ids: string[]): Promise<Record<string, CoinGeckoPriceEntry>> {
  if (ids.length === 0) return {};

  const url = `${COINGECKO_BASE}/simple/price?ids=${encodeURIComponent(ids.join(","))}&vs_currencies=usd&include_24hr_change=true`;
  const headers: Record<string, string> = { Accept: "application/json" };
  const key = process.env.COINGECKO_API_KEY;
  if (key) headers["x-cg-demo-api-key"] = key;

  let response: Response;
  try {
    response = await fetch(url, { headers, cache: "no-store" });
  } catch (err) {
    throw new Error(`Could not reach CoinGecko: ${err instanceof Error ? err.message : "network error"}`);
  }

  const rawText = await response.text();
  if (!response.ok) {
    throw new Error(`CoinGecko request failed: ${response.status} ${rawText.slice(0, 200)}`);
  }
  if (!rawText) {
    throw new Error(`CoinGecko returned an empty body with status ${response.status}.`);
  }

  try {
    return JSON.parse(rawText) as Record<string, CoinGeckoPriceEntry>;
  } catch {
    throw new Error(`CoinGecko returned non-JSON content: ${rawText.slice(0, 200)}`);
  }
}
