import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { ApiError, idempotencyConflict } from "./errors";
import { jsonError } from "./responses";
import type { RequestContext } from "./context";
import { enforceRateLimit } from "./rate-limit";
import { verifyAccessToken } from "@/server/auth/jwt";
import type { AuthenticatedUser, Role } from "@/server/auth/types";
import { reserveIdempotency, completeIdempotency, releaseIdempotency } from "@/server/idempotency/store";

export interface ApiHandlerOptions {
  /** Require a valid bearer token. */
  auth?: boolean;
  /** Require one of these roles (implies auth). */
  roles?: Role[];
  /** Require an `Idempotency-Key` header and replay stored responses. */
  idempotent?: boolean;
  /** Per-caller token bucket. */
  rateLimit?: { limit: number; windowMs?: number };
}

export type ApiHandler<P> = (req: NextRequest, ctx: RequestContext, params: P) => Promise<NextResponse> | NextResponse;

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return (forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip")) || "unknown";
}

/**
 * Wraps a route handler with the cross-cutting pipeline:
 * rate limit -> authentication -> authorization -> idempotency -> handler,
 * with a single error boundary and a correlation id on every response.
 */
export function withApi<P extends Record<string, string> = Record<string, never>>(
  handler: ApiHandler<P>,
  options: ApiHandlerOptions = {}
) {
  return async (req: NextRequest, routeContext?: { params?: P }): Promise<NextResponse> => {
    const requestId = randomUUID();
    const path = new URL(req.url).pathname;
    let reservation: { key: string; scope: string } | null = null;

    try {
      enforceRateLimit(`${clientIp(req)}:${path}`, options.rateLimit?.limit, options.rateLimit?.windowMs);

      let user: AuthenticatedUser | null = null;
      if (options.auth || options.roles) {
        const header = req.headers.get("authorization") ?? "";
        const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
        if (!token) throw new ApiError("UNAUTHORIZED", "Missing bearer token.");
        try {
          user = await verifyAccessToken(token);
        } catch {
          throw new ApiError("UNAUTHORIZED", "Invalid or expired token.");
        }
        if (options.roles && !options.roles.includes(user.role)) {
          throw new ApiError("FORBIDDEN", "Insufficient permissions.");
        }
      }

      const ctx: RequestContext = { requestId, user };

      if (options.idempotent) {
        const key = req.headers.get("idempotency-key");
        if (!key) throw new ApiError("BAD_REQUEST", "Idempotency-Key header is required.");
        const scope = `${req.method} ${path} ${user?.id ?? "anon"}`;
        const outcome = await reserveIdempotency(key, scope);
        if (outcome.kind === "replay") {
          return new NextResponse(outcome.body, {
            status: outcome.status,
            headers: {
              "content-type": "application/json",
              "idempotency-replayed": "true",
              "x-request-id": requestId,
            },
          });
        }
        if (outcome.kind === "in-progress") {
          throw idempotencyConflict("A request with this Idempotency-Key is still in progress.");
        }
        reservation = { key, scope };
      }

      const response = await handler(req, ctx, (routeContext?.params ?? {}) as P);

      if (reservation) {
        const body = await response.clone().text();
        await completeIdempotency(reservation.key, reservation.scope, response.status, body || "null");
      }

      response.headers.set("x-request-id", requestId);
      return response;
    } catch (err) {
      // A failed attempt must not poison the key.
      if (reservation) await releaseIdempotency(reservation.key, reservation.scope).catch(() => {});
      const response = jsonError(err, requestId);
      response.headers.set("x-request-id", requestId);
      return response;
    }
  };
}
