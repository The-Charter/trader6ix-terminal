import { withApi } from "@/server/http/with-api";
import { listHandler, createHandler } from "@/server/watchlist/controller";

export const dynamic = "force-dynamic";

export const GET = withApi(listHandler, { auth: true, rateLimit: { limit: 120 } });
export const POST = withApi(createHandler, {
  auth: true,
  idempotent: true,
  rateLimit: { limit: 30 },
});
