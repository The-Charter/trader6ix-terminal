import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createHash, randomUUID } from "node:crypto";
import { ApiError, idempotencyConflict } from "./errors";
import { jsonError } from "./responses";
import type { RequestContext } from "./context";
import { enforceRateLimit } from "./rate-limit";
import { verifyPrivyAccessToken } from "@/server/auth/privy";
import { resolveIdentity } from "@/server/users/service";
import type { AuthenticatedUser, Role } from "@/server/auth/types";
import { reserveIdempotency, completeIdempotency, releaseIdempotency } from "@/server/idempotency/store";
import { corsHeadersFor } from "./cors";

export interface ApiHandlerOptions {
  /** Require a valid Privy access token. */
  auth?: boolean;
  /** Require one of these roles (implies auth). */
  roles?: Role[];
  /**
   * Require an `Idempotency-Key` header and replay stored responses.
   *
   * Defaults to ON for mutating requests to the first-party API (`/api/v1/…`)
   * and OFF elsewhere, so read-like upstream proxies (quotes, token lists)
   * keep working unchanged while every state-changing call — and above all
   * every fund-moving one — is retry-safe.
   */
  idempotent?: boolean;
  /** Per-caller token bucket. */
  rateLimit?: { limit: number; windowMs?: number };
}

export type ApiHandler<P> = (req: NextRequest, ctx: RequestContext, params: P) => Promise<NextResponse> | NextResponse;

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const MAX_KEY_LENGTH = 200;

function defaultIdempotency(path: string, method: string): boolean {
  return MUTATING_METHODS.has(method) && path.startsWith("/api/v1/");
}

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return (forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip")) || "unknown";
}

/** Binds a key to its scope (route + method + caller) and its exact payload. */
function idempotencyScope(req: NextRequest, path: string, user: AuthenticatedUser | null): string {
  return `${req.method.toUpperCase()} ${path} ${user?.id ?? "anon"}`;
}

async function hashRequest(req: NextRequest, method: string): Promise<string> {
  if (!MUTATING_METHODS.has(method)) return "";
  try {
    // Reads a teed copy so the handler can still consume the original stream.
    const body = await req.clone().text();
    const url = new URL(req.url);
    return createHash("sha256").update(`${url.pathname}${url.search}\n`).update(body).digest("hex");
  } catch {
    return "";
  }
}

/**
 * Verifies the caller's Privy access token and maps it onto a local user row.
 *
 * Authentication (who you are) is Privy's; authorization (what you may do) uses
 * the role stored in Postgres, which the env allowlist can only promote.
 */
async function authenticate(req: NextRequest, requestId: string): Promise<AuthenticatedUser> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) throw new ApiError("UNAUTHORIZED", "Missing bearer token.");

  let identity;
  try {
    identity = await verifyPrivyAccessToken(token);
  } catch (err) {
    // A missing/invalid PRIVY_VERIFICATION_KEY must be loud here and opaque to
    // the caller: the route fails closed rather than trusting the token.
    console.error(`[${requestId}] Privy access token rejected:`, err instanceof Error ? err.message : err);
    throw new ApiError("UNAUTHORIZED", "Invalid or expired access token.");
  }

  try {
    const record = await resolveIdentity(identity);
    return {
      id: record.id,
      did: record.did,
      wallet: record.wallet,
      wallets: [...new Set([...identity.wallets, ...record.wallets])],
      role: record.role,
    };
  } catch (err) {
    console.error(
      `[${requestId}] could not resolve the caller's user row:`,
      err instanceof Error ? err.message : err
    );
    throw new ApiError("INTERNAL", "Authentication is temporarily unavailable.");
  }
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
    const method = req.method.toUpperCase();
    const cors = corsHeadersFor(req);
    let reservation: { key: string; scope: string } | null = null;

    try {
      enforceRateLimit(`${clientIp(req)}:${path}`, options.rateLimit?.limit, options.rateLimit?.windowMs);

      let user: AuthenticatedUser | null = null;
      if (options.auth || options.roles) {
        user = await authenticate(req, requestId);
        if (options.roles && !options.roles.includes(user.role)) {
          throw new ApiError("FORBIDDEN", "Insufficient permissions.");
        }
      }

      const ctx: RequestContext = { requestId, user };

      const idempotent = options.idempotent ?? defaultIdempotency(path, method);
      if (idempotent) {
        const key = (req.headers.get("idempotency-key") ?? "").trim();
        if (!key) {
          throw new ApiError("BAD_REQUEST", "Idempotency-Key header is required for this request.");
        }
        if (key.length > MAX_KEY_LENGTH) {
          throw new ApiError("BAD_REQUEST", `Idempotency-Key is too long (max ${MAX_KEY_LENGTH} characters).`);
        }

        const scope = idempotencyScope(req, path, user);
        const outcome = await reserveIdempotency(key, scope, await hashRequest(req, method));

        if (outcome.kind === "mismatch") {
          throw idempotencyConflict(
            "This Idempotency-Key was already used with a different request payload."
          );
        }
        if (outcome.kind === "replay") {
          return new NextResponse(outcome.body, {
            status: outcome.status,
            headers: {
              "content-type": "application/json",
              "idempotency-replayed": "true",
              "x-request-id": requestId,
              ...cors,
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
        if (response.status >= 500) {
          // Transient failure: free the key so a retry actually re-executes.
          await releaseIdempotency(reservation.key, reservation.scope).catch(() => {});
        } else {
          const body = await response.clone().text();
          await completeIdempotency(reservation.key, reservation.scope, response.status, body || "null");
        }
      }

      response.headers.set("x-request-id", requestId);
      for (const [name, value] of Object.entries(cors)) response.headers.set(name, value);
      return response;
    } catch (err) {
      // A failed attempt must not poison the key.
      if (reservation) await releaseIdempotency(reservation.key, reservation.scope).catch(() => {});
      const response = jsonError(err, requestId);
      response.headers.set("x-request-id", requestId);
      for (const [name, value] of Object.entries(cors)) response.headers.set(name, value);
      return response;
    }
  };
}
