import { ethers } from "ethers";
import type { SpotAdapter, SpotPool, SwapQuote, SwapQuoteInput, SwapResult } from "./spot-adapter";

/**
 * Tower Exchange — Arc's native stablecoin swap aggregator. Implemented as a
 * SpotAdapter (not FXAdapter) because its actual flow — request a quote,
 * build an unsigned tx, sign with the connected wallet, broadcast — is a
 * swap, not an RFQ maker/taker negotiation like StableFX. See lib/tower/types.ts
 * for the verification-status note on Tower's exact API shape.
 *
 * Non-custodial by design: the API key never leaves the server (all Tower
 * calls go through /api/tower/*), and the actual transaction is always
 * signed by the user's own connected wallet, never by a server-held key.
 */

const ENABLED = process.env.NEXT_PUBLIC_TOWER_ENABLED !== "false"; // on by default once deployed with a real key
const ARC_CHAIN_ID = Number(process.env.NEXT_PUBLIC_ARC_CHAIN_ID ?? 5042002);

// Confirmed official Arc testnet addresses (docs.arc.io/arc/references/contract-addresses)
const TOKEN_ADDRESSES: Record<string, string> = {
  USDC: "0x3600000000000000000000000000000000000000",
  EURC: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
};
const DECIMALS: Record<string, number> = { USDC: 6, EURC: 6 };
const DEFAULT_SLIPPAGE = 0.005; // 0.5% — TODO: make user-configurable in the trade ticket

async function requestQuote(input: SwapQuoteInput) {
  const fromSymbol = input.side === "sell" ? input.base : input.quote;
  const toSymbol = input.side === "sell" ? input.quote : input.base;
  const decimalsIn = DECIMALS[fromSymbol] ?? 6;
  const amountAtomic = ethers.parseUnits(input.amount, decimalsIn).toString();

  const res = await fetch("/api/tower/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      inputToken: TOKEN_ADDRESSES[fromSymbol],
      outputToken: TOKEN_ADDRESSES[toSymbol],
      inputAmount: amountAtomic,
      slippage: DEFAULT_SLIPPAGE,
      chainId: ARC_CHAIN_ID,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to get Tower quote");
  return { quote: json, fromSymbol, toSymbol, decimalsIn };
}

export const towerAdapter: SpotAdapter = {
  id: "tower",
  displayName: "Tower Exchange",
  chainId: ARC_CHAIN_ID,
  isLive: ENABLED,

  async getPools(): Promise<SpotPool[]> {
    if (!ENABLED) return [{ base: "EURC", quote: "USDC", poolAddress: "", isLive: false }];
    // Tower is an aggregator, not a single pool — "poolAddress" here is
    // informational rather than a literal contract address.
    return [{ base: "EURC", quote: "USDC", poolAddress: "tower-aggregated", isLive: true }];
  },

  async getSwapQuote(input: SwapQuoteInput): Promise<SwapQuote> {
    if (!ENABLED) throw new Error("Tower adapter is not configured — TOWER_API_KEY is not set.");
    const { quote, toSymbol } = await requestQuote(input);
    const decimalsOut = DECIMALS[toSymbol] ?? 6;
    return {
      amountIn: input.amount,
      amountOut: ethers.formatUnits(quote.outputAmount, decimalsOut),
      priceImpactPct: quote.priceImpact ?? 0,
      poolAddress: quote.route ?? "tower-aggregated",
    };
  },

  async swap(input: SwapQuoteInput, walletAddress: string): Promise<SwapResult> {
    if (!ENABLED) return { ok: false, error: "Tower adapter is not configured — TOWER_API_KEY is not set." };
    if (typeof window === "undefined" || !(window as any).ethereum) {
      return { ok: false, error: "No browser wallet provider found — connect a wallet first." };
    }

    try {
      const { quote, fromSymbol, toSymbol } = await requestQuote(input);

      const buildRes = await fetch("/api/tower/build-tx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId: quote.quoteId,
          inputToken: TOKEN_ADDRESSES[fromSymbol],
          outputToken: TOKEN_ADDRESSES[toSymbol],
          amount: quote.inputAmount,
          minOutputAmount: quote.minOutputAmount,
          slippage: DEFAULT_SLIPPAGE,
          userAddress: walletAddress,
          chainId: ARC_CHAIN_ID,
        }),
      });
      const buildJson = await buildRes.json();
      if (!buildRes.ok) throw new Error(buildJson.error ?? "Failed to build Tower transaction");

      if (buildJson.chainId !== ARC_CHAIN_ID) {
        return {
          ok: false,
          error: `Tower built this transaction for chain ${buildJson.chainId}, but Trader6ix is configured for Arc (${ARC_CHAIN_ID}). Refusing to sign — please switch networks or contact support.`,
        };
      }

      const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
      const network = await browserProvider.getNetwork();
      if (Number(network.chainId) !== ARC_CHAIN_ID) {
        return { ok: false, error: `Your wallet is connected to the wrong network. Please switch to Arc Testnet (chain ${ARC_CHAIN_ID}) and try again.` };
      }
      const signer = await browserProvider.getSigner(walletAddress);

      // Approval step, only if Tower says one is required — use their exact
      // approval payload rather than crafting our own unlimited-allowance approve().
      if (buildJson.approval) {
        try {
          const approvalTx = await signer.sendTransaction({
            to: buildJson.approval.to,
            data: buildJson.approval.data,
            value: buildJson.approval.value ? BigInt(buildJson.approval.value) : 0n,
          });
          await approvalTx.wait();
        } catch (err: any) {
          if (err?.code === "ACTION_REJECTED" || err?.code === 4001) {
            return { ok: false, error: "Transaction rejected in wallet." };
          }
          throw err;
        }
      }

      try {
        const swapTx = await signer.sendTransaction({
          to: buildJson.swap.to,
          data: buildJson.swap.data,
          value: buildJson.swap.value ? BigInt(buildJson.swap.value) : 0n,
        });
        const receipt = await swapTx.wait();
        return { ok: true, txHash: receipt?.hash };
      } catch (err: any) {
        if (err?.code === "ACTION_REJECTED" || err?.code === 4001) {
          return { ok: false, error: "Transaction rejected in wallet." };
        }
        if (err?.message?.includes("slippage") || err?.reason?.includes("slippage")) {
          return { ok: false, error: "Swap could not be executed because the market moved beyond your slippage tolerance." };
        }
        throw err;
      }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Swap failed" };
    }
  },
};
