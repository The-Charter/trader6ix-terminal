import "server-only";
import type { NextRequest } from "next/server";
import { jsonOk } from "@/server/http/responses";
import { ApiError } from "@/server/http/errors";
import type { RequestContext } from "@/server/http/context";
import * as service from "./service";

function requireUser(ctx: RequestContext) {
  if (!ctx.user) throw new ApiError("UNAUTHORIZED", "Authentication required.");
  return ctx.user;
}

/**
 * GET /api/v1/auth/session — the caller's own profile.
 *
 * Doubles as the client's "am I still signed in?" probe: a 200 means the Privy
 * access token is valid and the local user row exists.
 */
export async function sessionHandler(_req: NextRequest, ctx: RequestContext) {
  return jsonOk(await service.getProfile(requireUser(ctx).id));
}

/** GET /api/v1/admin/users — RBAC: admin role required by the middleware. */
export async function listUsersHandler(_req: NextRequest, _ctx: RequestContext) {
  return jsonOk(await service.listUsers());
}
