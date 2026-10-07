import { ethers } from "ethers";
import type { SpotAdapter, SpotPool, SwapQuote, SwapQuoteInput, SwapResult } from "./spot-adapter";
import { getTowerToken } from "@/lib/tower/tokens";

/**
 * Tower Exchange — Arc's native stablecoin swap aggregator. Implemented as a
 * SpotAdapter (not FXAdapter) because its actual flow — request a quote,
 * build an unsigned tx, sign with the connected wallet, broadcast — is a
 * swap, not an RFQ maker/taker negotiation like StableFX. Tower's API shapes
 * are verified against docs.tower.exchange — see lib/tower/types.ts.
 *
 * Non-custodial by design: the API key never leaves the server (all Tower
 * calls go through /api/tower/*), and the actual transaction is always
 * signed by the user's own connected wallet, never by a server-held key.
 */

const ENABLED = process.env.NEXT_PUBLIC_TOWER_ENABLED !== "false"; // on by default once deployed with a real key
const ARC_CHAIN_ID = Number(process.env.NEXT_PUBLIC_ARC_CHAIN_ID ?? 5042002);

// Tower expresses slippage in BASIS POINTS (50 = 0.5%); this is also Tower's
// own API default. TODO: make user-configurable in the trade ticket.
const DEFAULT_SLIPPAGE_BPS = 50;

async function requestQuote(input: SwapQuoteInput) {
  const fromSymbol = input.side === "sell" ? input.base : input.quote;
  const toSymbol = input.side === "sell" ? input.quote : input.base;
  const inputToken = getTowerToken(fromSymbol);
  const outputToken = getTowerToken(toSymbol);
  const amountAtomic = ethers.parseUnits(input.amount, inputToken.decimals).toString();

  const res = await fetch("/api/tower/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      inputToken: inputToken.address,
      outputToken: outputToken.address,
      inputAmount: amountAtomic,
      slippageTolerance: DEFAULT_SLIPPAGE_BPS,
      chainId: ARC_CHAIN_ID,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to get Tower quote");

  // CONFIRMED shape: { success: boolean, data: {...} } — not flat fields.
  const data = json.data;
  if (!data || data.outputAmount === undefined || data.outputAmount === null) {
    throw new Error(
      `Tower quote response is missing "data.outputAmount" — raw response: ${JSON.stringify(json).slice(0, 500)}`
    );
  }

  return { data, fromSymbol, toSymbol };
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
    const { data } = await requestQuote(input);
    // CONFIRMED: Tower normalizes response amounts to 18 decimals internally,
    // regardless of the token's actual on-chain decimals (verified: 1 USDC
    // sent as 6-decimal atomic units was echoed back as 1e18, i.e. rescaled
    // to 18-decimal representation of the same real quantity).
    return {
      amountIn: input.amount,
      amountOut: ethers.formatUnits(data.outputAmount, 18),
      priceImpactPct: data.priceImpact ?? 0,
      // The live API reports the chosen venue inside route.hops[0] (dexName/
      // dexId), NOT as a top-level field — unlike the docs example. Prefer the
      // human-readable name, then fall back defensively.
      poolAddress:
        data.route?.hops?.[0]?.dexName ??
        data.dexName ??
        data.route?.hops?.[0]?.dexId ??
        "tower-aggregated",
    };
  },

  async swap(input: SwapQuoteInput, walletAddress: string): Promise<SwapResult> {
    if (!ENABLED) return { ok: false, error: "Tower adapter is not configured — TOWER_API_KEY is not set." };
    if (typeof window === "undefined" || !(window as any).ethereum) {
      return { ok: false, error: "No browser wallet provider found — connect a wallet first." };
    }

    try {
      const { data } = await requestQuote(input);

      const buildRes = await fetch("/api/tower/build-tx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Tower requires the complete quote returned by /swap/quote.
          quote: data,
          userAddress: walletAddress,
        }),
      });
      const buildJson = await buildRes.json();
      if (!buildRes.ok) throw new Error(buildJson.error ?? "Failed to build Tower transaction");

      // build-tx is untested against Tower's real API — surface the raw
      // shape if the fields we expect aren't there, same as we had to for
      // the quote response, rather than crash deeper in the signing flow.
      const buildData = buildJson.data ?? buildJson; // may or may not be wrapped like quote was
      if (!buildData.swap || !buildData.swap.to || !buildData.swap.data) {
        throw new Error(
          `Tower build-tx response is missing expected "swap" transaction fields — raw response: ${JSON.stringify(buildJson).slice(0, 500)}`
        );
      }

      // Tower commonly places chainId on the transaction payload rather than
      // on the response wrapper. Accept either shape, but never sign a
      // response whose target chain cannot be established.
      const towerChainId = Number(buildData.chainId ?? buildData.swap.chainId);
      if (!Number.isInteger(towerChainId)) {
        return { ok: false, error: "Tower build-tx response did not specify a transaction chain ID. Refusing to sign." };
      }
      if (towerChainId !== ARC_CHAIN_ID) {
        return {
          ok: false,
          error: `Tower built this transaction for chain ${towerChainId}, but Trader6ix is configured for Arc (${ARC_CHAIN_ID}). Refusing to sign — please switch networks or contact support.`,
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
      if (buildData.approval) {
        try {
          const approvalTx = await signer.sendTransaction({
            to: buildData.approval.to,
            data: buildData.approval.data,
            value: buildData.approval.value ? BigInt(buildData.approval.value) : 0n,
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
          to: buildData.swap.to,
          data: buildData.swap.data,
          value: buildData.swap.value ? BigInt(buildData.swap.value) : 0n,
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
