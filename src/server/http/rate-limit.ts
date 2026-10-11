import "server-only";
import { rateLimited } from "./errors";

interface Bucket {
  tokens: number;
  updatedAt: number;
}

const buckets = new Map<string, Bucket>();
const DEFAULT_LIMIT = 60;
const DEFAULT_WINDOW_MS = 60_000;
const MAX_BUCKETS = 20_000;

/**
 * Fixed-capacity token bucket keyed by caller (ip + route).
 *
 * In-memory: correct for a single instance. For multiple instances/serverless,
 * move this behind a shared store (e.g. Redis) — the call site stays the same.
 */
export function enforceRateLimit(key: string, limit = DEFAULT_LIMIT, windowMs = DEFAULT_WINDOW_MS): void {
  const now = Date.now();

  if (buckets.size > MAX_BUCKETS) {
    // Bound memory: drop buckets that have fully refilled.
    for (const [k, b] of buckets) {
      if (now - b.updatedAt > windowMs) buckets.delete(k);
    }
  }

  const refillPerMs = limit / windowMs;
  const bucket = buckets.get(key) ?? { tokens: limit, updatedAt: now };
  const refilled = Math.min(limit, bucket.tokens + (now - bucket.updatedAt) * refillPerMs);

  if (refilled < 1) {
    buckets.set(key, { tokens: refilled, updatedAt: now });
    throw rateLimited("Too many requests. Please slow down and try again shortly.");
  }

  buckets.set(key, { tokens: refilled - 1, updatedAt: now });
}
