import { withApi } from "@/server/http/with-api";
import { sessionHandler } from "@/server/users/controller";

export const dynamic = "force-dynamic";

/**
 * Authentication is owned by Privy: the client sends the access token it got
 * from `usePrivy().getAccessToken()` as a bearer token, and this returns the
 * caller's own profile. There is no register/login endpoint any more.
 */
export const GET = withApi(sessionHandler, { auth: true, rateLimit: { limit: 240 } });
