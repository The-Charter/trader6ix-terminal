export interface TokenPrice {
  usd: number;
  change24h: number | null;
}

export type PriceMap = Record<string, TokenPrice>;

export interface PricesResponse {
  prices: PriceMap;
  error?: string;
}

/**
 * Tokens priced from the Spot venue (Tower). This is the set the app actually
 * trades and values today. Perp-token prices are added when perps ships.
 */
export const SPOT_PRICE_SYMBOLS = ["USDC", "EURC", "USDT", "cirBTC", "cNGN", "QCAD"] as const;

export type SpotPriceSymbol = (typeof SPOT_PRICE_SYMBOLS)[number];
