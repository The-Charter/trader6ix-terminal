"use client";

import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { MarketSelector } from "@/components/market-selector";
import { VenueSelector } from "@/components/venue-selector";
import { OrderbookPanel } from "@/components/orderbook-panel";
import { CandlestickChart } from "@/components/candlestick-chart";
import { TradeTicket } from "@/components/trade-ticket";
import { PositionsPanel } from "@/components/positions-panel";
import { ADAPTERS, DEFAULT_ADAPTER_ID, getAdapter } from "@/lib/adapters/registry";

export default function PerpsPage() {
  const [adapterId, setAdapterId] = useState(DEFAULT_ADAPTER_ID);
  const adapter = getAdapter(adapterId) ?? ADAPTERS[0];
  const [symbol, setSymbol] = useState<string>("");

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <div className="flex flex-wrap items-center gap-3 border-b border-zinc-800 px-4 py-3">
        <VenueSelector selectedId={adapterId} onSelect={setAdapterId} />
        <MarketSelector adapter={adapter} kind="perps" selected={symbol} onSelect={setSymbol} />
        <span className="text-xs text-zinc-500">Perpetual</span>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-px bg-zinc-800 lg:grid-cols-[1fr_280px_320px]">
        <div className="order-1 flex flex-col bg-zinc-950 lg:order-none">
          <div className="h-[280px] p-3 sm:h-[360px]">
            <CandlestickChart adapter={adapter} symbol={symbol || null} />
          </div>
          <div className="border-t border-zinc-800">
            <PositionsPanel adapter={adapter} />
          </div>
        </div>

        <div className="order-3 bg-zinc-950 lg:order-none">
          <OrderbookPanel adapter={adapter} symbol={symbol || null} />
        </div>

        <div className="order-2 bg-zinc-950 lg:order-none">
          <TradeTicket adapter={adapter} symbol={symbol || null} kind="perps" />
        </div>
      </div>
    </div>
  );
}
