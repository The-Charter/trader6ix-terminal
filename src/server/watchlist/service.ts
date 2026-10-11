import "server-only";
import * as repository from "./repository";
import { notFound } from "@/server/http/errors";
import type { WatchlistItem } from "./types";

export async function list(userId: string): Promise<WatchlistItem[]> {
  return repository.listByUser(userId);
}

export async function add(userId: string, symbol: string): Promise<WatchlistItem> {
  return repository.upsert(userId, symbol.toUpperCase());
}

export async function get(id: string, userId: string): Promise<WatchlistItem> {
  const item = await repository.findById(id, userId);
  if (!item) throw notFound("Watchlist item not found.");
  return item;
}

export async function remove(id: string, userId: string): Promise<void> {
  const removed = await repository.remove(id, userId);
  if (!removed) throw notFound("Watchlist item not found.");
}
