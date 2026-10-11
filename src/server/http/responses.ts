import { NextResponse } from "next/server";
import { ApiError } from "./errors";

/** Success envelope: { data }. */
export function jsonOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

export function emptyOk(status = 204): NextResponse {
  return new NextResponse(null, { status });
}

/**
 * Error envelope: { error: { code, message, requestId, details? } }.
 * Internal errors are logged server-side with the request id and never leaked
 * to the caller.
 */
export function jsonError(err: unknown, requestId: string): NextResponse {
  const isApiError = err instanceof ApiError;
  const status = isApiError ? err.status : 500;
  const code = isApiError ? err.code : "INTERNAL";
  const message = isApiError ? err.message : "Internal server error";

  if (!isApiError) {
    console.error(`[${requestId}] unhandled error:`, err instanceof Error ? (err.stack ?? err.message) : err);
  }

  return NextResponse.json(
    {
      error: {
        code,
        message,
        requestId,
        ...(isApiError && err.details !== undefined ? { details: err.details } : {}),
      },
    },
    { status }
  );
}
