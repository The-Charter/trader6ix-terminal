"use client";

import { useState } from "react";
import type { ExchangeAdapter } from "@/lib/adapters/types";
import { useMarkets } from "@/lib/hooks";
import { TokenLogo } from "@/components/token-logo";
import type { AssetSymbol } from "@/lib/markets";

export function MarketSelector({
  adapter,
  kind,
  selected,
  onSelect,
}: {
  adapter: ExchangeAdapter;
  kind: "spot" | "perps";
  selected: string;
  onSelect: (symbol: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { data: markets, loading, error } = useMarkets(adapter, kind);

  const current = markets?.find((m) => m.symbol === selected);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-medium hover:border-zinc-700"
      >
        {current ? (
          <>
            <TokenLogo symbol={current.base as AssetSymbol} size={20} />
            <span>{current.base}/{current.quote}</span>
          </>
        ) : (
          <span className="text-zinc-500">Select market</span>
        )}
        <svg width="12" height="12" viewBox="0 0 12 12" className="text-zinc-500">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-64 rounded-md border border-zinc-800 bg-zinc-900 p-1 shadow-xl">
          {loading && <div className="px-3 py-2 text-xs text-zinc-500">Loading markets from {adapter.displayName}…</div>}
          {error && (
            <div className="px-3 py-2 text-xs text-red-400">
              Couldn&apos;t reach {adapter.displayName} ({error}).
            </div>
          )}
          {markets?.map((m) => (
            <button
              key={m.symbol}
              onClick={() => {
                onSelect(m.symbol);
                setOpen(false);
              }}
              disabled={!m.isLive}
              className="flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="flex items-center gap-2">
                <TokenLogo symbol={m.base as AssetSymbol} size={18} />
                {m.base}/{m.quote}
              </span>
              {!m.isLive && <span className="text-[10px] uppercase text-zinc-500">unavailable</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
