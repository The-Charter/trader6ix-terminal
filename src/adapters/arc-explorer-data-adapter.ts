import type { DataAdapter, PortfolioSnapshot, IndexedTransaction, IndexedTrade } from "./data-adapter";
import { apiUrl } from "@/lib/api-base";

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
    const res = await fetch(apiUrl(`/api/data/portfolio?address=${encodeURIComponent(walletAddress)}`));
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to load portfolio");
    return json as PortfolioSnapshot;
  },

  async getTransactionHistory(walletAddress: string, limit = 20): Promise<IndexedTransaction[]> {
    const res = await fetch(apiUrl(`/api/data/activity?address=${encodeURIComponent(walletAddress)}`));
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to load activity");
    return (json as IndexedTransaction[]).slice(0, limit);
  },

  async getTradeHistory(walletAddress: string, limit = 20): Promise<IndexedTrade[]> {
    const res = await fetch(apiUrl(`/api/data/trades?address=${encodeURIComponent(walletAddress)}`));
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to load trades");
    return (json as IndexedTrade[]).slice(0, limit);
  },
};
