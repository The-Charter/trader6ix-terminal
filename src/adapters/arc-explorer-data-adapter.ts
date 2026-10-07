import type { DataAdapter, PortfolioSnapshot, IndexedTransaction, IndexedTrade } from "./data-adapter";

/**
 * Reads Arc Testnet balances and activity directly from the Arc explorer
 * (Blockscout) REST API — no third-party indexer account required. Queries are
 * proxied through /api/data/* so the browser never calls the explorer directly
 * and USD values are computed server-side.
 */
export const arcExplorerDataAdapter: DataAdapter = {
  id: "arc-explorer",
  displayName: "Arc Explorer",
  isLive: true,

  async getPortfolio(walletAddress: string): Promise<PortfolioSnapshot> {
    const res = await fetch(`/api/data/portfolio?address=${encodeURIComponent(walletAddress)}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to load portfolio");
    return json as PortfolioSnapshot;
  },

  async getTransactionHistory(walletAddress: string, limit = 20): Promise<IndexedTransaction[]> {
    const res = await fetch(`/api/data/activity?address=${encodeURIComponent(walletAddress)}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to load activity");
    return (json as IndexedTransaction[]).slice(0, limit);
  },

  async getTradeHistory(): Promise<IndexedTrade[]> {
    // Trade-level history (entry/exit with PnL) needs event decoding this
    // explorer-backed adapter does not do yet. Balances and transfers are live.
    return [];
  },
};
