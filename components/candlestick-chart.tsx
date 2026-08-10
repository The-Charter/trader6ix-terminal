"use client";

import { useState } from "react";
import type { PerpsAdapter } from "@/lib/adapters/perps-adapter";
import { useKlines } from "@/lib/hooks";
import { getInstrumentSpec } from "@/lib/instrument-specs";

const TIMEFRAMES: { label: string; interval: string }[] = [
  { label: "M1", interval: "1m" },
  { label: "M5", interval: "5m" },
  { label: "M15", interval: "15m" },
  { label: "H1", interval: "1h" },
  { label: "H4", interval: "4h" },
  { label: "D1", interval: "1d" },
  { label: "W1", interval: "1w" },
];

export function CandlestickChart({
  adapter,
  symbol,
  showHeader = true,
}: {
  adapter: PerpsAdapter;
  symbol: string | null;
  showHeader?: boolean;
}) {
  const [interval, setInterval] = useState("5m");
  const { data: candles, loading, error } = useKlines(adapter, symbol, interval);

  if (!symbol) {
    return <div className="flex h-full items-center justify-center text-sm text-ink-3">Select a market to view its chart.</div>;
  }
  if (error) {
    return <div className="flex h-full items-center justify-center text-sm text-bear">Chart unavailable — {error}</div>;
  }
  if (loading && (!candles || candles.length === 0)) {
    return <div className="flex h-full items-center justify-center text-sm text-ink-3">Loading chart from {adapter.displayName}…</div>;
  }
  if (!candles || candles.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-ink-3">No trade history yet for this market.</div>;
  }

  const spec = getInstrumentSpec(symbol);
  const min = Math.min(...candles.map((c) => c.low));
  const max = Math.max(...candles.map((c) => c.high));
  const range = max - min || 1;
  const width = 800;
  const height = 320;
  const candleW = width / candles.length;
  const y = (price: number) => height - ((price - min) / range) * height;

  const last = candles[candles.length - 1];
  const first = candles[0];
  const changePct = first.open !== 0 ? ((last.close - first.open) / first.open) * 100 : 0;
  const dayHigh = Math.max(...candles.map((c) => c.high));
  const dayLow = Math.min(...candles.map((c) => c.low));

  return (
    <div className="flex h-full flex-col">
      {showHeader && (
        <div className="flex items-start justify-between px-1 pb-2">
          <div>
            <p className="font-mono text-xs text-ink-2">{symbol}</p>
            <p className="font-mono text-xl font-medium text-ink">${last.close.toFixed(spec.pricePrecision)}</p>
          </div>
          <div className="text-right">
            <p className={`font-mono text-xs font-medium ${changePct >= 0 ? "text-bull" : "text-bear"}`}>
              {changePct >= 0 ? "+" : ""}
              {changePct.toFixed(2)}%
            </p>
            <p className="mt-1 flex gap-2 font-mono text-[9px] text-ink-3">
              <span>O {first.open.toFixed(spec.pricePrecision)}</span>
              <span>H {dayHigh.toFixed(spec.pricePrecision)}</span>
              <span>L {dayLow.toFixed(spec.pricePrecision)}</span>
            </p>
          </div>
        </div>
      )}

      <div className="mb-1 flex gap-1 overflow-x-auto">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf.interval}
            onClick={() => setInterval(tf.interval)}
            className={`shrink-0 rounded px-2 py-1 font-mono text-[10px] font-bold ${
              interval === tf.interval ? "bg-surface-2 text-ink" : "text-ink-3 hover:bg-surface-1"
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" preserveAspectRatio="none">
          {candles.map((c, i) => {
            const x = i * candleW + candleW / 2;
            const up = c.close >= c.open;
            const bodyTop = y(Math.max(c.open, c.close));
            const bodyBottom = y(Math.min(c.open, c.close));
            return (
              <g key={i}>
                <line x1={x} x2={x} y1={y(c.high)} y2={y(c.low)} stroke={up ? "#22c55e" : "#ef4444"} strokeWidth={1} />
                <rect
                  x={x - candleW * 0.3}
                  y={bodyTop}
                  width={candleW * 0.6}
                  height={Math.max(1, bodyBottom - bodyTop)}
                  fill={up ? "#22c55e" : "#ef4444"}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
