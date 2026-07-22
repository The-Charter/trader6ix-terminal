"use client";

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
      <span className="text-zinc-400">{size}</span>
    </div>
  );
}

export function OrderbookPanel({ symbol }: { symbol: string | null }) {
  const { data, loading, error } = useOrderbook(symbol);

  if (!symbol) {
    return <div className="p-4 text-sm text-zinc-500">Select a market to view its order book.</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-red-400">
        Order book unavailable — {error}
      </div>
    );
  }

  if (loading && !data) {
    return <div className="p-4 text-sm text-zinc-500">Loading order book…</div>;
  }

  if (!data || (data.bids.length === 0 && data.asks.length === 0)) {
    return <div className="p-4 text-sm text-zinc-500">No open orders on this market right now.</div>;
  }

  const maxSize = Math.max(
    ...data.bids.map(([, s]) => parseFloat(s)),
    ...data.asks.map(([, s]) => parseFloat(s)),
    0
  );

  return (
    <div className="flex flex-col text-xs">
      <div className="flex justify-between px-3 py-1 text-zinc-500">
        <span>Price</span>
        <span>Size</span>
      </div>
      <div className="flex flex-col-reverse">
        {data.asks.slice(0, 12).map(([price, size]) => (
          <Row key={`a-${price}`} price={price} size={size} side="ask" maxSize={maxSize} />
        ))}
      </div>
      <div className="my-1 border-t border-zinc-800" />
      <div>
        {data.bids.slice(0, 12).map(([price, size]) => (
          <Row key={`b-${price}`} price={price} size={size} side="bid" maxSize={maxSize} />
        ))}
      </div>
    </div>
  );
}
