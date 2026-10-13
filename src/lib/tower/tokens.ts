/**
 * Tower-facing view of the active Arc token registry.
 *
 * The registry itself lives in `@/lib/arc-tokens` so the UI, the swap ticket
 * and the server all agree on addresses and decimals for the selected network.
 */

import { ARC_TOKENS, getArcToken, isArcTokenSymbol, type ArcToken } from "@/lib/arc-tokens";

export type TowerToken = ArcToken;
export type TowerTokenSymbol = string;

/** Tokens the swap ticket offers for the active network. */
export const TOWER_TOKENS: ArcToken[] = ARC_TOKENS;

export function getTowerToken(symbol: string): TowerToken {
  return getArcToken(symbol);
}

export function isTowerToken(symbol: string): boolean {
  return isArcTokenSymbol(symbol);
}
