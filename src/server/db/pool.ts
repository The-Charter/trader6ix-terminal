import "server-only";
import { Pool, type QueryResult, type QueryResultRow } from "pg";

let pool: Pool | undefined;

/**
 * Pool size. A serverless function runs as many short-lived instances, so a
 * large per-instance pool multiplies into connection pressure on the pooler; a
 * long-lived server can afford more. Either way the pooled (6543) connection
 * string is the right one here — it is built for exactly this pattern.
 */
const DEFAULT_POOL_MAX = process.env.VERCEL ? 2 : 10;

/** Lazily creates the Postgres pool so importing this module never throws at build time. */
export function getPool(): Pool {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL. Add a Postgres connection string to .env.local.");
  }

  pool = new Pool({
    connectionString,
    max: Number(process.env.DATABASE_POOL_MAX ?? DEFAULT_POOL_MAX),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
  pool.on("error", (err) => console.error("Postgres pool error:", err.message));
  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, params);
}
