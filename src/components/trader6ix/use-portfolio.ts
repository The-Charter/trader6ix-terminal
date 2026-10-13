"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/components/trader6ix/api-client";

export interface PortfolioBalance {
  symbol: string;
  amount: string;
  usdValue?: string;
}

export interface PortfolioSnapshot {
  walletAddress: string;
  totalUsdValue: string;
  balances: PortfolioBalance[];
  /** Assets the chain did not answer for — not the same as a zero balance. */
  unavailableAssets?: number;
}

export interface ActivityItem {
  hash: string;
  timestamp: number;
  type: string;
  summary: string;
}

export interface TradeItem {
  venue: string;
  symbol: string;
  side: string;
  quantity: string;
  price?: string;
  timestamp: number;
  pnl?: string;
}

interface PortfolioState {
  portfolio: PortfolioSnapshot | null;
  activity: ActivityItem[];
  trades: TradeItem[];
  loading: boolean;
  error: string | null;
}

const EMPTY: PortfolioState = { portfolio: null, activity: [], trades: [], loading: false, error: null };

/** Reads a message out of the API's `{ error: { message } }` envelope. */
function errorText(payload: unknown, fallback: string): string {
  const error = (payload as { error?: { message?: string } | string } | null)?.error;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && typeof error.message === "string") return error.message;
  return fallback;
}

/**
 * Loads the connected wallet's on-chain portfolio, activity and trades from the
 * backend (`/api/data/*`). Calls are authenticated with the Privy access token
 * and the API only serves wallets linked to the signed-in account. Polls every
 * 20s so new balances appear.
 */
export function usePortfolioData(address: string | null) {
  const [state, setState] = useState<PortfolioState>(EMPTY);

  const load = useCallback(async () => {
    if (!address) {
      setState(EMPTY);
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [portfolioRes, activityRes, tradesRes] = await Promise.all([
        apiFetch(`/api/data/portfolio?address=${encodeURIComponent(address)}`),
        apiFetch(`/api/data/activity?address=${encodeURIComponent(address)}`),
        apiFetch(`/api/data/trades?address=${encodeURIComponent(address)}`),
      ]);
      const [portfolioJson, activityJson, tradesJson] = await Promise.all([
        portfolioRes.json(),
        activityRes.json(),
        tradesRes.json(),
      ]);
      if (!portfolioRes.ok) throw new Error(errorText(portfolioJson, "Failed to load portfolio"));
      if (!activityRes.ok) throw new Error(errorText(activityJson, "Failed to load activity"));
      if (!tradesRes.ok) throw new Error(errorText(tradesJson, "Failed to load trades"));

      setState({
        portfolio: portfolioJson as PortfolioSnapshot,
        activity: activityJson as ActivityItem[],
        trades: tradesJson as TradeItem[],
        loading: false,
        error: null,
      });
    } catch (err) {
      setState({ ...EMPTY, error: err instanceof Error ? err.message : "Failed to load portfolio" });
    }
  }, [address]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!address) return;
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
  }, [address, load]);

  return { ...state, refresh: load };
}
