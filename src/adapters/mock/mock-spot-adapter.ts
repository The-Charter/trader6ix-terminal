import type { SpotAdapter, SpotPool, SwapQuote, SwapQuoteInput, SwapResult } from "../spot-adapter";

/**
 * Simulated spot swap venue for demo mode. Rate is a fixed, realistic
 * USDC/EURC approximation with a tiny simulated spread — no blockchain call,
 * no real transaction. swap() returns ok:true with a clearly-fake tx hash
 * (prefixed "demo-") so it can never be mistaken for a real one.
 */

const DEMO_RATE_EUR_PER_USD = 0.845; // illustrative, not live market data

export const mockSpotAdapter: SpotAdapter = {
  id: "mock-spot",
  displayName: "Demo Spot",
  isLive: true,

  async getPools(): Promise<SpotPool[]> {
    return [{ base: "EURC", quote: "USDC", poolAddress: "demo", isLive: true }];
  },

  async getSwapQuote(input: SwapQuoteInput): Promise<SwapQuote> {
    const amountIn = parseFloat(input.amount) || 0;
    const rate = input.side === "sell" ? DEMO_RATE_EUR_PER_USD : 1 / DEMO_RATE_EUR_PER_USD;
    const spread = 0.0006; // simulated 0.06% spread, illustrative
    const amountOut = amountIn * rate * (1 - spread);
    return {
      amountIn: input.amount,
      amountOut: amountOut.toFixed(6),
      priceImpactPct: 0.02,
      poolAddress: "demo",
    };
  },

  async swap(): Promise<SwapResult> {
    const fakeHash = "demo-" + Math.random().toString(16).slice(2, 10) + Date.now().toString(16);
    return { ok: true, txHash: fakeHash };
  },
};
