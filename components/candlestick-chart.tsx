"use client";

import type { PerpsAdapter } from "@/lib/adapters/perps-adapter";
import { useKlines } from "@/lib/hooks";

export function CandlestickChart({ adapter, symbol }: { adapter: PerpsAdapter; symbol: string | null }) {
  const { data: candles, loading, error } = useKlines(adapter, symbol);

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

  const min = Math.min(...candles.map((c) => c.low));
  const max = Math.max(...candles.map((c) => c.high));
  const range = max - min || 1;
  const width = 800;
  const height = 320;
  const candleW = width / candles.length;

  const y = (price: number) => height - ((price - min) / range) * height;

  return (
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
  );
}
