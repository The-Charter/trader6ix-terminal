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

type TokenGetter = () => Promise<string | null>;

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

let tokenGetter: TokenGetter | null = null;

export function registerAccessTokenGetter(getter: TokenGetter | null): void {
  tokenGetter = getter;
}

export async function getAccessToken(): Promise<string | null> {
  if (!tokenGetter) return null;
  try {
    return await tokenGetter();
  } catch {
    return null;
  }
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

  const token = await getAccessToken();
  if (token) finalHeaders.set("authorization", `Bearer ${token}`);
  if (!finalHeaders.has("accept")) finalHeaders.set("accept", "application/json");
  if (init.body !== undefined && !finalHeaders.has("content-type")) {
    finalHeaders.set("content-type", "application/json");
  }
  if (!noIdempotencyKey && MUTATING.has(method)) {
    finalHeaders.set("idempotency-key", idempotencyKey ?? newIdempotencyKey());
  }

  return fetch(path, { ...init, method, headers: finalHeaders });
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
