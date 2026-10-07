"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { TokenLogo } from "@/components/token-logo";
import { usePrices } from "@/lib/hooks";
import { COINGECKO_IDS } from "@/lib/prices";

const STORAGE_KEY = "trader6ix:watchlist";
const DEFAULT_WATCHLIST = ["BTC", "ETH", "SOL"];
const WATCHABLE_SYMBOLS = Object.keys(COINGECKO_IDS);

function formatUsd(value: number): string {
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: value < 1 ? 4 : 2 })}`;
}

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<string[]>(DEFAULT_WATCHLIST);
  const { data: prices, loading, error } = usePrices();

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setWatchlist(JSON.parse(stored));
      } catch {
        // ignore malformed storage, fall back to default
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
  }, [watchlist]);

  function toggle(symbol: string) {
    setWatchlist((w) => (w.includes(symbol) ? w.filter((s) => s !== symbol) : [...w, symbol]));
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <h1 className="mb-1 text-lg font-semibold text-ink">Watchlist</h1>
        <p className="mb-4 text-xs text-ink-3">Saved to this browser only. Prices from CoinGecko.</p>
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
                  <div className="text-right">
                    <p className="font-mono text-sm text-ink">
                      {price ? formatUsd(price.usd) : loading ? "…" : "—"}
                    </p>
                    {price?.change24h !== null && price?.change24h !== undefined && (
                      <p className={`text-xs ${price.change24h >= 0 ? "text-bull" : "text-bear"}`}>
                        {price.change24h >= 0 ? "+" : ""}
                        {price.change24h.toFixed(2)}%
                      </p>
                    )}
                  </div>
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
          {WATCHABLE_SYMBOLS.filter((symbol) => !watchlist.includes(symbol)).map((symbol) => (
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
