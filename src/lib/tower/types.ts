/**
 * Tower Exchange API types.
 *
 * VERIFIED (2026-10) against Tower's official developer documentation
 * (https://docs.tower.exchange), the OpenAPI spec published in Tower's docs
 * repo (github.com/Tower-Exchange/tower-docs → public/openapi.json), and live
 * API probes of https://www.tower.exchange/api/public.
 *
 * Environment: a SINGLE base URL serves both Arc Mainnet and Testnet — the
 * environment is selected with `chainId` (Arc Mainnet = 5042, Arc Testnet =
 * 5042002), NOT by a different host.
 *
 * Auth: `Authorization: Bearer <key>` (or `x-api-key: <key>`). Keys look like
 * `sk_live_<hex>` / `sk_test_<hex>`. Required scopes: `read` (market data),
 * `swaps` (quote/build-tx), `bridges`.
 */

export interface TowerQuoteRequest {
  inputToken: string; // symbol ("USDC") or contract address ("0x...")
  outputToken: string; // symbol ("EURC") or contract address ("0x...")
  /** Base atomic units as a string, e.g. "100000000" = 100 USDC (6 decimals). */
  inputAmount: string;
  /** Max acceptable slippage in BASIS POINTS (50 = 0.5%). Tower's default is 50. */
  slippageTolerance?: number;
  /** Target a specific venue: "synthra" | "unitflow" | "tower-dex". Omit to route across all. */
  dexId?: string;
  /** 5042 = Arc Mainnet (Tower default), 5042002 = Arc Testnet. */
  chainId?: number;
}

export interface TowerRouteHop {
  dexId: string;
  dex?: string;
  dexName?: string;
  dexRouter?: string;
  path?: string[];
  amountIn?: string;
  amountOut?: string;
  priceImpact?: number;
  liquidity?: string;
  feeTier?: number;
  feeTiers?: number[];
}

export interface TowerRoute {
  type: string;
  hops: TowerRouteHop[];
  totalFee?: number;
  estimatedOutput?: string;
}

/**
 * Confirmed response shape:
 * {
 *   "success": true,
 *   "data": {
 *     "inputToken": "0x...", "outputToken": "0x...",
 *     "inputAmount": "100000000",
 *     "outputAmount": "92450000000000000000",   // normalized to 18 decimals
 *     "minOut": "91987750000000000000",          // 18-decimal normalized
 *     "priceImpact": 0.02,
 *     "gasEstimate": "200000",
 *     "feeBps": 25,
 *     "platformFeeAmount": "250000000000000",
 *     "dexId": "tower-dex",
 *     "dexName": "Tower",
 *     "route": { "type": "single", "hops": [ ... ] },
 *     "routeOptions": []
 *   }
 * }
 *
 * NOTE: `outputAmount`/`minOut` are 18-decimal normalized by Tower regardless
 * of the token's native decimals, so format them with 18 decimals.
 */
export interface TowerQuoteResponseData {
  inputToken: string;
  outputToken: string;
  /** 18-decimal normalized in the response (native value is in `inputAmountRaw`). */
  inputAmount: string;
  /** 18-decimal normalized. */
  outputAmount: string;
  /** 18-decimal normalized floor payout based on `slippageTolerance`. */
  minOut: string;
  /**
   * Tower's raw price-impact value. Units are NOT a clean percentage and are
   * inconsistent across venue adapters (observed: a constant 1774 for XyloNet
   * regardless of trade size, vs 30–47 for Synthra/UnitFlow/Tower). Treat as a
   * display hint only, not a precise percentage.
   */
  priceImpact?: number;
  gasEstimate?: string;
  feeBps?: number;
  platformFeeAmount?: string;
  /** Present in the docs example; the live API reports these inside route.hops instead. */
  dexId?: string;
  dexName?: string;
  route?: TowerRoute;
  routeOptions?: TowerRoute[];

  // --- Additional fields observed in the live API response (docs omit them) ---
  slippage?: number;
  /** Note the snake_case — returned exactly as `exec_price`. */
  exec_price?: number;
  swapInputAmount?: string;
  feeMode?: string;
  /** e.g. "normalized_1e18" — confirms amounts are scaled to 18 decimals. */
  amountScale?: string;
  inputTokenDecimals?: number;
  outputTokenDecimals?: number;
  /** Native-decimals (un-normalized) values, useful for exact raw amounts. */
  inputAmountRaw?: string;
  swapInputAmountRaw?: string;
  outputAmountRaw?: string;
  minOutRaw?: string;
  platformFeeAmountRaw?: string;
  /** ISO timestamps; quotes expire (observed `validForSeconds: 120`). */
  quotedAt?: string;
  expiresAt?: string;
  validForSeconds?: number;
}

export interface TowerQuoteResponse {
  success: boolean;
  data: TowerQuoteResponseData;
  error?: string;
}

export interface TowerTxPayload {
  to: string;
  data: string;
  value?: string;
  from?: string;
  gasLimit?: string;
  chainId?: number;
}

/** Request body for POST /swap/build-tx — the full quote `data` object plus the signer. */
export interface TowerBuildTxRequest {
  quote: TowerQuoteResponseData;
  userAddress: string;
}

/**
 * Response is `{ success: true, data: { approval, swap } }`.
 * `approval` is `null` when the wallet already has an active allowance for
 * the TowerSwapExecutor contract, in which case only `swap` must be signed.
 */
export interface TowerBuildTxResponseData {
  approval: TowerTxPayload | null;
  swap: TowerTxPayload;
  chainId?: number;
}

export interface TowerBuildTxResponse {
  success?: boolean;
  data?: TowerBuildTxResponseData;
  error?: string;
}

/** Standard error payload: { success: false, error, code, status }. */
export interface TowerErrorResponse {
  success?: boolean;
  error: string;
  code?: string;
  status?: number;
}

/** Known Tower API error codes (docs.tower.exchange -> Errors & Troubleshooting). */
export type TowerErrorCode =
  | "INVALID_API_KEY"
  | "UNAUTHORIZED"
  | "SCOPE_FORBIDDEN"
  | "INSUFFICIENT_LIQUIDITY"
  | "NO_ROUTE_FOUND"
  | "SLIPPAGE_EXCEEDED"
  | "QUOTE_EXPIRED"
  | "INVALID_TOKEN"
  | "UNSUPPORTED_CHAIN"
  | "RATE_LIMIT_EXCEEDED"
  | "WALLET_NOT_FOUND"
  | "UPSTREAM_ERROR";

// ---- Market data and metadata ----

export interface TowerToken {
  symbol: string;
  name: string;
  decimals: number;
  address: string;
  isNativeGas: boolean;
  chainId: number;
  chainKey: string;
  bridgeAddresses?: Record<string, string>;
}

export interface TowerTokensResponse {
  success: boolean;
  data: TowerToken[];
}

/**
 * GET /prices is NOT wrapped in { success, data }. It returns a flat object with
 * a MIXED shape, confirmed against the live API:
 *   - token symbols map directly to a USD number   (for example "USDC": 1)
 *   - provider coin ids map to a { usd } object     (for example "usd-coin": { "usd": 1 })
 */
export type TowerPriceEntry = number | { usd: number };
export type TowerPricesResponse = Record<string, TowerPriceEntry>;

export interface TowerDexRouter {
  id: string;
  name: string;
  routerAddress?: string;
  factoryAddress?: string;
  quoterAddress?: string;
  type: string;
  chainId?: number;
  enabled: boolean;
  supportedTokens?: string[];
}

export interface TowerDexesResponse {
  success: boolean;
  data: TowerDexRouter[];
}
