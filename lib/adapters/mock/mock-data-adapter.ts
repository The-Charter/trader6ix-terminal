import type { DataAdapter, PortfolioSnapshot, IndexedTransaction, IndexedTrade } from "../data-adapter";
import { demoPrice } from "@/lib/demo-market-data";

/**
 * Simulated indexed-data layer for demo mode. Implements the exact same
 * DataAdapter interface Goldsky will implement for real — when Goldsky is
 * ready, swap this out in the registry and every consuming page keeps
 * working unchanged.
 */

const DEMO_TX: IndexedTransaction[] = [
  { hash: "demo-tx-1", timestamp: Date.now() - 1000 * 60 * 12, type: "perp_order", summary: "Opened BTC-PERP long, 0.05 BTC" },
  { hash: "demo-tx-2", timestamp: Date.now() - 1000 * 60 * 55, type: "swap", summary: "Swapped 500 USDC → 422.5 EURC" },
  { hash: "demo-tx-3", timestamp: Date.now() - 1000 * 60 * 60 * 3, type: "perp_order", summary: "Closed ETH-PERP short, +$42.10 PnL" },
  { hash: "demo-tx-4", timestamp: Date.now() - 1000 * 60 * 60 * 8, type: "transfer", summary: "Received 1,000 USDC (faucet)" },
  { hash: "demo-tx-5", timestamp: Date.now() - 1000 * 60 * 60 * 26, type: "fx_settlement", summary: "FX settlement: 250 USDC → 211.25 EURC" },
];

const DEMO_TRADES: IndexedTrade[] = [
  { venue: "mock-perps", symbol: "BTC-PERP", side: "buy", quantity: "0.05", price: "103420", timestamp: Date.now() - 1000 * 60 * 12 },
  { venue: "mock-spot", symbol: "USDC/EURC", side: "sell", quantity: "500", price: "0.845", timestamp: Date.now() - 1000 * 60 * 55 },
  { venue: "mock-perps", symbol: "ETH-PERP", side: "sell", quantity: "0.3", price: "3841", timestamp: Date.now() - 1000 * 60 * 60 * 3, pnl: "42.10" },
  { venue: "mock-perps", symbol: "SOL-PERP", side: "buy", quantity: "10", price: "180.10", timestamp: Date.now() - 1000 * 60 * 60 * 30, pnl: "-8.40" },
];

export const mockDataAdapter: DataAdapter = {
  id: "mock-data",
  displayName: "Demo Portfolio Data",
  isLive: true,

  async getPortfolio(walletAddress: string): Promise<PortfolioSnapshot> {
    const balances = [
      { symbol: "USDC", amount: "4,820.00", usdValue: (4820).toFixed(2) },
      { symbol: "EURC", amount: "1,240.30", usdValue: (1240.3 / 0.845).toFixed(2) },
      { symbol: "BTC", amount: "0.05", usdValue: (0.05 * demoPrice("BTC")).toFixed(2) },
      { symbol: "ETH", amount: "0.3", usdValue: (0.3 * demoPrice("ETH")).toFixed(2) },
    ];
    const totalUsdValue = balances.reduce((sum, b) => sum + parseFloat(b.usdValue ?? "0"), 0).toFixed(2);
    return { walletAddress, totalUsdValue, balances };
  },

  async getTransactionHistory(_walletAddress: string, limit = 20): Promise<IndexedTransaction[]> {
    return DEMO_TX.slice(0, limit);
  },

  async getTradeHistory(_walletAddress: string, limit = 20): Promise<IndexedTrade[]> {
    return DEMO_TRADES.slice(0, limit);
  },
};
