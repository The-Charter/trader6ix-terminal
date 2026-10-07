export interface FxPair {
  base: string; // e.g. "EURC"
  quote: string; // e.g. "USDC"
  isLive: boolean;
}

export type FxTradeStatus =
  | "quoted"
  | "pending_maker_signature"
  | "pending_settlement"
  | "settled"
  | "expired"
  | "failed";

export interface FxQuote {
  quoteId: string;
  base: string;
  quote: string;
  side: "buy" | "sell";
  amount: string;
  rate: string;
  expiresAt: number; // unix ms
}

export interface FxTrade {
  tradeId: string;
  quoteId: string;
  status: FxTradeStatus;
  settlementTxHash?: string;
  error?: string;
}

export interface RequestQuoteInput {
  base: string;
  quote: string;
  side: "buy" | "sell";
  amount: string;
}

/**
 * Stablecoin FX venues don't work like an orderbook — they're RFQ (request-for-
 * quote): you ask for a price, a maker responds, you accept, both sides sign,
 * it settles onchain. StableFX (Circle, native to Arc) is the first
 * implementation; the interface stays the same for any future FX rail.
 *
 * Do not hardcode pairs anywhere that consumes this interface — always call
 * getSupportedPairs() so new pairs (GBP-backed stables, etc.) show up
 * automatically once a venue lists them.
 */
export interface FXAdapter {
  id: string;
  displayName: string;
  isLive: boolean; // false = shown but marked "coming soon" (e.g. pending KYB/AML)

  getSupportedPairs(): Promise<FxPair[]>;
  requestQuote(input: RequestQuoteInput): Promise<FxQuote>;
  acceptQuote(quoteId: string, walletAddress: string): Promise<FxTrade>;
  getTradeStatus(tradeId: string): Promise<FxTrade>;
}
