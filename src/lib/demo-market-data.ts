/**
 * Single source of truth for demo/simulated market prices, so every demo
 * screen (Portfolio, Watchlist, Alerts, Perps) shows numbers that agree with
 * each other instead of each generating its own random values.
 */

export interface DemoAsset {
  symbol: string;
  name: string;
  basePrice: number;
  change24hPct: number;
}

export const DEMO_ASSETS: DemoAsset[] = [
  { symbol: "BTC", name: "Bitcoin", basePrice: 103_420, change24hPct: 1.82 },
  { symbol: "ETH", name: "Ethereum", basePrice: 3_841, change24hPct: 0.94 },
  { symbol: "SOL", name: "Solana", basePrice: 182.4, change24hPct: 2.31 },
  { symbol: "USDC", name: "USD Coin", basePrice: 1.0, change24hPct: 0.0 },
  { symbol: "EURC", name: "Euro Coin", basePrice: 1.0 / 0.845, change24hPct: -0.05 },
];

export function demoPrice(symbol: string): number {
  const asset = DEMO_ASSETS.find((a) => a.symbol === symbol);
  const base = asset?.basePrice ?? 1;
  const drift = Math.sin(Date.now() / 60000 + symbol.length) * base * 0.003;
  return base + drift;
}

export function getDemoAsset(symbol: string): DemoAsset | undefined {
  return DEMO_ASSETS.find((a) => a.symbol === symbol);
}
