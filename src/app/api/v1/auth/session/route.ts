import { withApi } from "@/server/http/with-api";
import { sessionHandler } from "@/server/users/controller";
import { corsPreflight } from "@/server/http/cors";

export const dynamic = "force-dynamic";

/**
 * Authentication is owned by Privy: the client sends the access token it got
 * from `usePrivy().getAccessToken()` as a bearer token, and this returns the
 * caller's own profile. There is no register/login endpoint any more.
 */
export const GET = withApi(sessionHandler, { auth: true, rateLimit: { limit: 240 } });

/** Answers the CORS preflight; Next's own OPTIONS answer carries no CORS headers. */
export const OPTIONS = corsPreflight;
