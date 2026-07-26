/**
 * Every trading venue Trader6ix connects to — whether it's an off-chain matching
 * engine with a REST API (like Hibachi) or a fully onchain perp protocol on some
 * EVM chain — implements this same interface. The UI only ever talks to an
 * `ExchangeAdapter`; it never knows or cares which venue is behind it.
 *
 * This is the MT4-style "broker abstraction": one terminal, swappable backend.
 */

export interface AdapterMarket {
  /** Venue-native symbol, e.g. "BTC/USDT-P" for Hibachi or a contract address for onchain venues. */
  symbol: string;
  base: string;
  quote: string;
  kind: "spot" | "perps";
  isLive: boolean;
}

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

export interface AdapterPosition {
  symbol: string;
  side: "long" | "short";
  size: string;
  entryPrice: string;
  unrealizedPnl?: string;
}

export interface AdapterOrder {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  price?: string;
  quantity: string;
  status: string;
}

export interface PlaceOrderInput {
  symbol: string;
  side: "buy" | "sell";
  quantity: string;
  price?: string; // omit for market orders
}

export interface PlaceOrderResult {
  ok: boolean;
  orderId?: string;
  error?: string;
}

/**
 * Adapters come in two flavors:
 *  - "api": an off-chain venue reached via REST (Hibachi today). Order placement
 *    is a signed request sent to their matching engine.
 *  - "onchain": a venue where reads/writes go straight to a smart contract on
 *    some EVM chain via the connected wallet. No custodial API key involved —
 *    the user's own wallet signs every transaction.
 */
export type AdapterKind = "api" | "onchain";

export interface ExchangeAdapter {
  id: string;
  displayName: string;
  kind: AdapterKind;
  /** For onchain adapters, which chain this venue's contracts live on. */
  chainId?: number;
  /** Whether this venue supports spot, perps, or both. */
  supports: ("spot" | "perps")[];

  getMarkets(kind: "spot" | "perps"): Promise<AdapterMarket[]>;
  getOrderbook(symbol: string): Promise<AdapterOrderbook>;
  getKlines(symbol: string, interval: string): Promise<AdapterCandle[]>;
  getPositions(walletAddress: string): Promise<AdapterPosition[]>;
  getOpenOrders(walletAddress: string): Promise<AdapterOrder[]>;
  placeOrder(input: PlaceOrderInput, walletAddress: string): Promise<PlaceOrderResult>;
  cancelOrder(orderId: string, walletAddress: string): Promise<PlaceOrderResult>;
}
