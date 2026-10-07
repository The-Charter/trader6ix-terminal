import type { TowerErrorCode } from "@/lib/tower/types";

/** Raised for any non-success response from the Tower API. */
export class TowerApiError extends Error {
  readonly status: number;
  readonly code?: TowerErrorCode | string;

  constructor(message: string, status: number, code?: TowerErrorCode | string) {
    super(message);
    this.name = "TowerApiError";
    this.status = status;
    this.code = code;
  }
}

/** Raised when a request body fails validation at the API boundary. */
export class TowerValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TowerValidationError";
  }
}

const TOWER_ERROR_MESSAGES: Record<string, string> = {
  INVALID_API_KEY: "Tower API key is missing, invalid, or revoked.",
  UNAUTHORIZED: "Tower API key is missing, invalid, or revoked.",
  SCOPE_FORBIDDEN: "Tower API key is missing a required permission scope.",
  INSUFFICIENT_LIQUIDITY: "The trade size exceeds available liquidity. Try a smaller amount.",
  NO_ROUTE_FOUND: "No swap route exists for this token pair.",
  SLIPPAGE_EXCEEDED: "The market moved beyond your slippage tolerance. Refresh the quote and try again.",
  QUOTE_EXPIRED: "This quote has expired. Request a fresh quote.",
  INVALID_TOKEN: "One of the selected tokens is not supported.",
  UNSUPPORTED_CHAIN: "This network is not supported.",
  RATE_LIMIT_EXCEEDED: "Too many requests. Please wait a moment and retry.",
  WALLET_NOT_FOUND: "The wallet address is invalid.",
  UPSTREAM_ERROR: "Tower's upstream service is temporarily unavailable. Retry shortly.",
};

/** Resolves a safe, user-facing message for a Tower failure. */
export function messageForTowerError(code: string | undefined, upstream: string, status: number): string {
  if (code && TOWER_ERROR_MESSAGES[code]) return TOWER_ERROR_MESSAGES[code];
  if (status === 401) return TOWER_ERROR_MESSAGES.INVALID_API_KEY;
  if (status === 403) return TOWER_ERROR_MESSAGES.SCOPE_FORBIDDEN;
  if (status === 404) return "Tower could not find a route or liquidity for this request.";
  if (status === 429) return TOWER_ERROR_MESSAGES.RATE_LIMIT_EXCEEDED;
  if (status >= 500) return TOWER_ERROR_MESSAGES.UPSTREAM_ERROR;
  return upstream ? upstream.slice(0, 300) : `Tower request failed (${status}).`;
}

export interface TowerErrorResponseBody {
  error: string;
  code?: string;
}

/** Converts an error from the Tower layer into an HTTP status and a safe body. */
export function toTowerErrorResponse(err: unknown): { status: number; body: TowerErrorResponseBody } {
  if (err instanceof TowerValidationError) {
    return { status: 400, body: { error: err.message } };
  }
  if (err instanceof TowerApiError) {
    const status = err.status >= 400 && err.status < 600 ? err.status : 502;
    return { status, body: { error: err.message, code: err.code } };
  }
  return { status: 502, body: { error: err instanceof Error ? err.message : "Unknown error" } };
}
