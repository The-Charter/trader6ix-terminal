import "server-only";
import { query } from "@/server/db/pool";

export type ReserveOutcome =
  | { kind: "reserved" }
  | { kind: "replay"; status: number; body: string }
  | { kind: "in-progress" }
  | { kind: "mismatch" };

/** How long a completed response stays replayable. */
const TTL_HOURS = 24;

interface IdempotencyRow {
  status: number | null;
  body: string | null;
  request_hash: string | null;
  expired: boolean;
}

/** Deletes expired entries. Best effort: never throws, never blocks a request. */
export async function purgeExpired(): Promise<void> {
  try {
    await query(`delete from idempotency_keys where expires_at < now()`);
  } catch (err) {
    console.warn("Idempotency purge failed:", err instanceof Error ? err.message : err);
  }
}

/**
 * Reserves an idempotency key for a request scope.
 *
 * `requestHash` binds the key to the exact request payload, so replaying a key
 * with a *different* body is rejected instead of silently returning an
 * unrelated stored response — the failure mode that would matter most on a
 * fund-moving call, where a mis-reused key could look like the original
 * transaction had already succeeded.
 *
 * A concurrent duplicate that arrives while the first is still running is
 * reported as `in-progress` rather than being executed twice.
 */
export async function reserveIdempotency(
  key: string,
  scope: string,
  requestHash: string
): Promise<ReserveOutcome> {
  // Two passes: the first may lose a race against a purge or a rolled-back
  // attempt, in which case the key is genuinely free again.
  for (let attempt = 0; attempt < 2; attempt++) {
    const inserted = await query(
      `insert into idempotency_keys (key, scope, request_hash, expires_at)
       values ($1, $2, $3, now() + make_interval(hours => $4::int))
       on conflict (key, scope) do nothing
       returning key`,
      [key, scope, requestHash, TTL_HOURS]
    );

    if ((inserted.rowCount ?? 0) > 0) {
      void purgeExpired();
      return { kind: "reserved" };
    }

    const existing = await query<IdempotencyRow>(
      `select status, body, request_hash, expires_at <= now() as expired
         from idempotency_keys
        where key = $1 and scope = $2`,
      [key, scope]
    );
    const row = existing.rows[0];

    if (!row) continue;

    if (row.expired) {
      await query(`delete from idempotency_keys where key = $1 and scope = $2 and expires_at <= now()`, [
        key,
        scope,
      ]);
      continue;
    }

    if (row.request_hash !== null && row.request_hash !== requestHash) {
      return { kind: "mismatch" };
    }
    if (row.status !== null) {
      return { kind: "replay", status: row.status, body: row.body ?? "null" };
    }
    return { kind: "in-progress" };
  }

  return { kind: "in-progress" };
}

export async function completeIdempotency(
  key: string,
  scope: string,
  status: number,
  body: string
): Promise<void> {
  await query(`update idempotency_keys set status = $3, body = $4 where key = $1 and scope = $2`, [
    key,
    scope,
    status,
    body,
  ]);
}

/** Releases an unfinished key (failed request or 5xx) so a retry can execute. */
export async function releaseIdempotency(key: string, scope: string): Promise<void> {
  await query(`delete from idempotency_keys where key = $1 and scope = $2 and status is null`, [key, scope]);
}
