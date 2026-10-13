import { withApi } from "@/server/http/with-api";
import { buildHandler } from "@/server/swap/controller";
import { corsPreflight } from "@/server/http/cors";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/swap/build — the unsigned transaction the user's wallet signs.
 *
 * Idempotent: the client sends one `Idempotency-Key` per user action, so a
 * dropped connection that gets retried replays the transaction Tower already
 * built instead of building (and then signing) a second, differently-priced
 * swap. A retry that *should* re-quote sends a new key deliberately.
 */
export const POST = withApi(buildHandler, { auth: true, idempotent: true, rateLimit: { limit: 30 } });

/** Answers the CORS preflight; Next's own OPTIONS answer carries no CORS headers. */
export const OPTIONS = corsPreflight;
