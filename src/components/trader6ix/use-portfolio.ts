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
  txHash?: string;
}

interface TradesEnvelope {
  trades: TradeItem[];
  /** Block to continue from for older trades, or null once genesis is reached. */
  nextBefore: number | null;
  scannedBackTo: string;
}

interface PortfolioState {
  portfolio: PortfolioSnapshot | null;
  activity: ActivityItem[];
  trades: TradeItem[];
  /** Cursor for older trades; null when the whole history has been scanned. */
  tradesNextBefore: number | null;
  /** Estimated time the trade scan has reached back to. */
  tradesScannedBackTo: string | null;
  loadingOlder: boolean;
  /** True only while there is nothing to show yet. */
  loading: boolean;
  error: string | null;
  /** The API rejected our credentials — a sign-in problem, not a data problem. */
  authExpired: boolean;
  /** When the data on screen was last confirmed by the server. */
  updatedAt: number | null;
}

const EMPTY: PortfolioState = {
  portfolio: null,
  activity: [],
  trades: [],
  tradesNextBefore: null,
  tradesScannedBackTo: null,
  loadingOlder: false,
  loading: false,
  error: null,
  authExpired: false,
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
  tradesNextBefore?: number | null;
  tradesScannedBackTo?: string | null;
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

function tradeKey(trade: TradeItem): string {
  return trade.txHash ?? `${trade.timestamp}-${trade.symbol}-${trade.quantity}`;
}

/** Newest-first union of two trade lists, de-duplicated. */
function mergeTrades(a: TradeItem[], b: TradeItem[]): TradeItem[] {
  const byKey = new Map<string, TradeItem>();
  for (const trade of [...a, ...b]) byKey.set(tradeKey(trade), trade);
  return [...byKey.values()].sort((x, y) => y.timestamp - x.timestamp);
}

/** Of two cursors, the one that has scanned further back (null = whole history). */
function deeperCursor(a: number | null, b: number | null): number | null {
  if (a === null || b === null) return null;
  return Math.min(a, b);
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
  const stateRef = useRef(state);
  stateRef.current = state;

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
        if (!mounted.current) return;

        // A 401 is a sign-in problem, not a data problem: the client sent no
        // token, or the token was rejected. Surfacing the API's internal message
        // ("Missing bearer token") tells the user nothing they can act on.
        if ([portfolioRes, activityRes, tradesRes].some((response) => response.status === 401)) {
          setState((prev) =>
            prev.portfolio
              ? { ...prev, loading: false, error: null, authExpired: true }
              : { ...EMPTY, authExpired: true }
          );
          return;
        }

        if (!portfolioRes.ok) throw new Error(errorText(portfolioJson, "Failed to load portfolio"));
        if (!activityRes.ok) throw new Error(errorText(activityJson, "Failed to load activity"));
        if (!tradesRes.ok) throw new Error(errorText(tradesJson, "Failed to load trades"));

        const portfolio = portfolioJson as PortfolioSnapshot;
        const activity = activityJson as ActivityItem[];
        const envelope = tradesJson as TradesEnvelope;

        // A background refresh only re-reads the newest window. Merge it into
        // what is already loaded so trades the user paged back to do not vanish.
        const prev = stateRef.current;
        const trades = mergeTrades(prev.trades, envelope.trades);
        const nextBefore =
          prev.trades.length > 0 ? deeperCursor(prev.tradesNextBefore, envelope.nextBefore) : envelope.nextBefore;
        const scannedBackTo =
          prev.trades.length > 0 && prev.tradesScannedBackTo && prev.tradesScannedBackTo < envelope.scannedBackTo
            ? prev.tradesScannedBackTo
            : envelope.scannedBackTo;

        setState((current) => ({
          ...current,
          portfolio,
          activity,
          trades,
          tradesNextBefore: nextBefore,
          tradesScannedBackTo: scannedBackTo,
          loading: false,
          error: null,
          authExpired: false,
          updatedAt: Date.now(),
        }));
        writeCache(address, {
          portfolio,
          activity,
          trades,
          tradesNextBefore: nextBefore,
          tradesScannedBackTo: scannedBackTo,
        });
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
        tradesNextBefore: cached.tradesNextBefore ?? null,
        tradesScannedBackTo: cached.tradesScannedBackTo ?? null,
        loadingOlder: false,
        loading: false,
        error: null,
        authExpired: false,
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

  /** Scans further back for older trades and appends them. */
  const loadOlderTrades = useCallback(async () => {
    if (!address || state.tradesNextBefore === null || state.loadingOlder) return;
    setState((prev) => ({ ...prev, loadingOlder: true, error: null }));
    try {
      const res = await apiFetch(
        `/api/data/trades?address=${encodeURIComponent(address)}&before=${state.tradesNextBefore}`
      );
      const json = await res.json();
      if (!mounted.current) return;
      if (res.status === 401) {
        setState((prev) => ({ ...prev, loadingOlder: false, authExpired: true }));
        return;
      }
      if (!res.ok) throw new Error(errorText(json, "Failed to load older trades"));
      const envelope = json as TradesEnvelope;
      const prev = stateRef.current;
      const trades = mergeTrades(prev.trades, envelope.trades);
      setState((current) => ({
        ...current,
        trades,
        tradesNextBefore: envelope.nextBefore,
        tradesScannedBackTo: envelope.scannedBackTo,
        loadingOlder: false,
      }));
      if (prev.portfolio) {
        writeCache(address, {
          portfolio: prev.portfolio,
          activity: prev.activity,
          trades,
          tradesNextBefore: envelope.nextBefore,
          tradesScannedBackTo: envelope.scannedBackTo,
        });
      }
    } catch (err) {
      if (!mounted.current) return;
      const message = err instanceof Error ? err.message : "Failed to load older trades";
      setState((prev) => ({ ...prev, loadingOlder: false, error: message }));
    }
  }, [address, state.tradesNextBefore, state.loadingOlder]);

  return { ...state, refresh: () => load(), loadOlderTrades };
}
