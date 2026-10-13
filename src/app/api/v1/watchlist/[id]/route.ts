import { withApi } from "@/server/http/with-api";
import { getHandler, deleteHandler } from "@/server/watchlist/controller";
import { corsPreflight } from "@/server/http/cors";

export const dynamic = "force-dynamic";

export const GET = withApi(getHandler, { auth: true });
export const DELETE = withApi(deleteHandler, { auth: true });

/** Answers the CORS preflight; Next's own OPTIONS answer carries no CORS headers. */
export const OPTIONS = corsPreflight;
