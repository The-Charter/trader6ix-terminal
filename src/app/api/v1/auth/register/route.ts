import { withApi } from "@/server/http/with-api";
import { registerHandler } from "@/server/users/controller";

export const dynamic = "force-dynamic";

export const POST = withApi(registerHandler, { rateLimit: { limit: 10 } });
