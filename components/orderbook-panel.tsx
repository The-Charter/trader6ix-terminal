"use client";

import type { PerpsAdapter } from "@/lib/adapters/perps-adapter";
import { useOrderbook } from "@/lib/hooks";

function Row({ price, size, side, maxSize }: { price: string; size: string; side: "bid" | "ask"; maxSize: number }) {
  const sizeNum = parseFloat(size);
  const widthPct = maxSize > 0 ? Math.min(100, (sizeNum / maxSize) * 100) : 0;
  return (
    <div className="relative flex justify-between px-3 py-0.5 font-mono text-xs">
      <div
        className={`absolute inset-y-0 right-0 ${side === "bid" ? "bg-bull/10" : "bg-bear/10"}`}
        style={{ width: `${widthPct}%` }}
      />
      <span className={side === "bid" ? "text-bull" : "text-bear"}>{price}</span>
      <span className="text-ink-2">{size}</span>
    </div>
  );
}

export function OrderbookPanel({ adapter, symbol }: { adapter: PerpsAdapter; symbol: string | null }) {
  const { data, loading, error } = useOrderbook(adapter, symbol);

  if (!symbol) {
    return <div className="p-4 text-sm text-ink-3">Select a market to view its order book.</div>;
  }

  if (error) {
    return <div className="p-4 text-sm text-bear">Order book unavailable — {error}</div>;
  }

  if (loading && !data) {
    return <div className="p-4 text-sm text-ink-3">Loading order book from {adapter.displayName}…</div>;
  }

  if (!data || (data.bids.length === 0 && data.asks.length === 0)) {
    return <div className="p-4 text-sm text-ink-3">No open orders on this market right now.</div>;
  }

  const maxSize = Math.max(
    ...data.bids.map((b) => parseFloat(b.size)),
    ...data.asks.map((a) => parseFloat(a.size)),
    0
  );

  return (
    <div className="flex flex-col text-xs">
      <div className="flex justify-between px-3 py-1 text-ink-3">
        <span>Price</span>
        <span>Size</span>
      </div>
      <div className="flex flex-col-reverse">
        {data.asks.slice(0, 12).map((a, i) => (
          <Row key={`a-${i}`} price={a.price} size={a.size} side="ask" maxSize={maxSize} />
        ))}
      </div>
      <div className="my-1 border-t border-border" />
      <div>
        {data.bids.slice(0, 12).map((b, i) => (
          <Row key={`b-${i}`} price={b.price} size={b.size} side="bid" maxSize={maxSize} />
        ))}
      </div>
    </div>
  );
}
