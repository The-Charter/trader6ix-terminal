/**
 * Arc token registry, keyed to the network selected in `arc-network.ts`.
 *
 * Two related lists live here:
 *  - `ARC_TOKENS`        — assets the swap ticket can trade (exact on-chain
 *                          address + decimals, verified against the chain).
 *  - `TRUSTED_ARC_TOKENS`— allowlist used to filter balances and activity so
 *                          spam/airdrop tokens (and symbol clones, e.g. a fake
 *                          "USDC") never render as if they were real.
 *
 * Mainnet (chain 5042) intentionally contains only the assets Tower's mainnet
 * venues actually route — USDC, EURC and cirBTC. Addresses and decimals were
 * read from rpc.mainnet.arc.io: USDC 6, EURC 6, cirBTC 8.
 */

import { IS_ARC_MAINNET } from "./arc-network";

export interface ArcToken {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
}

const MAINNET_TOKENS: ArcToken[] = [
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x3600000000000000000000000000000000000000",
    decimals: 6,
  },
  {
    symbol: "EURC",
    name: "Euro Coin",
    address: "0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1",
    decimals: 6,
  },
  {
    symbol: "cirBTC",
    name: "Circle Wrapped Bitcoin",
    address: "0x171A4217b86A807A64eB94757Db6849fb4bDbAA0",
    decimals: 8,
  },
];

/** Tower's testnet venues route USDC, EURC, USDT and cirBTC. */
const TESTNET_TOKENS: ArcToken[] = [
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x3600000000000000000000000000000000000000",
    decimals: 6,
  },
  {
    symbol: "EURC",
    name: "Euro Coin",
    address: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
    decimals: 6,
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    address: "0x175cdb1d338945f0d851a741ccf787d343e57952",
    decimals: 18,
  },
  {
    symbol: "cirBTC",
    name: "Circle Wrapped Bitcoin",
    address: "0xf0c4a4ce82a5746abaad9425360ab04fbba432bf",
    decimals: 8,
  },
];

/**
 * Extra testnet contracts we still trust for balances, but do not route.
 * Decimals read from rpc.testnet.arc.network.
 */
const TESTNET_BALANCE_ONLY: ArcToken[] = [
  { symbol: "USYC", name: "USYC", address: "0xe9185f0c5f296ed1797aae4238d26ccabeadb86c", decimals: 6 },
  { symbol: "QTM", name: "QTM", address: "0xcd304d2a421bfed31d45f0054af8e8a6a4cf3eae", decimals: 18 },
  { symbol: "SWPRC", name: "SWPRC", address: "0xbe7477bf91526fc9988c8f33e91b6db687119d45", decimals: 6 },
  { symbol: "SYN", name: "SYN", address: "0xc5124c846c6e6307986988dfb7e743327aa05f19", decimals: 18 },
  { symbol: "cNGN", name: "cNGN", address: "0x9a9c18a371d98200fe910f62c45875f1abb68d20", decimals: 6 },
  { symbol: "QCAD", name: "QCAD", address: "0x23d7cffd0876f3abb6b074287ba2aeefbc83825d", decimals: 6 },
];

export const ARC_TOKENS: ArcToken[] = IS_ARC_MAINNET ? MAINNET_TOKENS : TESTNET_TOKENS;

/** Everything we are willing to show a balance for (swap list + trusted extras). */
export const ARC_BALANCE_TOKENS: ArcToken[] = IS_ARC_MAINNET
  ? MAINNET_TOKENS
  : [...TESTNET_TOKENS, ...TESTNET_BALANCE_ONLY];

const BALANCE_TOKENS: ArcToken[] = ARC_BALANCE_TOKENS;

/** lowercase contract address -> display symbol. */
export const TRUSTED_ARC_TOKENS: Record<string, string> = Object.fromEntries(
  BALANCE_TOKENS.map((token) => [token.address.toLowerCase(), token.symbol])
);

export function isTrustedArcToken(address: string): boolean {
  return TRUSTED_ARC_TOKENS[address.toLowerCase()] !== undefined;
}

export function getArcToken(symbol: string): ArcToken {
  const token = ARC_TOKENS.find((item) => item.symbol.toLowerCase() === symbol.toLowerCase());
  if (!token) throw new Error(`Unsupported ${IS_ARC_MAINNET ? "Arc" : "Arc Testnet"} token: ${symbol}`);
  return token;
}

export function isArcTokenSymbol(symbol: string): boolean {
  return ARC_TOKENS.some((item) => item.symbol.toLowerCase() === symbol.toLowerCase());
}
