import type { AdapterOrderbook, AdapterCandle } from "./shared-types";

export interface PerpsMarket {
  symbol: string;
  base: string;
  quote: string;
  isLive: boolean;
  maxLeverage?: number;
  assetClass: "crypto" | "fx";
}

export interface PerpsPosition {
  symbol: string;
  side: "long" | "short";
  size: string;
  entryPrice: string;
  markPrice?: string;
  leverage?: number;
  liquidationPrice?: string;
  unrealizedPnl?: string;
  marginUsed?: string;
  stopLoss?: string;
  takeProfit?: string;
}

export interface PerpsOrder {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  type: "market" | "limit" | "stop";
  price?: string;
  quantity: string;
  status: string;
}

export interface PlacePerpsOrderInput {
  symbol: string;
  side: "buy" | "sell";
  type: "market" | "limit" | "stop";
  quantity: string;
  price?: string; // required for limit/stop orders — limit price or stop trigger price
  leverage?: number;
  stopLoss?: string;
  takeProfit?: string;
}

export interface PerpsOrderResult {
  ok: boolean;
  orderId?: string;
  error?: string;
}

/**
 * Every perpetual futures venue implements this. Hibachi is the first
 * (HibachiAdapter); a second protocol (Avantis, Hyperliquid, etc.) becomes
 * adapter #2 with zero UI changes.
 */
export interface PerpsAdapter {
  id: string;
  displayName: string;
  chainId?: number;
  isLive: boolean; // false = shown in venue picker but marked "coming soon"

  getMarkets(): Promise<PerpsMarket[]>;
  getOrderbook(symbol: string): Promise<AdapterOrderbook>;
  getKlines(symbol: string, interval: string): Promise<AdapterCandle[]>;
  getPositions(walletAddress: string): Promise<PerpsPosition[]>;
  getOpenOrders(walletAddress: string): Promise<PerpsOrder[]>;
  placeOrder(input: PlacePerpsOrderInput, walletAddress: string): Promise<PerpsOrderResult>;
  cancelOrder(orderId: string, walletAddress: string): Promise<PerpsOrderResult>;
  /** Closes an open position outright (as distinct from cancelling a pending order). */
  closePosition(symbol: string, walletAddress: string): Promise<PerpsOrderResult>;
}
