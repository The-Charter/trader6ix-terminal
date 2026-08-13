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

const PRODUCT_LABEL: Record<MobileProduct, string> = { perps: "Perps", spot: "Spot" };

export function MobileTerminal({ product, onBack }: { product: MobileProduct; onBack: () => void }) {
  const [spotCategory, setSpotCategory] = useState<"crypto" | "fx">("crypto");

  const adapters =
    product === "perps" ? PERPS_ADAPTERS : spotCategory === "crypto" ? SPOT_ADAPTERS : FX_ADAPTERS;
  const defaultId =
    product === "perps"
      ? DEFAULT_PERPS_ADAPTER_ID
      : spotCategory === "crypto"
        ? DEFAULT_SPOT_ADAPTER_ID
        : DEFAULT_FX_ADAPTER_ID;

  const [adapterId, setAdapterId] = useState(defaultId);
  const [symbol, setSymbol] = useState<string>("");
  const [prefill, setPrefill] = useState<any>(undefined);
  const [tab, setTab] = useState<Tab>(product === "perps" ? "markets" : "chart");

  const adapter = adapters.find((a) => a.id === adapterId) ?? adapters[0];

  function cycleAdapter() {
    const idx = adapters.findIndex((a) => a.id === adapterId);
    const next = adapters[(idx + 1) % adapters.length];
    setAdapterId(next.id);
  }

  function handleSpotCategoryChange(cat: "crypto" | "fx") {
    setSpotCategory(cat);
    const nextAdapters = cat === "crypto" ? SPOT_ADAPTERS : FX_ADAPTERS;
    setAdapterId(nextAdapters[0].id);
  }

  const tabs: Tab[] = product === "perps" ? ["markets", "chart", "positions", "history", "tools"] : ["chart", "positions", "history", "tools"];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface-0">
      {/* Top header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2.5">
        <button onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-ink-2">
          ‹
        </button>
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-accent">{PRODUCT_LABEL[product]}</span>
        <button
          onClick={cycleAdapter}
          className="flex items-center gap-2 rounded-full border border-border bg-surface-1 px-2.5 py-1"
        >
          <span className={`h-1.5 w-1.5 rounded-full ${adapter.isLive ? "bg-bull" : "bg-warn"}`} />
          <span className="text-left leading-tight">
            <span className="block text-[11px] font-semibold text-ink">{adapter.displayName}</span>
            <span className="block text-[9px] text-ink-3">
              {adapter.id.startsWith("mock-") ? "Simulated" : "Arc Network"}
            </span>
          </span>
        </button>
      </div>

      {/* Spot sub-category: Crypto Spot vs FX Spot */}
      {product === "spot" && (
        <div className="flex shrink-0 gap-1 border-b border-border px-4 py-2">
          {(["crypto", "fx"] as const).map((c) => (
            <button
              key={c}
              onClick={() => handleSpotCategoryChange(c)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                spotCategory === c ? "bg-surface-2 text-ink" : "text-ink-3"
              }`}
            >
              {c === "crypto" ? "Crypto Spot" : "FX Spot"}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {tab === "chart" ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <MobileChartTab product={product} spotCategory={spotCategory} adapter={adapter as any} symbol={symbol} prefill={prefill} />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {tab === "markets" && product === "perps" && (
            <MobileMarketsTab
              adapter={adapter as any}
              onSelect={(s) => {
                setSymbol(s);
                setTab("chart");
              }}
            />
          )}
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
      )}

      {/* Bottom tab nav */}
      <div className="flex h-16 shrink-0 border-t border-border bg-surface-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex flex-1 flex-col items-center justify-center gap-1"
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl transition-all"
              style={
                tab === t
                  ? {
                      background: "linear-gradient(145deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 60%)",
                      border: "1px solid rgba(255,255,255,0.14)",
                      boxShadow:
                        "0 2px 12px rgba(0,212,255,0.35), 0 0 0 1px rgba(0,212,255,0.12), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.1)",
                      backdropFilter: "blur(8px)",
                    }
                  : undefined
              }
            >
              <span className={`h-5 w-5 ${tab === t ? "text-accent" : "text-ink-3"}`}>{TAB_ICONS[t]}</span>
            </div>
            <span className={`text-[9px] font-medium capitalize ${tab === t ? "text-accent" : "text-ink-3"}`}>{t}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
