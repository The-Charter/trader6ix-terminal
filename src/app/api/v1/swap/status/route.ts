import { withApi } from "@/server/http/with-api";
import { jsonOk } from "@/server/http/responses";
import { badRequest } from "@/server/http/errors";
import { getTransactionStatus } from "@/server/arc-rpc/client";
import { corsPreflight } from "@/server/http/cors";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/swap/status?hash=0x…
 *
 * Whether the transaction the user just signed is final. The client polls this
 * after sending so the completion screen can say "completed" truthfully instead
 * of guessing from a broadcast hash. Reads happen server-side, so the browser
 * still needs no RPC of its own.
 */
export const GET = withApi(
  async (req) => {
    const hash = req.nextUrl.searchParams.get("hash") ?? "";
    if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) {
      throw badRequest("hash must be a 32-byte 0x transaction hash.");
    }
    return jsonOk({ hash, status: await getTransactionStatus(hash) });
  },
  { auth: true, rateLimit: { limit: 480 } }
);

/** Answers the CORS preflight; Next's own OPTIONS answer carries no CORS headers. */
export const OPTIONS = corsPreflight;
