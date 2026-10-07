"use client";

import type { MobileProduct } from "../MobileApp";
import { AIInsightPanel } from "@/components/ai-insight-panel";
import { RiskCalculatorPanel } from "@/components/risk-calculator-panel";
import { EconomicCalendarPanel } from "@/components/economic-calendar-panel";
import { AIAgentTeaser } from "@/components/ai-agent-teaser";
import { demoPrice } from "@/lib/demo-market-data";
import type { TradeTicketPrefill } from "@/components/trade-ticket";

export function MobileToolsTab({
  symbol,
  product,
  onUsePositionSize,
}: {
  symbol: string;
  product: MobileProduct;
  onUsePositionSize: (prefill: TradeTicketPrefill) => void;
}) {
  const base = symbol.split("-")[0] || "BTC";

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      {product === "perps" && symbol && <AIInsightPanel symbol={symbol} />}

      {product === "perps" && symbol && (
        <RiskCalculatorPanel symbol={symbol} currentPrice={demoPrice(base)} onUsePositionSize={onUsePositionSize} />
      )}

      <EconomicCalendarPanel />
      <AIAgentTeaser />
    </div>
  );
}
