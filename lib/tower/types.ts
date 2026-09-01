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

export interface TowerQuoteResponse {
  inputToken: string;
  outputToken: string;
  inputAmount: string;
  outputAmount: string;
  minOutputAmount: string;
  price: string;
  priceImpact: number;
  fee?: string;
  route?: string;
  quoteId?: string;
  expiresAt?: number;
  chainId: number;
}

export interface TowerTxPayload {
  to: string;
  data: string;
  value: string;
  gasLimit?: string;
  chainId: number;
}

export interface TowerBuildTxRequest {
  quoteId?: string;
  inputToken: string;
  outputToken: string;
  amount: string; // TODO: /swap/quote confirmed the field is "inputAmount" not "amount" — build-tx likely follows the same convention but this is UNCONFIRMED until we actually reach this endpoint in testing
  minOutputAmount: string;
  slippage: number;
  userAddress: string;
  chainId: number;
}

export interface TowerBuildTxResponse {
  approval: TowerTxPayload | null;
  swap: TowerTxPayload;
  chainId: number;
}

export interface TowerErrorResponse {
  error: string;
  code?: string;
}
