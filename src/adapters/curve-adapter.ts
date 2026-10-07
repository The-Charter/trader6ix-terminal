import { ethers } from "ethers";
import type { SpotAdapter, SpotPool, SwapQuote, SwapQuoteInput, SwapResult } from "./spot-adapter";
import { CURVE_POOL_ABI, ERC20_MIN_ABI } from "./curve-abi";

/**
 * Curve Finance on Arc testnet. Pool address history:
 *   - 0xFF5Cb29241F002fFeD2eAa224e3e996D24A6E8d1 — provided by user, a real
 *     swap attempted against it failed (CALL_EXCEPTION/missing revert data),
 *     unconfirmed whether it's Curve or something else (possibly Tower
 *     Exchange's router, Arc's native aggregator).
 *   - 0x2D84D79C852f6842AbE0304b70bBaA1506AdD457 — current candidate, sourced
 *     from a third party NOT on the Trader6ix or Curve team. Treat as
 *     "worth testing," not "trusted" — verify independently before real value.
 *
 * Curve StableSwap pools use a standard, well-documented ABI (get_dy /
 * exchange) identical across every chain Curve is deployed on — so once we
 * have a genuinely confirmed pool address this is a fast, low-risk
 * integration, unlike Hibachi's undocumented behavior.
 */

const POOL_ADDRESS = process.env.NEXT_PUBLIC_CURVE_USDC_EURC_POOL ?? "";
const RPC_URL = process.env.NEXT_PUBLIC_ARC_RPC_URL ?? "https://rpc.testnet.arc.network";
const ENABLED = POOL_ADDRESS.length > 0;

// Confirmed official Arc testnet addresses (docs.arc.io/arc/references/contract-addresses)
const TOKEN_ADDRESSES: Record<string, string> = {
  USDC: "0x3600000000000000000000000000000000000000",
  EURC: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
};
const DECIMALS: Record<string, number> = { USDC: 6, EURC: 6 };

function getProvider() {
  return new ethers.JsonRpcProvider(RPC_URL);
}

/** Figures out which pool index (0 or 1) corresponds to which token symbol by reading coins() on-chain — no hardcoded assumption about pool ordering. */
async function resolveCoinIndices(pool: ethers.Contract): Promise<Record<string, number>> {
  const [coin0, coin1] = await Promise.all([pool.coins(0), pool.coins(1)]);
  const indices: Record<string, number> = {};
  for (const [symbol, address] of Object.entries(TOKEN_ADDRESSES)) {
    if (address.toLowerCase() === String(coin0).toLowerCase()) indices[symbol] = 0;
    if (address.toLowerCase() === String(coin1).toLowerCase()) indices[symbol] = 1;
  }
  return indices;
}

export const curveAdapter: SpotAdapter = {
  id: "curve",
  displayName: "Curve Finance",
  chainId: Number(process.env.NEXT_PUBLIC_ARC_CHAIN_ID ?? 5042002),
  isLive: ENABLED,

  async getPools(): Promise<SpotPool[]> {
    if (!ENABLED) {
      return [{ base: "EURC", quote: "USDC", poolAddress: "", isLive: false }];
    }
    return [{ base: "EURC", quote: "USDC", poolAddress: POOL_ADDRESS, isLive: true }];
  },

  async getSwapQuote(input: SwapQuoteInput): Promise<SwapQuote> {
    if (!ENABLED) throw new Error("Curve adapter is not configured — NEXT_PUBLIC_CURVE_USDC_EURC_POOL is not set.");

    const provider = getProvider();
    const pool = new ethers.Contract(POOL_ADDRESS, CURVE_POOL_ABI, provider);
    const indices = await resolveCoinIndices(pool);

    const fromSymbol = input.side === "sell" ? input.base : input.quote;
    const toSymbol = input.side === "sell" ? input.quote : input.base;
    if (indices[fromSymbol] === undefined || indices[toSymbol] === undefined) {
      throw new Error(
        `Pool at ${POOL_ADDRESS} doesn't contain both ${fromSymbol} and ${toSymbol} — check the pool address.`
      );
    }

    const decimalsIn = DECIMALS[fromSymbol] ?? 6;
    const decimalsOut = DECIMALS[toSymbol] ?? 6;
    const amountIn = ethers.parseUnits(input.amount, decimalsIn);

    const amountOutRaw = await pool.get_dy(indices[fromSymbol], indices[toSymbol], amountIn);
    const amountOut = ethers.formatUnits(amountOutRaw, decimalsOut);

    return {
      amountIn: input.amount,
      amountOut,
      priceImpactPct: 0, // TODO: compute from pool's virtual price / spot rate once we've confirmed real quote behavior
      poolAddress: POOL_ADDRESS,
    };
  },

  async swap(input: SwapQuoteInput, walletAddress: string): Promise<SwapResult> {
    if (!ENABLED) return { ok: false, error: "Curve adapter is not configured — pool address not set." };
    if (typeof window === "undefined" || !(window as any).ethereum) {
      return { ok: false, error: "No browser wallet provider found — connect a wallet first." };
    }

    try {
      const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await browserProvider.getSigner(walletAddress);
      const pool = new ethers.Contract(POOL_ADDRESS, CURVE_POOL_ABI, signer);

      const readProvider = getProvider();
      const readPool = new ethers.Contract(POOL_ADDRESS, CURVE_POOL_ABI, readProvider);
      const indices = await resolveCoinIndices(readPool);

      const fromSymbol = input.side === "sell" ? input.base : input.quote;
      const toSymbol = input.side === "sell" ? input.quote : input.base;
      const decimalsIn = DECIMALS[fromSymbol] ?? 6;
      const amountIn = ethers.parseUnits(input.amount, decimalsIn);

      // Approve the pool to pull the input token if needed
      const tokenAddress = TOKEN_ADDRESSES[fromSymbol];
      const token = new ethers.Contract(tokenAddress, ERC20_MIN_ABI, signer);
      const allowance = await token.allowance(walletAddress, POOL_ADDRESS);
      if (allowance < amountIn) {
        const approveTx = await token.approve(POOL_ADDRESS, amountIn);
        await approveTx.wait();
      }

      // 1% slippage tolerance on min_dy — TODO: make this user-configurable in the trade ticket
      const expectedOut = await readPool.get_dy(indices[fromSymbol], indices[toSymbol], amountIn);
      const minOut = (expectedOut * 99n) / 100n;

      const tx = await pool.exchange(indices[fromSymbol], indices[toSymbol], amountIn, minOut);
      const receipt = await tx.wait();

      return { ok: true, txHash: receipt.hash };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Swap failed" };
    }
  },
};
