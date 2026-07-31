import type { FXAdapter, FxPair, FxQuote, FxTrade, RequestQuoteInput } from "../fx-adapter";

/**
 * Simulated StableFX-style RFQ flow: request a quote, "accept" it, watch it
 * settle a couple seconds later. No Circle API call, no real settlement —
 * exists so the FX experience can be demoed before KYB/AML access is real.
 */

const DEMO_RATE_EUR_PER_USD = 0.845;
let tradeCounter = 0;
const trades: Record<string, FxTrade> = {};

export const mockFxAdapter: FXAdapter = {
  id: "mock-fx",
  displayName: "Demo Stablecoin FX",
  isLive: true,

  async getSupportedPairs(): Promise<FxPair[]> {
    return [
      { base: "EURC", quote: "USDC", isLive: true },
      { base: "GBPC", quote: "USDC", isLive: true }, // illustrative future pair, demo-only
    ];
  },

  async requestQuote(input: RequestQuoteInput): Promise<FxQuote> {
    const rate = input.side === "sell" ? DEMO_RATE_EUR_PER_USD : 1 / DEMO_RATE_EUR_PER_USD;
    return {
      quoteId: "demo-quote-" + Date.now(),
      base: input.base,
      quote: input.quote,
      side: input.side,
      amount: input.amount,
      rate: rate.toFixed(6),
      expiresAt: Date.now() + 15000,
    };
  },

  async acceptQuote(quoteId: string): Promise<FxTrade> {
    tradeCounter += 1;
    const tradeId = `demo-trade-${tradeCounter}`;
    const trade: FxTrade = { tradeId, quoteId, status: "pending_settlement" };
    trades[tradeId] = trade;
    // Simulate settlement completing shortly after acceptance
    setTimeout(() => {
      trades[tradeId] = {
        ...trade,
        status: "settled",
        settlementTxHash: "demo-" + Math.random().toString(16).slice(2, 10),
      };
    }, 2000);
    return trade;
  },

  async getTradeStatus(tradeId: string): Promise<FxTrade> {
    return trades[tradeId] ?? { tradeId, quoteId: "", status: "failed", error: "Unknown demo trade id" };
  },
};
