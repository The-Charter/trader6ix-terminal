export interface TokenPrice {
  usd: number;
  change24h: number | null;
}

export type PriceMap = Record<string, TokenPrice>;

export interface PricesResponse {
  prices: PriceMap;
  error?: string;
}
