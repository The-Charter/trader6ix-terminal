/**
 * Tower Exchange API types.
 *
 * IMPORTANT — verification status: the exact endpoint paths, request/response
 * field names, and auth scheme below come from the integration spec provided
 * alongside the API key, NOT from a publicly-verifiable API reference —
 * devs.tower.exchange redirects to an authenticated dashboard I couldn't
 * access independently. Treat these shapes as "best available information,
 * unconfirmed" until a real quote request succeeds and we can see the actual
 * response. If fields are named differently in practice, this file is the
 * one place that needs updating — nothing else in the app assumes Tower's
 * exact wire format, since TowerAdapter normalizes into SpotAdapter's types.
 */

export interface TowerQuoteRequest {
  inputToken: string; // contract address
  outputToken: string; // contract address
  inputAmount: string; // atomic units, as a string (avoid float precision loss) — CONFIRMED field name via live 400 error response
  slippage: number; // e.g. 0.005 for 0.5%
  chainId: number;
}

export interface TowerRouteHop {
  dexId: string;
  dexName: string;
  dexRouter: string;
  path: string[];
  feeTier?: number;
}

export interface TowerRoute {
  type: string;
  hops: TowerRouteHop[];
}

/**
 * CONFIRMED shape via a live response (2026-09-01):
 * {
 *   "success": true,
 *   "data": {
 *     "inputToken": "0x...", "outputToken": "0x...",
 *     "inputAmount": "1000000000000000000",   // NOTE: normalized to 18 decimals
 *     "outputAmount": "790630000000000000",   // regardless of the token's real decimals
 *     "minOut": "786676850000000000",         // NOTE: "minOut", not "minOutputAmount"
 *     "route": { "type": "single", "hops": [{ "dexId": "synthra", ... }] }
 *   }
 * }
 * Fields beyond what's shown above (price, priceImpact, fee, quoteId, expiresAt)
 * were cut off in the response we captured — handled defensively as optional
 * below rather than assumed.
 */
export interface TowerQuoteResponseData {
  inputToken: string;
  outputToken: string;
  inputAmount: string; // 18-decimal normalized, not the token's native decimals
  outputAmount: string; // 18-decimal normalized
  minOut: string; // 18-decimal normalized
  route?: TowerRoute;
  price?: string;
  priceImpact?: number;
  fee?: string;
  quoteId?: string;
  expiresAt?: number;
}

export interface TowerQuoteResponse {
  success: boolean;
  data: TowerQuoteResponseData;
  error?: string;
}

export interface TowerTxPayload {
  to: string;
  data: string;
  value: string;
  gasLimit?: string;
  chainId: number;
}

export interface TowerBuildTxRequest {
  quote: TowerQuoteResponseData;
  userAddress: string;
}

export interface TowerBuildTxResponse {
  approval: TowerTxPayload | null;
  swap: TowerTxPayload;
  /** Some responses also include this at the wrapper level. */
  chainId?: number;
}

export interface TowerErrorResponse {
  error: string;
  code?: string;
}
