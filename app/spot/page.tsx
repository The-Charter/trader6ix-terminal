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

export default function SpotPage() {
  const [symbol, setSymbol] = useState<string>(TARGET_MARKETS[0].spotSymbol);
  const { data } = useExchangeInfo();

  const contractId = useMemo(() => {
    return data?.futureContracts.find((c) => c.symbol === symbol)?.id ?? null;
  }, [data, symbol]);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <div className="border-b border-amber-400/20 bg-amber-400/5 px-4 py-2 text-xs text-amber-300">
        Spot trading is not yet live on Hibachi — the Hibachi team has said it&apos;s coming soon. Markets below will
        activate automatically once Hibachi lists them; nothing here is simulated in the meantime.
      </div>

      <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3">
        <MarketSelector kind="spot" selected={symbol} onSelect={setSymbol} />
        <span className="text-xs text-zinc-500">Spot</span>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-px bg-zinc-800 lg:grid-cols-[1fr_280px_320px]">
        <div className="order-1 flex flex-col bg-zinc-950 lg:order-none">
          <div className="h-[280px] p-3 sm:h-[360px]">
            <CandlestickChart symbol={symbol} />
          </div>
          <div className="border-t border-zinc-800">
            <PositionsPanel />
          </div>
        </div>

        <div className="order-3 bg-zinc-950 lg:order-none">
          <OrderbookPanel symbol={symbol} />
        </div>

        <div className="order-2 bg-zinc-950 lg:order-none">
          <TradeTicket symbol={symbol} contractId={contractId} kind="spot" />
        </div>
      </div>
    </div>
  );
}
