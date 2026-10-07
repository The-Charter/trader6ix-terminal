/**
 * Shared primitives used across all four adapter domains (Perps, FX, Spot, Data).
 * Trader6ix's architecture: the UI never talks to Hibachi, Circle, Curve, or
 * Goldsky directly — it talks to one of these four interfaces, and a concrete
 * adapter (HibachiAdapter, StableFXAdapter, CurveAdapter, GoldskyDataAdapter)
 * implements it. Swapping or adding a venue means writing one new adapter file,
 * never touching a component.
 */

export interface OrderbookLevel {
  price: string;
  size: string;
}

export interface AdapterOrderbook {
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
}

export interface AdapterCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}
