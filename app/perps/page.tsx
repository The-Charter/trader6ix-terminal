"use client";

import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { MarketSelector } from "@/components/market-selector";
import { VenueSelector } from "@/components/venue-selector";
import { OrderbookPanel } from "@/components/orderbook-panel";
import { CandlestickChart } from "@/components/candlestick-chart";
import { TradeTicket } from "@/components/trade-ticket";
import { PositionsPanel } from "@/components/positions-panel";
import { PERPS_ADAPTERS, DEFAULT_PERPS_ADAPTER_ID, getPerpsAdapter } from "@/lib/adapters/registry";
import { AIInsightPanel } from "@/components/ai-insight-panel";

export default function PerpsPage() {
  const [adapterId, setAdapterId] = useState(DEFAULT_PERPS_ADAPTER_ID);
  const adapter = getPerpsAdapter(adapterId) ?? PERPS_ADAPTERS[0];
  const [symbol, setSymbol] = useState<string>("");

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
        <VenueSelector adapters={PERPS_ADAPTERS} selectedId={adapterId} onSelect={setAdapterId} />
        <MarketSelector adapter={adapter} selected={symbol} onSelect={setSymbol} />
        <span className="text-xs text-ink-3">Perpetual</span>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-px bg-surface-2 lg:grid-cols-[1fr_280px_320px]">
        <div className="order-1 flex flex-col bg-surface-0 lg:order-none">
          <div className="h-[280px] p-3 sm:h-[360px]">
            <CandlestickChart adapter={adapter} symbol={symbol || null} />
          </div>
          <div className="border-t border-border">
            <PositionsPanel adapter={adapter} />
          </div>
        </div>

        <div className="order-3 bg-surface-0 lg:order-none">
          <OrderbookPanel adapter={adapter} symbol={symbol || null} />
        </div>

        <div className="order-2 flex flex-col gap-3 bg-surface-0 p-3 lg:order-none lg:p-0">
          <TradeTicket adapter={adapter} symbol={symbol || null} />
          {symbol && (
            <div className="lg:px-0">
              <AIInsightPanel symbol={symbol} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
