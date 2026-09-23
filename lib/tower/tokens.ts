/**
 * Tokens currently configured for Tower on Arc Testnet. Add future Tower
 * assets here; the selector, balance display, and quote flow read this list.
 */
export const TOWER_TOKENS = [
  {
    symbol: "EURC",
    name: "Euro Coin",
    address: "0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1",
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
