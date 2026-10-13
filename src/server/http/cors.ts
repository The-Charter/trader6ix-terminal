import "server-only";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Cross-origin support for a split deployment (pages on one host, API on
 * another). Off by default: with `CORS_ALLOWED_ORIGINS` unset, no CORS headers
 * are emitted and the API behaves exactly as it does same-origin.
 *
 * Auth uses Bearer tokens rather than cookies, so no credentials mode is
 * involved — but `Authorization` is not a simple header, which means *every*
 * authenticated request is preflighted, including plain GETs. Preflight must
 * therefore be answered on every browser-facing route, not just the mutating
 * ones.
 */
function allowedOrigins(): string[] {
  return (process.env.CORS_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

/** CORS headers for this request, or nothing when its origin is not allowed. */
export function corsHeadersFor(req: NextRequest): Record<string, string> {
  const origin = req.headers.get("origin");
  if (!origin) return {};

  const allowed = allowedOrigins();
  if (allowed.length === 0) return {};

  const normalized = origin.replace(/\/+$/, "");
  if (!allowed.includes(normalized)) return {};

  return {
    "access-control-allow-origin": normalized,
    "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "access-control-allow-headers": "authorization,content-type,idempotency-key",
    "access-control-max-age": "600",
    vary: "Origin",
  };
}

/**
 * Answers a CORS preflight.
 *
 * This must be exported as `OPTIONS` by the route itself: Next.js answers
 * OPTIONS automatically when a route does not, and its automatic answer carries
 * no CORS headers — which makes the browser block the real request that
 * follows.
 */
export function corsPreflight(req: NextRequest): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: { ...corsHeadersFor(req), allow: "GET,POST,PUT,PATCH,DELETE,OPTIONS" },
  });
}

/** Adds the CORS headers to a response from a route that is not wrapped by `withApi`. */
export function withCors(req: NextRequest, response: NextResponse): NextResponse {
  for (const [name, value] of Object.entries(corsHeadersFor(req))) {
    response.headers.set(name, value);
  }
  return response;
}

/**
 * Wraps a plain route handler so every response it returns carries the CORS
 * headers. Use it for routes that are not built on `withApi`.
 */
export function corsRoute<A extends unknown[]>(
  handler: (req: NextRequest, ...args: A) => Promise<NextResponse>
): (req: NextRequest, ...args: A) => Promise<NextResponse> {
  return async (req, ...args) => withCors(req, await handler(req, ...args));
}
