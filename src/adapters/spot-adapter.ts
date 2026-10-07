export interface SpotPool {
  base: string;
  quote: string;
  poolAddress: string;
  isLive: boolean;
}

export interface SpotToken {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  isNativeGas?: boolean;
}

export interface SwapQuoteInput {
  base: string;
  quote: string;
  side: "buy" | "sell";
  amount: string;
  /** Optional slippage tolerance in basis points (50 = 0.5%). Venues may default this. */
  slippageBps?: number;
}

export interface SwapQuote {
  amountIn: string;
  amountOut: string;
  priceImpactPct: number;
  poolAddress: string;
  /** ISO timestamp when the quote expires, when the venue provides one. */
  expiresAt?: string;
}

export interface SwapResult {
  ok: boolean;
  txHash?: string;
  error?: string;
}

/**
 * Spot venues are AMM/DEX pools rather than an orderbook or an RFQ desk.
 * Curve is the first integration; additional DEX adapters (Uniswap, etc.)
 * plug in the same way — implement this interface, add to the registry.
 */
export interface SpotAdapter {
  id: string;
  displayName: string;
  chainId?: number;
  isLive: boolean;

  getPools(): Promise<SpotPool[]>;
  getSwapQuote(input: SwapQuoteInput): Promise<SwapQuote>;
  swap(input: SwapQuoteInput, walletAddress: string): Promise<SwapResult>;

  /** Optional: token metadata supported by this venue, when available. */
  getTokens?(): Promise<SpotToken[]>;
  /** Optional: USD price per token symbol, when available. */
  getPrices?(): Promise<Record<string, number>>;
}
