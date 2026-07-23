"use client";

import { useMemo, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { MarketSelector } from "@/components/market-selector";
import { OrderbookPanel } from "@/components/orderbook-panel";
import { CandlestickChart } from "@/components/candlestick-chart";
import { TradeTicket } from "@/components/trade-ticket";
import { PositionsPanel } from "@/components/positions-panel";
import { useExchangeInfo } from "@/lib/hooks";
import { TARGET_MARKETS } from "@/lib/markets";

export default function PerpsPage() {
  const [symbol, setSymbol] = useState<string>(TARGET_MARKETS[0].perpSymbol);
  const { data } = useExchangeInfo();

  const contractId = useMemo(() => {
    return data?.futureContracts.find((c) => c.symbol === symbol)?.id ?? null;
  }, [data, symbol]);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3">
        <MarketSelector kind="perps" selected={symbol} onSelect={setSymbol} />
        <span className="text-xs text-zinc-500">Perpetual</span>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-px bg-zinc-800 lg:grid-cols-[1fr_280px_320px]">
        <div className="flex flex-col bg-zinc-950">
          <div className="h-[360px] p-3">
            <CandlestickChart symbol={symbol} />
          </div>
          <div className="flex-1 border-t border-zinc-800">
            <PositionsPanel />
          </div>
        </div>

        <div className="bg-zinc-950">
          <OrderbookPanel symbol={symbol} />
        </div>

        <div className="bg-zinc-950">
          <TradeTicket symbol={symbol} contractId={contractId} kind="perps" />
        </div>
      </div>
    </div>
  );
}
