import type {
  ExchangeAdapter,
  AdapterMarket,
  AdapterOrderbook,
  AdapterCandle,
  AdapterPosition,
  AdapterOrder,
  PlaceOrderInput,
  PlaceOrderResult,
} from "./types";
import { TARGET_MARKETS } from "@/lib/markets";

/** Best-guess normalizer for Hibachi's kline shape — see candlestick-chart.tsx for the same logic. */
function normalizeKlines(raw: unknown): AdapterCandle[] {
  const arr = Array.isArray(raw) ? raw : (raw as { klines?: unknown[] })?.klines;
  if (!Array.isArray(arr)) return [];
  return arr
    .map((k, i): AdapterCandle | null => {
      if (Array.isArray(k)) {
        const [time, open, high, low, close] = k;
        return { time: Number(time) || i, open: Number(open), high: Number(high), low: Number(low), close: Number(close) };
      }
      if (k && typeof k === "object") {
        const c = k as Record<string, unknown>;
        const open = Number(c.open ?? c.o);
        const high = Number(c.high ?? c.h);
        const low = Number(c.low ?? c.l);
        const close = Number(c.close ?? c.c);
        const time = Number(c.time ?? c.t ?? i);
        if ([open, high, low, close].every((n) => !Number.isNaN(n))) return { time, open, high, low, close };
      }
      return null;
    })
    .filter((c): c is AdapterCandle => c !== null);
}

export const hibachiAdapter: ExchangeAdapter = {
  id: "hibachi",
  displayName: "Hibachi",
  kind: "api",
  supports: ["spot", "perps"],

  async getMarkets(kind) {
    const res = await fetch("/api/hibachi/exchange-info");
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to load Hibachi markets");

    const live = new Set(
      (json.futureContracts ?? [])
        .filter((c: { status: string }) => c.status === "LIVE")
        .map((c: { symbol: string }) => c.symbol)
    );

    const out: AdapterMarket[] = TARGET_MARKETS.map((m) => {
      const symbol = kind === "spot" ? m.spotSymbol : m.perpSymbol;
      return { symbol, base: m.base, quote: m.quote, kind, isLive: live.has(symbol) };
    });
    return out;
  },

  async getOrderbook(symbol) {
    const res = await fetch(`/api/hibachi/orderbook?symbol=${encodeURIComponent(symbol)}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to load orderbook");
    const toLevels = (rows: [string, string][]): AdapterOrderbook["bids"] =>
      rows.map(([price, size]) => ({ price, size }));
    return { bids: toLevels(json.bids ?? []), asks: toLevels(json.asks ?? []) };
  },

  async getKlines(symbol, interval) {
    const res = await fetch(`/api/hibachi/klines?symbol=${encodeURIComponent(symbol)}&interval=${interval}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to load chart data");
    return normalizeKlines(json);
  },

  async getPositions(): Promise<AdapterPosition[]> {
    const res = await fetch("/api/hibachi/account");
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to load account");
    const positions = json.account?.positions ?? [];
    return positions.map((p: Record<string, unknown>) => ({
      symbol: String(p.symbol ?? ""),
      side: Number(p.quantity ?? 0) >= 0 ? "long" : "short",
      size: String(p.quantity ?? "0"),
      entryPrice: String(p.entryPrice ?? "0"),
      unrealizedPnl: p.unrealizedPnl !== undefined ? String(p.unrealizedPnl) : undefined,
    }));
  },

  async getOpenOrders(): Promise<AdapterOrder[]> {
    const res = await fetch("/api/hibachi/account");
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to load account");
    const orders = json.orders ?? [];
    return orders.map((o: Record<string, unknown>) => ({
      id: String(o.orderId ?? o.id ?? ""),
      symbol: String(o.symbol ?? ""),
      side: o.side === "BID" ? "buy" : "sell",
      price: o.price !== undefined ? String(o.price) : undefined,
      quantity: String(o.quantity ?? "0"),
      status: String(o.status ?? "open"),
    }));
  },

  async placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
    // contractId must be resolved from a live getMarkets() call by the caller;
    // the Hibachi route accepts it directly since it needs the numeric contract id.
    const res = await fetch("/api/hibachi/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol: input.symbol,
        side: input.side === "buy" ? "BID" : "ASK",
        quantity: input.quantity,
        price: input.price,
        maxFeesPercent: 0.2,
      }),
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.error ?? "Order failed" };
    return { ok: true, orderId: json.orderId };
  },

  async cancelOrder(orderId: string): Promise<PlaceOrderResult> {
    const res = await fetch(`/api/hibachi/order?orderId=${encodeURIComponent(orderId)}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.error ?? "Cancel failed" };
    return { ok: true };
  },
};
