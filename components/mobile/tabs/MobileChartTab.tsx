"use client";

import { useEffect, useState } from "react";
import type { MobileProduct } from "../MobileApp";
import { CandlestickChart } from "@/components/candlestick-chart";
import { TradeTicket } from "@/components/trade-ticket";
import { SwapTicket } from "@/components/swap-ticket";
import { FxTicket } from "@/components/fx-ticket";
import { useOrderbook } from "@/lib/hooks";
import { getInstrumentSpec } from "@/lib/instrument-specs";

export function MobileChartTab({
  product,
  spotCategory,
  adapter,
  symbol,
  prefill,
}: {
  product: MobileProduct;
  spotCategory?: "crypto" | "fx";
  adapter: any;
  symbol: string;
  prefill?: any;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (prefill) setSheetOpen(true);
  }, [prefill?.token]);

  if (product === "spot" && spotCategory === "fx") {
    return (
      <div className="px-4 py-6">
        <FxTicket adapter={adapter} />
      </div>
    );
  }

  if (product === "spot") {
    return (
      <div className="px-4 py-6">
        <SwapTicket adapter={adapter} />
      </div>
    );
  }

  // perps
  const { data: orderbook } = useOrderbook(adapter, symbol || null);
  const spec = symbol ? getInstrumentSpec(symbol) : null;
  const bestBid = orderbook?.bids?.[0]?.price;
  const bestAsk = orderbook?.asks?.[0]?.price;

  if (!symbol) {
    return <p className="px-4 py-6 text-center text-sm text-ink-3">Pick a market from the Markets tab first.</p>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 px-2 pt-2">
        <CandlestickChart adapter={adapter} symbol={symbol} />
      </div>

      <button
        onClick={() => setSheetOpen((o) => !o)}
        className="flex shrink-0 items-center justify-between gap-2 border-y border-border bg-surface-1 px-4 py-2.5 text-xs font-medium"
      >
        <span className="flex items-center gap-2 text-ink-2">
          <span className={`transition-transform ${sheetOpen ? "rotate-180" : ""}`}>▲</span>
          Trade
        </span>
        {bestBid && bestAsk && spec && (
          <span className="flex gap-3 font-mono">
            <span className="text-bear">Sell {parseFloat(bestBid).toFixed(spec.pricePrecision)}</span>
            <span className="text-bull">Buy {parseFloat(bestAsk).toFixed(spec.pricePrecision)}</span>
          </span>
        )}
      </button>

      {sheetOpen && (
        <div className="max-h-[60vh] shrink-0 overflow-y-auto border-b border-border">
          <TradeTicket adapter={adapter} symbol={symbol} prefill={prefill} />
        </div>
      )}
    </div>
  );
}
