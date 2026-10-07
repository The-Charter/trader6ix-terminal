export interface TokenPrice {
  usd: number;
  change24h: number | null;
}

export type PriceMap = Record<string, TokenPrice>;

/** Symbols the app displays, mapped to their CoinGecko coin id. */
export const COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  DOGE: "dogecoin",
  LTC: "litecoin",
  USDC: "usd-coin",
  EURC: "euro-coin",
  USDT: "tether",
};

export interface PricesResponse {
  prices: PriceMap;
  error?: string;
}
