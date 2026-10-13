/**
 * The Trader6ix Privy application id.
 *
 * Public by design — it is sent to the browser either way — so it carries a code
 * default like the rest of the public configuration, and the environment
 * variable exists only to point a deployment at a *different* Privy app (a
 * staging app, say).
 *
 * The API verifies each access token's `aud` against this same value, so a
 * deployment pointing at one app while the API expects another rejects every
 * token — which is why the value lives in one place instead of two.
 */
const DEFAULT_PRIVY_APP_ID = "cmv6p1dze000w0fl8pqx2dzh0";

export const PRIVY_APP_ID = (process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "").trim() || DEFAULT_PRIVY_APP_ID;

/** Whether Privy auth is configured at all. */
export const PRIVY_ENABLED = PRIVY_APP_ID !== "";
