import type { SpotAdapter, SpotPool, SwapQuote, SwapQuoteInput, SwapResult } from "./spot-adapter";

/**
 * Curve Finance on Arc testnet. Curve StableSwap pools use a standard,
 * well-documented ABI (get_dy / exchange) that's identical across every chain
 * Curve is deployed on — so once we have the real pool address this is a fast,
 * low-risk integration, unlike Hibachi's undocumented behavior.
 *
 * isLive is false because we don't yet have a verified USDC/EURC pool
 * contract address on Arc testnet — see charter-terminal.md. Do not fabricate
 * one; a wrong address just means failed or lost transactions, not a bug we
 * can patch. Set NEXT_PUBLIC_CURVE_USDC_EURC_POOL once confirmed and flip
 * isLive here.
 */

const POOL_ADDRESS = process.env.NEXT_PUBLIC_CURVE_USDC_EURC_POOL ?? "";
const ENABLED = POOL_ADDRESS.length > 0;

export const curveAdapter: SpotAdapter = {
  id: "curve",
  displayName: "Curve Finance",
  isLive: ENABLED,

  async getPools(): Promise<SpotPool[]> {
    if (!ENABLED) {
      return [{ base: "EURC", quote: "USDC", poolAddress: "", isLive: false }];
    }
    return [{ base: "EURC", quote: "USDC", poolAddress: POOL_ADDRESS, isLive: true }];
  },

  async getSwapQuote(_input: SwapQuoteInput): Promise<SwapQuote> {
    throw new Error(
      "Curve adapter is not configured yet — set NEXT_PUBLIC_CURVE_USDC_EURC_POOL to the verified Arc testnet pool address."
    );
  },

  async swap(_input: SwapQuoteInput): Promise<SwapResult> {
    return {
      ok: false,
      error: "Curve adapter is not configured yet — pool address not set.",
    };
  },
};
