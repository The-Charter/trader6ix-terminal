"use client";

import { useMemo } from "react";
import { useKlines } from "@/lib/hooks";

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
}

/**
 * Hibachi's kline response shape isn't pinned down without a live API key to test
 * against, so this normalizer accepts the common variants (array-of-arrays like
 * Binance, or array-of-objects) rather than assuming one exact shape.
 */
function normalizeKlines(raw: unknown): Candle[] {
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : (raw as { klines?: unknown[] }).klines;
  if (!Array.isArray(arr)) return [];

  return arr
    .map((k): Candle | null => {
      if (Array.isArray(k)) {
        const [, open, high, low, close] = k;
        return { open: Number(open), high: Number(high), low: Number(low), close: Number(close) };
      }
      if (k && typeof k === "object") {
        const c = k as Record<string, unknown>;
        const open = Number(c.open ?? c.o);
        const high = Number(c.high ?? c.h);
        const low = Number(c.low ?? c.l);
        const close = Number(c.close ?? c.c);
        if ([open, high, low, close].every((n) => !Number.isNaN(n))) return { open, high, low, close };
      }
      return null;
    })
    .filter((c): c is Candle => c !== null);
}

export function CandlestickChart({ symbol }: { symbol: string | null }) {
  const { data, loading, error } = useKlines(symbol);
  const candles = useMemo(() => normalizeKlines(data), [data]);

  if (!symbol) {
    return <div className="flex h-full items-center justify-center text-sm text-zinc-500">Select a market to view its chart.</div>;
  }
  if (error) {
    return <div className="flex h-full items-center justify-center text-sm text-red-400">Chart unavailable — {error}</div>;
  }
  if (loading && candles.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-zinc-500">Loading chart…</div>;
  }
  if (candles.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-zinc-500">No trade history yet for this market.</div>;
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
