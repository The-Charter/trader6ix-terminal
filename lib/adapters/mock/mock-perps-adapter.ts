import type {
  PerpsAdapter,
  PerpsMarket,
  PerpsPosition,
  PerpsOrder,
  PlacePerpsOrderInput,
  PerpsOrderResult,
} from "../perps-adapter";
import type { AdapterOrderbook, AdapterCandle } from "../shared-types";

/**
 * Simulated perpetual futures venue for demo mode. Nothing here touches a
 * blockchain or a real API — prices drift with a seeded random walk, and
 * placing an "order" just mutates in-memory state for this browser session.
 * Every result returned is clearly a demo artifact (order ids prefixed
 * "demo-", etc.) so nothing here could be mistaken for a real fill.
 */

const DEMO_MARKETS: Record<string, { base: string; price: number }> = {
  "BTC-PERP": { base: "BTC", price: 103_420 },
  "ETH-PERP": { base: "ETH", price: 3_841 },
  "SOL-PERP": { base: "SOL", price: 182.4 },
};

// Simple in-memory session state — resets on page reload, exactly like a demo should.
let positions: PerpsPosition[] = [];
let orders: PerpsOrder[] = [];
let orderCounter = 0;

function currentPrice(symbol: string): number {
  const base = DEMO_MARKETS[symbol]?.price ?? 100;
  // Small deterministic-ish drift so the chart/orderbook aren't perfectly static
  const drift = Math.sin(Date.now() / 60000) * base * 0.004;
  return base + drift;
}

const INTERVAL_MS: Record<string, number> = {
  "1m": 60_000,
  "5m": 5 * 60_000,
  "15m": 15 * 60_000,
  "1h": 60 * 60_000,
  "4h": 4 * 60 * 60_000,
  "1d": 24 * 60 * 60_000,
  "1w": 7 * 24 * 60 * 60_000,
};

function generateCandles(symbol: string, interval = "5m"): AdapterCandle[] {
  const base = DEMO_MARKETS[symbol]?.price ?? 100;
  const stepMs = INTERVAL_MS[interval] ?? INTERVAL_MS["5m"];
  // Wider timeframes get proportionally more volatility per candle, same as real markets.
  const volatilityScale = Math.sqrt(stepMs / INTERVAL_MS["5m"]);
  const candles: AdapterCandle[] = [];
  let price = base * 0.99;
  const now = Date.now();
  for (let i = 0; i < 60; i++) {
    const open = price;
    const move = (Math.random() - 0.48) * base * 0.003 * volatilityScale;
    const close = open + move;
    const high = Math.max(open, close) + Math.random() * base * 0.001 * volatilityScale;
    const low = Math.min(open, close) - Math.random() * base * 0.001 * volatilityScale;
    candles.push({ time: now - (60 - i) * stepMs, open, high, low, close });
    price = close;
  }
  return candles;
}

function generateOrderbook(symbol: string): AdapterOrderbook {
  const mid = currentPrice(symbol);
  const bids = Array.from({ length: 12 }, (_, i) => ({
    price: (mid * (1 - 0.0005 * (i + 1))).toFixed(2),
    size: (Math.random() * 2 + 0.1).toFixed(4),
  }));
  const asks = Array.from({ length: 12 }, (_, i) => ({
    price: (mid * (1 + 0.0005 * (i + 1))).toFixed(2),
    size: (Math.random() * 2 + 0.1).toFixed(4),
  }));
  return { bids, asks };
}

export const mockPerpsAdapter: PerpsAdapter = {
  id: "mock-perps",
  displayName: "Demo Perpetuals",
  isLive: true,

  async getMarkets(): Promise<PerpsMarket[]> {
    return Object.entries(DEMO_MARKETS).map(([symbol, m]) => ({
      symbol,
      base: m.base,
      quote: "USD",
      isLive: true,
      maxLeverage: 20,
    }));
  },

  async getOrderbook(symbol: string) {
    return generateOrderbook(symbol);
  },

  async getKlines(symbol: string, interval: string) {
    return generateCandles(symbol, interval);
  },

  async getPositions(): Promise<PerpsPosition[]> {
    return positions.map((p) => {
      const price = currentPrice(p.symbol);
      const entry = parseFloat(p.entryPrice);
      const size = parseFloat(p.size);
      const pnl = p.side === "long" ? (price - entry) * size : (entry - price) * size;
      return { ...p, markPrice: price.toFixed(2), unrealizedPnl: pnl.toFixed(2) };
    });
  },

  async getOpenOrders(): Promise<PerpsOrder[]> {
    return orders;
  },

  async placeOrder(input: PlacePerpsOrderInput): Promise<PerpsOrderResult> {
    orderCounter += 1;
    const orderId = `demo-${orderCounter}`;
    const price = input.price ? parseFloat(input.price) : currentPrice(input.symbol);
    const leverage = input.leverage ?? 1;

    // Market orders fill immediately in the demo; limit/stop orders sit as open orders.
    if (input.type === "market") {
      positions.push({
        symbol: input.symbol,
        side: input.side === "buy" ? "long" : "short",
        size: input.quantity,
        entryPrice: price.toFixed(2),
        leverage,
        liquidationPrice:
          input.side === "buy" ? (price * (1 - 0.9 / leverage)).toFixed(2) : (price * (1 + 0.9 / leverage)).toFixed(2),
        marginUsed: ((parseFloat(input.quantity) * price) / leverage).toFixed(2),
        stopLoss: input.stopLoss,
        takeProfit: input.takeProfit,
      });
    } else {
      orders.push({
        id: orderId,
        symbol: input.symbol,
        side: input.side,
        type: input.type,
        price: input.price,
        quantity: input.quantity,
        status: "open",
      });
    }

    return { ok: true, orderId };
  },

  async cancelOrder(orderId: string): Promise<PerpsOrderResult> {
    orders = orders.filter((o) => o.id !== orderId);
    return { ok: true };
  },

  async closePosition(symbol: string): Promise<PerpsOrderResult> {
    const existed = positions.some((p) => p.symbol === symbol);
    positions = positions.filter((p) => p.symbol !== symbol);
    return existed ? { ok: true } : { ok: false, error: "No open position for that symbol." };
  },
};
