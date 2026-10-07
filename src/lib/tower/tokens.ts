/**
 * Tokens currently configured for Tower on Arc Testnet. Add future Tower
 * assets here; the selector, balance display, and quote flow read this list.
 *
 * Addresses verified against Tower's official docs listing of Arc Testnet
 * token contracts (docs.tower.exchange → Testnet & Faucet).
 */
export const TOWER_TOKENS = [
  {
    symbol: "EURC",
    name: "Euro Coin",
    address: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
    decimals: 6,
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x3600000000000000000000000000000000000000",
    decimals: 6,
  },
] as const;

export type TowerTokenSymbol = (typeof TOWER_TOKENS)[number]["symbol"];
export type TowerToken = (typeof TOWER_TOKENS)[number];

export function getTowerToken(symbol: string): TowerToken {
  const token = TOWER_TOKENS.find((item) => item.symbol === symbol);
  if (!token) throw new Error(`Unsupported Tower token: ${symbol}`);
  return token;
}
