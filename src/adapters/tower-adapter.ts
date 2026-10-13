import { ethers } from "ethers";
import type { SpotAdapter, SpotPool, SpotToken, SwapQuote, SwapQuoteInput, SwapResult } from "./spot-adapter";
import { getTowerToken } from "@/lib/tower/tokens";
import { apiFetch, newIdempotencyKey } from "@/components/trader6ix/api-client";
import { ARC_CHAIN_ID, ARC_CHAIN_NAME, IS_ARC_MAINNET } from "@/lib/arc-network";

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

// Tower expresses slippage in BASIS POINTS (50 = 0.5%); this is also Tower's
// own API default. TODO: make user-configurable in the trade ticket.
const DEFAULT_SLIPPAGE_BPS = 50;

/**
 * Venue pinning now lives server-side (see src/server/swap/controller.ts) so a
 * client cannot choose the venue or the chain a swap is priced for.
 */

interface BuiltSwap {
  approval: { to: string; data: string; value?: string } | null;
  swap: { to: string; data: string; value?: string; chainId?: number };
  chainId?: number;
}

/** Reads a message out of the API's `{ error: { message } }` envelope. */
function apiErrorMessage(payload: unknown, fallback: string): string {
  const error = (payload as { error?: { message?: string } | string } | null)?.error;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && typeof error.message === "string") return error.message;
  return fallback;
}

async function requestQuote(input: SwapQuoteInput) {
  const fromSymbol = input.side === "sell" ? input.base : input.quote;
  const toSymbol = input.side === "sell" ? input.quote : input.base;
  const inputToken = getTowerToken(fromSymbol);
  const outputToken = getTowerToken(toSymbol);
  const amountAtomic = ethers.parseUnits(input.amount, inputToken.decimals).toString();

  // Authenticated first-party endpoint: it pins the chain and the venue and
  // only accepts trusted Arc tokens.
  const res = await apiFetch("/api/v1/swap/quote", {
    method: "POST",
    noIdempotencyKey: true,
    body: JSON.stringify({
      inputToken: inputToken.address,
      outputToken: outputToken.address,
      inputAmount: amountAtomic,
      slippageTolerance: input.slippageBps ?? DEFAULT_SLIPPAGE_BPS,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(apiErrorMessage(json, "Failed to get Tower quote"));

  // CONFIRMED shape: the API returns Tower's `data` object as our envelope's
  // `data`, so `{ outputAmount, minOut, route, expiresAt, … }`.
  const data = json.data;
  if (!data || data.outputAmount === undefined || data.outputAmount === null) {
    throw new Error(
      `Tower quote response is missing "outputAmount" — raw response: ${JSON.stringify(json).slice(0, 500)}`
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

  async getTokens(): Promise<SpotToken[]> {
    const res = await fetch("/api/tower/tokens");
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to load Tower tokens");
    return (json.data ?? []).map((token: Record<string, unknown>): SpotToken => ({
      symbol: String(token.symbol),
      name: String(token.name ?? token.symbol),
      address: String(token.address),
      decimals: Number(token.decimals ?? 6),
      isNativeGas: Boolean(token.isNativeGas),
    }));
  },

  async getPrices(): Promise<Record<string, number>> {
    const res = await fetch("/api/tower/prices");
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to load Tower prices");
    // The live /prices response has a mixed shape: token symbols map directly to
    // a USD number, while provider coin ids map to a { usd } object. Keep only
    // the symbol -> number entries, which is what the UI needs.
    const prices: Record<string, number> = {};
    for (const [key, value] of Object.entries(json)) {
      if (typeof value === "number") prices[key] = value;
    }
    return prices;
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
      expiresAt: data.expiresAt,
    };
  },

  async swap(input: SwapQuoteInput, walletAddress: string): Promise<SwapResult> {
    if (!ENABLED) return { ok: false, error: "Tower adapter is not configured — TOWER_API_KEY is not set." };
    if (typeof window === "undefined" || !(window as any).ethereum) {
      return { ok: false, error: "No browser wallet provider found — connect a wallet first." };
    }

    try {
      // Tower's build endpoint is intermittent on some networks, so retry with a
      // fresh quote. Each attempt is a NEW economic attempt, so it gets its own
      // idempotency key — reusing one would replay the previous build.
      const MAX_ATTEMPTS = IS_ARC_MAINNET ? 3 : 6;
      let buildData: BuiltSwap | null = null;
      let lastError = "Tower could not build the swap transaction.";

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const { data } = await requestQuote(input);
        const buildRes = await apiFetch("/api/v1/swap/build", {
          method: "POST",
          // One key per attempt: a network-level retry of THIS call replays the
          // transaction Tower already built instead of building a second one.
          idempotencyKey: newIdempotencyKey(),
          body: JSON.stringify({
            // Tower requires the complete quote returned by the quote endpoint.
            quote: data,
            userAddress: walletAddress,
          }),
        });
        const buildJson = await buildRes.json();
        const candidate = buildJson.data as Partial<BuiltSwap> | undefined;
        if (buildRes.ok && candidate?.swap?.to && candidate?.swap?.data) {
          buildData = candidate as BuiltSwap;
          break;
        }
        lastError = apiErrorMessage(buildJson, "Tower could not build the swap transaction.");
        if (attempt < MAX_ATTEMPTS) await new Promise((resolve) => setTimeout(resolve, 500));
      }

      if (!buildData) return { ok: false, error: lastError };

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
        return { ok: false, error: `Your wallet is connected to the wrong network. Please switch to ${ARC_CHAIN_NAME} (chain ${ARC_CHAIN_ID}) and try again.` };
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
