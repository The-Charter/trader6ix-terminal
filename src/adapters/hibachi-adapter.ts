import type { PerpsAdapter, PerpsMarket, PlacePerpsOrderInput, PerpsOrderResult, PerpsPosition, PerpsOrder } from "./perps-adapter";
import type { AdapterCandle } from "./shared-types";

// Known fiat/metal tickers — anything else is treated as crypto. Hibachi
// doesn't (as far as our docs research found) expose an explicit asset-class
// field per contract, so this is a symbol-pattern heuristic, not a confirmed
// classification from their API.
const FX_BASE_CODES = new Set(["EUR", "GBP", "AUD", "NZD", "USD", "CAD", "CHF", "JPY", "XAG", "XAU"]);

function classifyAssetClass(base: string): "crypto" | "fx" {
  return FX_BASE_CODES.has(base.toUpperCase()) ? "fx" : "crypto";
}

/** Best-guess normalizer for Hibachi's kline shape — flagged since unverified against a live key. */
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

export const hibachiAdapter: PerpsAdapter = {
  id: "hibachi",
  displayName: "Hibachi",
  isLive: true, // reachable, but see charter-terminal.md — currently returning empty bodies pending their team's response

  async getMarkets(): Promise<PerpsMarket[]> {
    const res = await fetch("/api/hibachi/exchange-info");
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to load Hibachi markets");

    const contracts: { symbol: string; status: string; underlyingSymbol?: string; settlementSymbol?: string }[] =
      json.futureContracts ?? [];

    // Surface every live contract Hibachi actually reports — not just our
    // crypto target list — so real FX perps (EUR/USD-P, GBP/USD-P, XAG/USD-P,
    // etc.) show up too, since Hibachi's own API is the source of truth for
    // what's actually tradable, not a hardcoded whitelist on our side.
    return contracts.map((c) => {
      const [base, quoteWithSuffix] = c.symbol.split("/");
      const quote = (quoteWithSuffix ?? "").replace(/-P$/, "");
      return {
        symbol: c.symbol,
        base: base ?? c.symbol,
        quote: quote || "USD",
        isLive: c.status === "LIVE",
        assetClass: classifyAssetClass(base ?? ""),
      };
    });
  },

  async getOrderbook(symbol) {
    const res = await fetch(`/api/hibachi/orderbook?symbol=${encodeURIComponent(symbol)}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to load orderbook");
    const toLevels = (rows: [string, string][]) => rows.map(([price, size]) => ({ price, size }));
    return { bids: toLevels(json.bids ?? []), asks: toLevels(json.asks ?? []) };
  },

  async getKlines(symbol, interval) {
    const res = await fetch(`/api/hibachi/klines?symbol=${encodeURIComponent(symbol)}&interval=${interval}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to load chart data");
    return normalizeKlines(json);
  },

  async getPositions(): Promise<PerpsPosition[]> {
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

  async getOpenOrders(): Promise<PerpsOrder[]> {
    const res = await fetch("/api/hibachi/account");
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to load account");
    const orders = json.orders ?? [];
    return orders.map((o: Record<string, unknown>) => ({
      id: String(o.orderId ?? o.id ?? ""),
      symbol: String(o.symbol ?? ""),
      side: o.side === "BID" ? "buy" : "sell",
      type: o.price !== undefined ? "limit" : "market",
      price: o.price !== undefined ? String(o.price) : undefined,
      quantity: String(o.quantity ?? "0"),
      status: String(o.status ?? "open"),
    }));
  },

  async placeOrder(input: PlacePerpsOrderInput): Promise<PerpsOrderResult> {
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

  async cancelOrder(orderId: string): Promise<PerpsOrderResult> {
    const res = await fetch(`/api/hibachi/order?orderId=${encodeURIComponent(orderId)}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.error ?? "Cancel failed" };
    return { ok: true };
  },

  async closePosition(symbol: string): Promise<PerpsOrderResult> {
    // Hibachi's docs don't (as far as we've confirmed) expose a dedicated
    // close-position endpoint — the standard way to close a perp position on
    // venues like this is to place an opposite-side market order for the
    // same size. We fetch the live position first rather than assume size/side.
    const accountRes = await fetch("/api/hibachi/account");
    const accountJson = await accountRes.json();
    if (!accountRes.ok) return { ok: false, error: accountJson.error ?? "Failed to load position" };

    const position = (accountJson.account?.positions ?? []).find((p: Record<string, unknown>) => p.symbol === symbol);
    if (!position) return { ok: false, error: "No open position for that symbol." };

    const quantity = Math.abs(Number(position.quantity ?? 0));
    const closingSide = Number(position.quantity ?? 0) >= 0 ? "sell" : "buy";

    return this.placeOrder(
      { symbol, side: closingSide, type: "market", quantity: String(quantity) },
      ""
    );
  },
};
