import "server-only";
import { forbidden } from "@/server/http/errors";
import type { AuthenticatedUser, Role } from "./types";

/** Enforces that the caller is authenticated and holds one of `roles`. */
export function requireRole(user: AuthenticatedUser | null, roles: Role[]): void {
  if (!user) throw forbidden("Authentication required.");
  if (!roles.includes(user.role)) throw forbidden("Insufficient permissions.");
}

/**
 * Bootstrap allowlist of admin DIDs (`ADMIN_PRIVY_DIDS`, comma separated).
 *
 * Authorization is data, not configuration, so the DB role is the source of
 * truth — but the very first admin has to come from somewhere, and nobody
 * wants to be locked out of a fresh database.
 */
export function adminDids(): string[] {
  return (process.env.ADMIN_PRIVY_DIDS ?? "")
    .split(",")
    .map((did) => did.trim())
    .filter((did) => did !== "");
}

/** The role the allowlist mandates for `did`, or null when it says nothing. */
export function roleFromAllowlist(did: string): Role | null {
  return adminDids().includes(did) ? "admin" : null;
}
