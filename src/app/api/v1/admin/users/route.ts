import { withApi } from "@/server/http/with-api";
import { listUsersHandler } from "@/server/users/controller";

export const dynamic = "force-dynamic";

// RBAC demo: only callers whose token carries the `admin` role may list users.
export const GET = withApi(listUsersHandler, { roles: ["admin"] });
