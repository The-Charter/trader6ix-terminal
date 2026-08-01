"use client";

import { useState } from "react";
import type { MobileProduct } from "../MobileApp";
import { CandlestickChart } from "@/components/candlestick-chart";
import { TradeTicket } from "@/components/trade-ticket";
import { SwapTicket } from "@/components/swap-ticket";
import { FxTicket } from "@/components/fx-ticket";

export function MobileChartTab({ product, adapter, symbol }: { product: MobileProduct; adapter: any; symbol: string }) {
  const [sheetOpen, setSheetOpen] = useState(false);

  if (product === "spot") {
    return (
      <div className="px-4 py-6">
        <SwapTicket adapter={adapter} />
      </div>
    );
  }

  if (product === "fx") {
    return (
      <div className="px-4 py-6">
        <FxTicket adapter={adapter} />
      </div>
    );
  }

  // perps
  return (
    <div className="flex flex-col">
      <div className="h-[300px] px-2 pt-2">
        <CandlestickChart adapter={adapter} symbol={symbol || null} />
      </div>

      <button
        onClick={() => setSheetOpen((o) => !o)}
        className="flex items-center justify-center gap-2 border-y border-border bg-surface-1 py-2.5 text-xs font-medium text-ink-2"
      >
        <span className={`transition-transform ${sheetOpen ? "rotate-180" : ""}`}>▲</span>
        Trade
      </button>

      {sheetOpen && (
        <div className="border-b border-border">
          <TradeTicket adapter={adapter} symbol={symbol || null} />
        </div>
      )}

      {!symbol && (
        <p className="px-4 py-6 text-center text-sm text-ink-3">Pick a market from the Markets tab first.</p>
      )}
    </div>
  );
}
