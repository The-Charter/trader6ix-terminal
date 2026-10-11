export type ApiErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_FAILED"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "IDEMPOTENCY_CONFLICT"
  | "INTERNAL";

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  BAD_REQUEST: 400,
  VALIDATION_FAILED: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  IDEMPOTENCY_CONFLICT: 409,
  INTERNAL: 500,
};

/** An error safe to surface to API callers. Anything else is treated as internal. */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: ApiErrorCode, message?: string, details?: unknown) {
    super(message ?? code);
    this.name = "ApiError";
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.details = details;
  }
}

export const badRequest = (message?: string, details?: unknown) => new ApiError("BAD_REQUEST", message, details);
export const validationFailed = (message?: string, details?: unknown) => new ApiError("VALIDATION_FAILED", message, details);
export const unauthorized = (message?: string) => new ApiError("UNAUTHORIZED", message);
export const forbidden = (message?: string) => new ApiError("FORBIDDEN", message);
export const notFound = (message?: string) => new ApiError("NOT_FOUND", message);
export const conflict = (message?: string) => new ApiError("CONFLICT", message);
export const rateLimited = (message?: string) => new ApiError("RATE_LIMITED", message);
export const idempotencyConflict = (message?: string) => new ApiError("IDEMPOTENCY_CONFLICT", message);
