/**
 * DataAdapter is the read-only indexed-data layer — wallet balances, portfolio
 * value, transaction/trade/order history, analytics. It is NEVER used for trade
 * execution; that always goes through PerpsAdapter/FXAdapter/SpotAdapter.
 *
 * Goldsky (indexing Arc via a deployed subgraph) is the first implementation.
 * Keeping this separate from the execution adapters means the data layer can
 * be swapped or added to (e.g. a second indexer) without touching any trading
 * logic, and trading logic never needs indexed data to function — a subgraph
 * outage degrades dashboards/history, never live trading.
 */

export interface TokenBalance {
  symbol: string;
  amount: string;
  usdValue?: string;
}

export interface PortfolioSnapshot {
  walletAddress: string;
  totalUsdValue: string;
  balances: TokenBalance[];
}

export interface IndexedTransaction {
  hash: string;
  timestamp: number;
  type: string; // e.g. "swap" | "perp_order" | "fx_settlement" | "transfer"
  summary: string;
}

export interface IndexedTrade {
  venue: string; // adapter id this trade came from, e.g. "hibachi", "curve"
  symbol: string;
  side: "buy" | "sell";
  quantity: string;
  price?: string;
  timestamp: number;
  pnl?: string;
}

export interface DataAdapter {
  id: string;
  displayName: string;
  isLive: boolean;

  getPortfolio(walletAddress: string): Promise<PortfolioSnapshot>;
  getTransactionHistory(walletAddress: string, limit?: number): Promise<IndexedTransaction[]>;
  getTradeHistory(walletAddress: string, limit?: number): Promise<IndexedTrade[]>;
}
