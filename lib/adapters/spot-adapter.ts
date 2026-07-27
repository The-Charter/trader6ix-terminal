export interface SpotPool {
  base: string;
  quote: string;
  poolAddress: string;
  isLive: boolean;
}

export interface SwapQuoteInput {
  base: string;
  quote: string;
  side: "buy" | "sell";
  amount: string;
}

export interface SwapQuote {
  amountIn: string;
  amountOut: string;
  priceImpactPct: number;
  poolAddress: string;
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
}
