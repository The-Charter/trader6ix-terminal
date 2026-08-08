"use client";

import { useState } from "react";
import type { MobileProduct } from "./MobileApp";
import {
  PERPS_ADAPTERS,
  SPOT_ADAPTERS,
  FX_ADAPTERS,
  DEFAULT_PERPS_ADAPTER_ID,
  DEFAULT_SPOT_ADAPTER_ID,
  DEFAULT_FX_ADAPTER_ID,
} from "@/lib/adapters/registry";
import { MobileMarketsTab } from "./tabs/MobileMarketsTab";
import { MobileChartTab } from "./tabs/MobileChartTab";
import { MobilePositionsTab } from "./tabs/MobilePositionsTab";
import { MobileHistoryTab } from "./tabs/MobileHistoryTab";
import { MobileToolsTab } from "./tabs/MobileToolsTab";

type Tab = "markets" | "chart" | "positions" | "history" | "tools";

const TAB_ICONS: Record<Tab, JSX.Element> = {
  markets: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="14" width="3" height="6" rx="0.5" />
      <rect x="11" y="9" width="3" height="11" rx="0.5" />
      <rect x="16" y="4" width="3" height="16" rx="0.5" />
    </svg>
  ),
  positions: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  history: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="12 8 12 12 14 14" />
      <path d="M3.05 11a9 9 0 1 1 .5 4" />
    </svg>
  ),
  tools: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82 2 2 0 1 1-2.83 2.83 1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33 2 2 0 1 1-2.83-2.83 1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82 2 2 0 1 1 2.83-2.83A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33 2 2 0 1 1 2.83 2.83A1.65 1.65 0 0 0 19.4 9c.14.57.55 1 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
};

const PRODUCT_LABEL: Record<MobileProduct, string> = { perps: "Perps", spot: "Spot", fx: "FX" };

export function MobileTerminal({ product, onBack }: { product: MobileProduct; onBack: () => void }) {
  const adapters = product === "perps" ? PERPS_ADAPTERS : product === "spot" ? SPOT_ADAPTERS : FX_ADAPTERS;
  const defaultId =
    product === "perps" ? DEFAULT_PERPS_ADAPTER_ID : product === "spot" ? DEFAULT_SPOT_ADAPTER_ID : DEFAULT_FX_ADAPTER_ID;

  const [adapterId, setAdapterId] = useState(defaultId);
  const [symbol, setSymbol] = useState<string>("");
  const [prefill, setPrefill] = useState<any>(undefined);
  const [tab, setTab] = useState<Tab>(product === "perps" ? "markets" : "chart");
  const [chipOpen, setChipOpen] = useState(false);

  const adapter = adapters.find((a) => a.id === adapterId) ?? adapters[0];

  function cycleAdapter() {
    const idx = adapters.findIndex((a) => a.id === adapterId);
    const next = adapters[(idx + 1) % adapters.length];
    setAdapterId(next.id);
    setChipOpen(false);
  }

  const tabs: Tab[] = product === "perps" ? ["markets", "chart", "positions", "history", "tools"] : ["chart", "positions", "history", "tools"];

  return (
    <div className="flex min-h-screen flex-col bg-surface-0">
      {/* Top header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <button onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-ink-2">
          ‹
        </button>
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-accent">{PRODUCT_LABEL[product]}</span>
        <button
          onClick={cycleAdapter}
          className="flex items-center gap-1.5 rounded-full border border-border bg-surface-1 px-2.5 py-1"
        >
          <span className={`h-1.5 w-1.5 rounded-full ${adapter.isLive ? "bg-bull" : "bg-warn"}`} />
          <span className="text-[11px] font-medium text-ink">{adapter.displayName}</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-16">
        {tab === "markets" && product === "perps" && (
          <MobileMarketsTab
            adapter={adapter as any}
            onSelect={(s) => {
              setSymbol(s);
              setTab("chart");
            }}
          />
        )}
        {tab === "chart" && <MobileChartTab product={product} adapter={adapter as any} symbol={symbol} prefill={prefill} />}
        {tab === "positions" && <MobilePositionsTab product={product} adapter={adapter as any} />}
        {tab === "history" && <MobileHistoryTab />}
        {tab === "tools" && (
          <MobileToolsTab
            symbol={symbol}
            product={product}
            onUsePositionSize={(p) => {
              setPrefill(p);
              setTab("chart");
            }}
          />
        )}
      </div>

      {/* Bottom tab nav */}
      <div className="fixed bottom-0 left-0 right-0 mx-auto flex h-16 max-w-md border-t border-border bg-surface-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex flex-1 flex-col items-center justify-center gap-1"
          >
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                tab === t ? "bg-accent/15 text-accent" : "text-ink-3"
              }`}
            >
              <span className="h-5 w-5">{TAB_ICONS[t]}</span>
            </div>
            <span className={`text-[9px] font-medium capitalize ${tab === t ? "text-accent" : "text-ink-3"}`}>{t}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
