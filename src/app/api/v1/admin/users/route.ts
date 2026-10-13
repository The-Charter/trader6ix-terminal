import { withApi } from "@/server/http/with-api";
import { listUsersHandler } from "@/server/users/controller";

export const dynamic = "force-dynamic";

// RBAC: the middleware verifies the Privy access token, resolves the caller's
// local role, and only then lets an `admin` through.
export const GET = withApi(listUsersHandler, { roles: ["admin"] });
