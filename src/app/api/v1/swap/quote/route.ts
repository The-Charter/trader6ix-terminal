import { withApi } from "@/server/http/with-api";
import { quoteHandler } from "@/server/swap/controller";
import { corsPreflight } from "@/server/http/cors";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/swap/quote — a Tower quote for a trusted token pair.
 * Requires a Privy access token. Explicitly NOT idempotent: a quote is
 * read-like, and caching one per key would both churn the store and pin a
 * stale price.
 */
export const POST = withApi(quoteHandler, { auth: true, idempotent: false, rateLimit: { limit: 60 } });

/** Answers the CORS preflight; Next's own OPTIONS answer carries no CORS headers. */
export const OPTIONS = corsPreflight;
