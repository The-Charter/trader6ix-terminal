import { forbidden } from "@/server/http/errors";
import type { AuthenticatedUser, Role } from "./types";

/** Enforces that the caller is authenticated and holds one of `roles`. */
export function requireRole(user: AuthenticatedUser | null, roles: Role[]): void {
  if (!user) throw forbidden("Authentication required.");
  if (!roles.includes(user.role)) throw forbidden("Insufficient permissions.");
}
