import { withApi } from "@/server/http/with-api";
import { loginHandler } from "@/server/users/controller";

export const dynamic = "force-dynamic";

export const POST = withApi(loginHandler, { rateLimit: { limit: 20 } });
