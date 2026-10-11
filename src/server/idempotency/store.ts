import "server-only";
import { query } from "@/server/db/pool";

export type ReserveOutcome =
  | { kind: "reserved" }
  | { kind: "replay"; status: number; body: string }
  | { kind: "in-progress" };

/**
 * Reserves an idempotency key for a request scope. A concurrent duplicate that
 * arrives while the first is still running is reported as `in-progress` rather
 * than being executed twice.
 */
export async function reserveIdempotency(key: string, scope: string): Promise<ReserveOutcome> {
  const inserted = await query(
    `insert into idempotency_keys (key, scope) values ($1, $2) on conflict (key, scope) do nothing returning key`,
    [key, scope]
  );
  if ((inserted.rowCount ?? 0) > 0) return { kind: "reserved" };

  const existing = await query<{ status: number | null; body: string | null }>(
    `select status, body from idempotency_keys where key = $1 and scope = $2`,
    [key, scope]
  );
  const row = existing.rows[0];
  if (row && row.status !== null) return { kind: "replay", status: row.status, body: row.body ?? "null" };
  return { kind: "in-progress" };
}

export async function completeIdempotency(key: string, scope: string, status: number, body: string): Promise<void> {
  await query(`update idempotency_keys set status = $3, body = $4 where key = $1 and scope = $2`, [
    key,
    scope,
    status,
    body,
  ]);
}

/** Releases an unreserved key after a failed attempt so a retry can proceed. */
export async function releaseIdempotency(key: string, scope: string): Promise<void> {
  await query(`delete from idempotency_keys where key = $1 and scope = $2 and status is null`, [key, scope]);
}
