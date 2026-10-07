"use client";

import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { TokenLogo } from "@/components/token-logo";
import { SPOT_ADAPTERS } from "@/adapters/registry";
import { usePrices, useSpotTokens } from "@/lib/hooks";

const STORAGE_KEY = "trader6ix:watchlist";
const DEFAULT_WATCHLIST = ["USDC", "EURC"];

function formatUsd(value: number): string {
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: value < 1 ? 4 : 2 })}`;
}

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<string[]>(DEFAULT_WATCHLIST);
  const { data: prices, loading, error } = usePrices();
  const { data: tokens } = useSpotTokens(SPOT_ADAPTERS[0]);

  const symbols = useMemo(() => (tokens ?? []).map((token) => token.symbol), [tokens]);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) setWatchlist(parsed.filter((symbol) => typeof symbol === "string"));
    } catch {
      // ignore malformed storage, fall back to default
    }
  }, []);

  // Once the venue's token list is known, keep only symbols it still lists.
  useEffect(() => {
    if (symbols.length === 0) return;
    setWatchlist((current) => {
      const valid = current.filter((symbol) => symbols.includes(symbol));
      return valid.length > 0 ? valid : DEFAULT_WATCHLIST.filter((symbol) => symbols.includes(symbol));
    });
  }, [symbols]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
  }, [watchlist]);

  function toggle(symbol: string) {
    setWatchlist((current) => (current.includes(symbol) ? current.filter((s) => s !== symbol) : [...current, symbol]));
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <h1 className="mb-1 text-lg font-semibold text-ink">Watchlist</h1>
        <p className="mb-4 text-xs text-ink-3">
          Saved to this browser only. Assets follow the Spot venue&apos;s token list.
        </p>
        {error && <p className="mb-3 text-xs text-bear">Price feed unavailable: {error}</p>}

        <div className="divide-y divide-border rounded-lg border border-border bg-surface-1">
          {watchlist.length === 0 && <p className="px-4 py-6 text-center text-sm text-ink-3">No markets added yet.</p>}
          {watchlist.map((symbol) => {
            const price = prices?.[symbol];
            return (
              <div key={symbol} className="flex items-center justify-between px-4 py-3">
                <span className="flex items-center gap-2 text-sm text-ink">
                  <TokenLogo symbol={symbol as any} size={22} /> {symbol}
                </span>
                <div className="flex items-center gap-3">
                  <p className="font-mono text-sm text-ink">
                    {price ? formatUsd(price.usd) : loading ? "…" : "—"}
                  </p>
                  <button onClick={() => toggle(symbol)} className="text-xs text-ink-3 hover:text-bear">
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <h2 className="mb-2 mt-6 text-sm font-medium text-ink-2">Add a market</h2>
        <div className="flex flex-wrap gap-2">
          {symbols.filter((symbol) => !watchlist.includes(symbol)).map((symbol) => (
            <button
              key={symbol}
              onClick={() => toggle(symbol)}
              className="rounded-md border border-border bg-surface-1 px-3 py-1.5 text-xs text-ink-2 hover:border-accent hover:text-ink"
            >
              + {symbol}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
