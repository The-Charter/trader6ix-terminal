"use client";

import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { RiskCalculatorPanel } from "@/components/risk-calculator-panel";
import { EconomicCalendarPanel } from "@/components/economic-calendar-panel";
import { AIAgentTeaser } from "@/components/ai-agent-teaser";
import { AIInsightPanel } from "@/components/ai-insight-panel";
import { DEMO_ASSETS, demoPrice } from "@/lib/demo-market-data";

export default function ToolsPage() {
  const [symbol, setSymbol] = useState("BTC-PERP");
  const base = symbol.split("-")[0];

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 px-4 py-6 lg:grid-cols-[1fr_1fr_320px]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-ink-2">Instrument:</span>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="rounded-md border border-border bg-surface-1 px-2 py-1.5 text-sm text-ink"
            >
              {["BTC-PERP", "ETH-PERP", "SOL-PERP"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <RiskCalculatorPanel symbol={symbol} currentPrice={demoPrice(base)} onUsePositionSize={() => undefined} />
          <p className="text-xs text-ink-3">
            &quot;Use Position Size&quot; carries values into the order ticket from the Perps page — open a market
            there to see it applied live.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <EconomicCalendarPanel />
          <AIInsightPanel symbol={symbol} />
        </div>

        <div className="flex flex-col gap-4">
          <AIAgentTeaser />
        </div>
      </div>
    </div>
  );
}
