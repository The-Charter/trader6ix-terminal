import type { FXAdapter, FxPair, FxQuote, FxTrade, RequestQuoteInput } from "./fx-adapter";

/**
 * Circle StableFX on Arc. This is a REAL scaffold against Circle's documented
 * endpoint (confirmed: POST https://api-sandbox.circle.com/v1/exchange/stablefx/quotes)
 * — not guesswork like some of our earlier Hibachi integration had to be.
 *
 * It is marked isLive: false because StableFX is a permissioned product:
 * Circle requires institutional KYB/AML verification before issuing an API key
 * (even the TEST tier). Flip STABLEFX_ENABLED once you have real credentials —
 * no other code needs to change.
 *
 * Flow this implements, per Circle's technical guide:
 *   1. requestQuote()  -> POST /v1/exchange/stablefx/quotes
 *   2. acceptQuote()   -> creates a trade + the taker signs a Permit2 EIP-712
 *      message with their own wallet (not our server key) to fund the escrow.
 *      That signing step needs to happen client-side via the connected wallet
 *      (Privy) — the server route below only creates the trade record; the
 *      actual signTypedData call is TODO and belongs in the trade-ticket UI
 *      once we're actually testing against a real key.
 *   3. getTradeStatus() -> poll until settled/failed.
 */

const ENABLED = process.env.NEXT_PUBLIC_STABLEFX_ENABLED === "true";

// StableFX currently only lists USDC/EURC per Circle's docs — do not hardcode
// beyond this without checking their live supported-pairs response, since more
// fiat-backed stablecoins (GBP, etc.) are explicitly on their roadmap.
const KNOWN_PAIRS: FxPair[] = [{ base: "EURC", quote: "USDC", isLive: ENABLED }];

export const stableFxAdapter: FXAdapter = {
  id: "stablefx",
  displayName: "Circle StableFX",
  isLive: ENABLED,

  async getSupportedPairs(): Promise<FxPair[]> {
    return KNOWN_PAIRS;
  },

  async requestQuote(input: RequestQuoteInput): Promise<FxQuote> {
    const res = await fetch("/api/stablefx/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to get StableFX quote");
    return json;
  },

  async acceptQuote(quoteId: string, walletAddress: string): Promise<FxTrade> {
    const res = await fetch("/api/stablefx/trade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quoteId, walletAddress }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to accept StableFX quote");
    return json;
  },

  async getTradeStatus(tradeId: string): Promise<FxTrade> {
    const res = await fetch(`/api/stablefx/trade/${encodeURIComponent(tradeId)}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to get trade status");
    return json;
  },
};
