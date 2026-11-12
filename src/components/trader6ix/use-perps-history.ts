"use client";

import { PERPS_TRADING_AVAILABLE, perpsVenueLabel } from "@/lib/perps-provider";

/** One perpetuals history record (positions, orders, realised PnL). */
export interface PerpsHistoryItem {
  id: string;
  symbol: string;
  side: "long" | "short";
  kind: "opened" | "closed" | "order";
  size: string;
  price?: string;
  realisedPnl?: string;
  timestamp: number;
}

export interface PerpsHistory {
  /** False until the perpetuals provider is operational for users. */
  available: boolean;
  venue: string;
  items: PerpsHistoryItem[];
}

/**
 * Perpetuals history, read ONLY from the perpetuals provider.
 *
 * It deliberately does not touch the spot swap feed (`usePortfolioData`): spot
 * swaps never appear here. Hibachi trading is not live, so there is no source to
 * query and the list is empty by design, never mocked. When the integration
 * ships, fetch from the provider here and set `PERPS_TRADING_AVAILABLE`.
 */
export function usePerpsHistory(): PerpsHistory {
  return { available: PERPS_TRADING_AVAILABLE, venue: perpsVenueLabel(), items: [] };
}
