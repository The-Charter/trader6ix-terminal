"use client";

import { useMemo, useState } from "react";
import { TARGET_MARKETS, reconcileMarkets, marketLabel } from "@/lib/markets";
import { useExchangeInfo } from "@/lib/hooks";
import { TokenLogo } from "@/components/token-logo";

export function MarketSelector({
  kind,
  selected,
  onSelect,
}: {
  kind: "spot" | "perps";
  selected: string;
  onSelect: (symbol: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { data, loading, error } = useExchangeInfo();

  const markets = useMemo(() => {
    if (!data?.futureContracts)
      return TARGET_MARKETS.map((m) => ({ ...m, symbol: kind === "spot" ? m.spotSymbol : m.perpSymbol, isLive: false }));
    return reconcileMarkets(data.futureContracts, kind);
  }, [data, kind]);

  const current = markets.find((m) => m.symbol === selected) ?? markets[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-medium hover:border-zinc-700"
      >
        {current && (
          <>
            <TokenLogo symbol={current.base} size={20} />
            <span>{marketLabel(current)}</span>
          </>
        )}
        <svg width="12" height="12" viewBox="0 0 12 12" className="text-zinc-500">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-64 rounded-md border border-zinc-800 bg-zinc-900 p-1 shadow-xl">
          {loading && <div className="px-3 py-2 text-xs text-zinc-500">Loading markets…</div>}
          {error && (
            <div className="px-3 py-2 text-xs text-red-400">
              Couldn&apos;t reach Hibachi ({error}). Showing target markets, availability unconfirmed.
            </div>
          )}
          {markets.map((m) => (
            <button
              key={m.symbol}
              onClick={() => {
                onSelect(m.symbol);
                setOpen(false);
              }}
              disabled={!m.isLive && !loading && !error}
              className="flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="flex items-center gap-2">
                <TokenLogo symbol={m.base} size={18} />
                {marketLabel(m)}
              </span>
              {!m.isLive && !loading && !error && (
                <span className="text-[10px] uppercase text-zinc-500">unavailable</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
