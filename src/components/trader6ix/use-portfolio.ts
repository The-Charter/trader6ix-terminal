"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  /** True only while there is nothing to show yet. */
  loading: boolean;
  error: string | null;
  /** When the data on screen was last confirmed by the server. */
  updatedAt: number | null;
}

const EMPTY: PortfolioState = {
  portfolio: null,
  activity: [],
  trades: [],
  loading: false,
  error: null,
  updatedAt: null,
};

/* ---------- client-side cache ----------
 * Portfolio data is expensive to produce (chain reads, paged log scans) and
 * changes slowly, so the browser keeps the last confirmed snapshot and paints
 * from it immediately. A revisit therefore costs no request at all, and the
 * server is only asked again when the cache is genuinely stale, when the tab
 * becomes visible, or on an explicit refresh.
 */
const CACHE_PREFIX = "trader6ix:portfolio:";
/** Age at which cached data is re-fetched immediately instead of used silently. */
const FRESH_MS = 60_000;
/** Background sync cadence while the tab is visible. */
const POLL_MS = 60_000;
/** Beyond this, a cache is too old to show without fetching first. */
const MAX_CACHE_AGE_MS = 24 * 60 * 60 * 1000;

interface CachedPayload {
  at: number;
  portfolio: PortfolioSnapshot | null;
  activity: ActivityItem[];
  trades: TradeItem[];
}

function cacheKey(address: string): string {
  return `${CACHE_PREFIX}${address.toLowerCase()}`;
}

function readCache(address: string): CachedPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(cacheKey(address));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedPayload;
    if (typeof parsed?.at !== "number" || !parsed.portfolio) return null;
    if (Date.now() - parsed.at > MAX_CACHE_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(address: string, payload: Omit<CachedPayload, "at">): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(cacheKey(address), JSON.stringify({ at: Date.now(), ...payload }));
  } catch {
    /* storage full or unavailable — the app still works, just without cache */
  }
}

/** Reads a message out of the API's `{ error: { message } }` envelope. */
function errorText(payload: unknown, fallback: string): string {
  const error = (payload as { error?: { message?: string } | string } | null)?.error;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && typeof error.message === "string") return error.message;
  return fallback;
}

/**
 * The connected wallet's portfolio, activity and trades.
 *
 * Authenticated with the Privy access token, and the API only serves wallets
 * linked to the signed-in account. Cached in the browser so returning to a page
 * is instant and does not re-query the server; fresh data arrives in the
 * background.
 */
export function usePortfolioData(address: string | null) {
  const [state, setState] = useState<PortfolioState>(EMPTY);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(
    async (options?: { background?: boolean }) => {
      if (!address) {
        setState(EMPTY);
        return;
      }
      if (!options?.background) {
        // Only show a loading state when there is nothing on screen yet.
        setState((prev) => ({ ...prev, loading: prev.portfolio === null, error: null }));
      }

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
        if (!mounted.current) return;

        const portfolio = portfolioJson as PortfolioSnapshot;
        const activity = activityJson as ActivityItem[];
        const trades = tradesJson as TradeItem[];

        setState({ portfolio, activity, trades, loading: false, error: null, updatedAt: Date.now() });
        writeCache(address, { portfolio, activity, trades });
      } catch (err) {
        if (!mounted.current) return;
        const message = err instanceof Error ? err.message : "Failed to load portfolio";
        // Keep whatever is already on screen: stale-but-labelled beats blank.
        setState((prev) =>
          prev.portfolio ? { ...prev, loading: false, error: message } : { ...EMPTY, error: message }
        );
      }
    },
    [address]
  );

  useEffect(() => {
    if (!address) {
      setState(EMPTY);
      return;
    }

    const cached = readCache(address);
    const fresh = cached !== null && Date.now() - cached.at < FRESH_MS;

    if (cached) {
      setState({
        portfolio: cached.portfolio,
        activity: cached.activity,
        trades: cached.trades,
        loading: false,
        error: null,
        updatedAt: cached.at,
      });
    } else {
      setState((prev) => ({ ...prev, loading: true, error: null }));
    }

    let cancelled = false;
    const sync = () => {
      if (!cancelled && document.visibilityState === "visible") {
        void load({ background: cached !== null });
      }
    };

    // A still-fresh cache needs no request at all.
    if (!fresh) sync();

    const interval = window.setInterval(sync, POLL_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") sync();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [address, load]);

  return { ...state, refresh: () => load() };
}
