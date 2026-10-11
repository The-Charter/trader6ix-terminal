import "server-only";
import { query } from "@/server/db/pool";
import type { WatchlistItem } from "./types";

interface WatchlistRow {
  id: string;
  user_id: string;
  symbol: string;
  created_at: Date;
}

function mapItem(row: WatchlistRow): WatchlistItem {
  return { id: row.id, userId: row.user_id, symbol: row.symbol, createdAt: row.created_at.toISOString() };
}

export async function listByUser(userId: string): Promise<WatchlistItem[]> {
  const res = await query<WatchlistRow>(
    `select id, user_id, symbol, created_at from watchlist_items where user_id = $1 order by created_at desc`,
    [userId]
  );
  return res.rows.map(mapItem);
}

/** Upserts (user, symbol); returns the existing row when it already exists. */
export async function upsert(userId: string, symbol: string): Promise<WatchlistItem> {
  const res = await query<WatchlistRow>(
    `insert into watchlist_items (user_id, symbol) values ($1, $2)
     on conflict (user_id, symbol) do update set symbol = excluded.symbol
     returning id, user_id, symbol, created_at`,
    [userId, symbol]
  );
  return mapItem(res.rows[0]);
}

export async function findById(id: string, userId: string): Promise<WatchlistItem | null> {
  const res = await query<WatchlistRow>(
    `select id, user_id, symbol, created_at from watchlist_items where id = $1 and user_id = $2`,
    [id, userId]
  );
  return res.rows[0] ? mapItem(res.rows[0]) : null;
}

export async function remove(id: string, userId: string): Promise<boolean> {
  const res = await query(`delete from watchlist_items where id = $1 and user_id = $2`, [id, userId]);
  return (res.rowCount ?? 0) > 0;
}
