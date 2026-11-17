"use client";

/**
 * Client for the first-party API (`/api/v1/…`).
 *
 * Authentication is owned by Privy: every call carries the access token from
 * `usePrivy().getAccessToken()`. `PrivySessionSync` registers the getter once it
 * is mounted, so non-component modules (hooks, adapters) can make
 * authenticated calls too — and tokens are always minted fresh, since they
 * expire.
 *
 * Mutating calls automatically carry an `Idempotency-Key` (the API requires
 * one). That is what makes a retry safe: the server replays the first response
 * instead of executing the request — and moving funds — a second time. Pass the
 * same `idempotencyKey` across retries of one user action.
 */

import { apiUrl } from "@/lib/api-base";
import { PRIVY_ENABLED } from "@/lib/privy-app";

type TokenGetter = () => Promise<string | null>;

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

let tokenGetter: TokenGetter | null = null;

/** Whether Privy has finished deciding if anyone is signed in. */
let authSettled = false;

const authWaiters = new Set<() => void>();

/**
 * Called by `PrivySessionSync` once Privy is ready: with a getter when someone
 * is signed in, with `null` when nobody is.
 */
export function registerAccessTokenGetter(getter: TokenGetter | null): void {
  tokenGetter = getter;
  authSettled = true;
  for (const wake of [...authWaiters]) wake();
}

/** Called while Privy is still restoring the login, so requests wait for it. */
export function markAuthPending(): void {
  if (!tokenGetter) authSettled = false;
}

/**
 * Resolves once Privy has settled the login (or after `timeoutMs`).
 *
 * The app paints a stored session immediately, but Privy finishes restoring the
 * login later — seconds later on a slow connection. A request fired in that gap
 * carries no token and is a guaranteed 401. Waiting for Privy's answer, rather
 * than a fixed few seconds, closes the race at its source.
 */
function waitForAuth(timeoutMs: number): Promise<void> {
  if (authSettled || !PRIVY_ENABLED) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      window.clearTimeout(timer);
      authWaiters.delete(done);
      resolve();
    };
    const timer = window.setTimeout(done, timeoutMs);
    authWaiters.add(done);
  });
}

/** A local 401, for when there is no token to send and the API would only say so. */
function notSignedIn(): Response {
  return new Response(
    JSON.stringify({ error: { code: "UNAUTHORIZED", message: "Sign in to continue." } }),
    { status: 401, headers: { "content-type": "application/json" } }
  );
}

export async function getAccessToken(): Promise<string | null> {
  if (!tokenGetter) return null;
  try {
    return await tokenGetter();
  } catch {
    return null;
  }
}

/**
 * True when the last response told us the caller's token was not accepted.
 * Lets the UI ask the user to sign in again instead of retrying forever.
 */
let lastUnauthorized = false;

export function lastRequestWasUnauthorized(): boolean {
  return lastUnauthorized;
}

export function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `idem-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId?: string;

  constructor(status: number, code: string, message: string, requestId?: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

export interface ApiFetchOptions extends RequestInit {
  /** Reuse across retries of the same user action; omit to generate one. */
  idempotencyKey?: string;
  /** Skip the automatic Idempotency-Key (for read-like POSTs). */
  noIdempotencyKey?: boolean;
}

export async function apiFetch(path: string, options: ApiFetchOptions = {}): Promise<Response> {
  const { idempotencyKey, noIdempotencyKey, headers, ...init } = options;
  const method = (init.method ?? "GET").toUpperCase();
  const finalHeaders = new Headers(headers);

  if (!finalHeaders.has("accept")) finalHeaders.set("accept", "application/json");
  if (init.body !== undefined && !finalHeaders.has("content-type")) {
    finalHeaders.set("content-type", "application/json");
  }
  // Generate once so a retry replays the same operation rather than a new one.
  const idempotency = MUTATING.has(method)
    ? noIdempotencyKey
      ? null
      : (idempotencyKey ?? newIdempotencyKey())
    : null;
  if (idempotency) finalHeaders.set("idempotency-key", idempotency);

  const send = async (token: string | null) => {
    const attemptHeaders = new Headers(finalHeaders);
    if (token) attemptHeaders.set("authorization", `Bearer ${token}`);
    return fetch(apiUrl(path), { ...init, method, headers: attemptHeaders });
  };

  if (typeof window !== "undefined") await waitForAuth(15_000);
  const token = await getAccessToken();

  // Every first-party route this client calls requires sign-in, so with Privy
  // on and no token there is nothing to gain from asking the API — it would
  // only answer 401 and put a red line in the console.
  if (!token && PRIVY_ENABLED && typeof window !== "undefined") {
    lastUnauthorized = true;
    return notSignedIn();
  }

  const response = await send(token);

  if (response.status === 401) {
    // A token can lapse between being minted and being used, or Privy can be
    // mid-refresh. Mint a fresh one and retry — twice, each after a short
    // pause — with the SAME idempotency key, so a mutating retry replays
    // rather than re-executes.
    for (const pauseMs of [300, 1_200]) {
      await new Promise((resolve) => setTimeout(resolve, pauseMs));
      const fresh = await getAccessToken();
      if (!fresh) continue;
      const retry = await send(fresh);
      if (retry.status !== 401) {
        lastUnauthorized = false;
        return retry;
      }
    }
    lastUnauthorized = true;
  } else {
    lastUnauthorized = false;
  }

  return response;
}

/** Like `apiFetch`, but unwraps the `{ data }` envelope and throws `ApiRequestError`. */
export async function apiJson<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const response = await apiFetch(path, options);
  const text = await response.text();

  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const error = (payload as { error?: { code?: string; message?: string; requestId?: string } } | null)?.error;
    throw new ApiRequestError(
      response.status,
      error?.code ?? "HTTP_ERROR",
      error?.message ?? `Request failed with status ${response.status}.`,
      error?.requestId
    );
  }

  return (payload as { data?: T } | null)?.data as T;
}
