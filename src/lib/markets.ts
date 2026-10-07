export type AssetSymbol = "BTC" | "ETH" | "SOL" | "DOGE" | "LTC" | "USDC" | "EURC";

export interface MarketDef {
  base: Exclude<AssetSymbol, "USDC" | "EURC">;
  quote: "USDC" | "EURC";
  /** Best-guess Hibachi symbol for spot. Reconciled against /market/exchange-info at runtime. */
  spotSymbol: string;
  /** Best-guess Hibachi symbol for the perp contract. */
  perpSymbol: string;
}

const BASES: MarketDef["base"][] = ["BTC", "ETH", "SOL", "DOGE", "LTC"];
const QUOTES: MarketDef["quote"][] = ["USDC", "EURC"];

export const TARGET_MARKETS: MarketDef[] = BASES.flatMap((base) =>
  QUOTES.map((quote) => ({
    base,
    quote,
    spotSymbol: `${base}/${quote}`,
    perpSymbol: `${base}/${quote}-P`,
  }))
);

export function marketLabel(m: MarketDef) {
  return `${m.base}/${m.quote}`;
}

/**
 * Cross-references our target market list against Hibachi's live contracts so the UI
 * never shows a market as tradable unless Hibachi actually reports it LIVE.
 *
 * Note: Hibachi's currently-live perps are USDT-settled (e.g. "BTC/USDT-P"), not
 * USDC/EURC. Until Hibachi lists USDC/EURC-settled contracts, our USDC/EURC target
 * markets will show as unavailable here — that's expected, not a bug: we only ever
 * mark a market live if Hibachi itself reports it LIVE.
 */
export function reconcileMarkets<T extends { symbol: string; status: string }>(
  live: T[],
  kind: "spot" | "perps"
) {
  const liveSymbols = new Set(live.filter((c) => c.status === "LIVE").map((c) => c.symbol));
  return TARGET_MARKETS.map((m) => {
    const symbol = kind === "spot" ? m.spotSymbol : m.perpSymbol;
    return { ...m, symbol, isLive: liveSymbols.has(symbol) };
  });
}
