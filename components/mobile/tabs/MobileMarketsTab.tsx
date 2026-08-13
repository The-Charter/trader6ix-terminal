"use client";

import { useState } from "react";
import type { PerpsAdapter } from "@/lib/adapters/perps-adapter";
import { useMarkets } from "@/lib/hooks";
import { TokenLogo } from "@/components/token-logo";
import { demoPrice } from "@/lib/demo-market-data";

export function MobileMarketsTab({ adapter, onSelect }: { adapter: PerpsAdapter; onSelect: (symbol: string) => void }) {
  const { data: markets, loading, error } = useMarkets(adapter);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | "crypto" | "fx">("all");

  const filtered = (markets ?? [])
    .filter((m) => category === "all" || m.assetClass === category)
    .filter((m) => m.symbol.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="flex flex-col">
      <div className="px-4 py-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search markets…"
          className="w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-ink outline-none focus:border-accent"
        />
      </div>

      <div className="flex gap-1 border-b border-border px-4 pb-2">
        {(["all", "crypto", "fx"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              category === c ? "bg-surface-2 text-ink" : "text-ink-3"
            }`}
          >
            {c === "all" ? "All" : c === "crypto" ? "Crypto" : "FX"}
          </button>
        ))}
      </div>

      {loading && <p className="px-4 py-6 text-center text-sm text-ink-3">Loading markets from {adapter.displayName}…</p>}
      {error && <p className="px-4 py-6 text-center text-sm text-bear">{error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <p className="px-4 py-6 text-center text-sm text-ink-3">No markets in this category.</p>
      )}

      <div className="divide-y divide-border">
        {filtered.map((m) => {
          const price = demoPrice(m.base);
          return (
            <button
              key={m.symbol}
              onClick={() => onSelect(m.symbol)}
              disabled={!m.isLive}
              className="flex w-full items-center justify-between px-4 py-3 text-left disabled:opacity-40"
            >
              <span className="flex items-center gap-3">
                <TokenLogo symbol={m.base as any} size={30} />
                <span>
                  <span className="block font-mono text-sm font-medium text-ink">{m.symbol}</span>
                  <span className="block text-[10px] text-ink-3">
                    {m.isLive ? (m.assetClass === "fx" ? "FX Perpetual" : "Crypto Perpetual") : "Unavailable"}
                  </span>
                </span>
              </span>
              <span className="font-mono text-sm text-ink">
                {m.assetClass === "fx" ? price.toFixed(4) : `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
