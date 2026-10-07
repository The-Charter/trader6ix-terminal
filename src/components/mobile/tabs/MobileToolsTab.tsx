"use client";

import type { MobileProduct } from "../MobileApp";
import { RiskCalculatorPanel } from "@/components/risk-calculator-panel";
import { EconomicCalendarPanel } from "@/components/economic-calendar-panel";
import { AIAgentTeaser } from "@/components/ai-agent-teaser";
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
  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      {product === "perps" && symbol && (
        <RiskCalculatorPanel symbol={symbol} onUsePositionSize={onUsePositionSize} />
      )}

      <EconomicCalendarPanel />
      <AIAgentTeaser />
    </div>
  );
}
