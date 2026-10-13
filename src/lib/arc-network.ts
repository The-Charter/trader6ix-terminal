/**
 * Single source of truth for the Arc network the terminal talks to.
 *
 * Arc Mainnet is chain 5042, Arc Testnet is 5042002. Switching networks is an
 * env-only change (NEXT_PUBLIC_ARC_CHAIN_ID plus the RPC/explorer URLs) — no
 * module should hardcode a chain id, an RPC host, or a token address again.
 *
 * Mainnet verification (2026-10): rpc.mainnet.arc.io answers eth_chainId with
 * 0x13b2 (5042) and builder.tower routes USDC/EURC/cirBTC on that chain.
 */

function envValue(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim() !== "" ? value.trim() : fallback;
}

function envChainId(name: string, fallback: number): number {
  const parsed = Number(envValue(name, String(fallback)));
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const ARC_MAINNET_CHAIN_ID = 5042;
export const ARC_TESTNET_CHAIN_ID = 5042002;

export const ARC_CHAIN_ID = envChainId("NEXT_PUBLIC_ARC_CHAIN_ID", ARC_MAINNET_CHAIN_ID);
export const IS_ARC_MAINNET = ARC_CHAIN_ID === ARC_MAINNET_CHAIN_ID;

/** Human label used in UI copy and error messages ("Arc" vs "Arc Testnet"). */
export const ARC_CHAIN_NAME = IS_ARC_MAINNET ? "Arc" : "Arc Testnet";

/** Privy/viem-style slug for the same network. */
export const ARC_NETWORK_SLUG = IS_ARC_MAINNET ? "arc" : "arc-testnet";

export const ARC_RPC_URL = envValue(
  "NEXT_PUBLIC_ARC_RPC_URL",
  IS_ARC_MAINNET ? "https://rpc.mainnet.arc.io" : "https://rpc.testnet.arc.network"
);

export const ARC_EXPLORER_URL = envValue(
  "NEXT_PUBLIC_ARC_EXPLORER_URL",
  IS_ARC_MAINNET ? "https://explorer.arc.io" : "https://testnet.arcscan.app"
);

/**
 * The Circle faucet only exists for testnet. Empty on mainnet so the UI hides
 * every faucet entry point rather than sending users to a dead link.
 */
export const ARC_FAUCET_URL = IS_ARC_MAINNET ? "" : envValue("NEXT_PUBLIC_FAUCET_URL", "https://faucet.circle.com");

export function arcExplorerAddressUrl(address: string): string {
  return `${ARC_EXPLORER_URL}/address/${address}`;
}

export function arcExplorerTxUrl(hash: string): string {
  return `${ARC_EXPLORER_URL}/tx/${hash}`;
}
