import { withApi } from "@/server/http/with-api";
import { listUsersHandler } from "@/server/users/controller";
import { corsPreflight } from "@/server/http/cors";

export const dynamic = "force-dynamic";

// RBAC: the middleware verifies the Privy access token, resolves the caller's
// local role, and only then lets an `admin` through.
export const GET = withApi(listUsersHandler, { roles: ["admin"] });

/** Answers the CORS preflight; Next's own OPTIONS answer carries no CORS headers. */
export const OPTIONS = corsPreflight;
