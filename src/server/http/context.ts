import type { AuthenticatedUser } from "@/server/auth/types";

export interface RequestContext {
  /** Correlation id echoed in `x-request-id` and error bodies. */
  requestId: string;
  /** The authenticated caller, or null for unauthenticated routes. */
  user: AuthenticatedUser | null;
}
