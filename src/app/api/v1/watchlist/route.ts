import { withApi } from "@/server/http/with-api";
import { listHandler, createHandler } from "@/server/watchlist/controller";
import { corsPreflight } from "@/server/http/cors";

export const dynamic = "force-dynamic";

export const GET = withApi(listHandler, { auth: true, rateLimit: { limit: 120 } });
export const POST = withApi(createHandler, {
  auth: true,
  idempotent: true,
  rateLimit: { limit: 30 },
});

/** Answers the CORS preflight; Next's own OPTIONS answer carries no CORS headers. */
export const OPTIONS = corsPreflight;
