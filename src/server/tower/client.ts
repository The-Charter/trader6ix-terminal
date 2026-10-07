import "server-only";
import type { TowerQuoteRequest, TowerQuoteResponse, TowerBuildTxRequest, TowerBuildTxResponse } from "@/lib/tower/types";

const API_BASE = process.env.TOWER_API_BASE_URL ?? "https://www.tower.exchange/api/public";

function requireApiKey(): string {
  const key = process.env.TOWER_API_KEY;
  if (!key) {
    throw new Error("Missing TOWER_API_KEY. Add it to your environment (server-side only, never NEXT_PUBLIC_).");
  }
  return key;
}

async function towerFetch<T>(path: string, body: unknown): Promise<T> {
  const apiKey = requireApiKey();

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch (err) {
    // Network-level failure (DNS, connection refused, etc.) — distinct from
    // an HTTP error response, and worth surfacing differently.
    throw new Error(`Could not reach Tower API — ${err instanceof Error ? err.message : "network error"}`);
  }

  const rawText = await res.text();

  if (res.status === 401) {
    throw new Error("Tower API key is invalid, missing, or revoked (401).");
  }
  if (res.status === 403) {
    throw new Error("Tower API key is missing a required permission/scope (403).");
  }
  if (res.status === 404) {
    throw new Error("Tower reports insufficient liquidity or an unsupported route (404).");
  }
  if (!res.ok) {
    // Deliberately not including the Authorization header or key in this
    // message — only the response body, which is Tower's own text.
    throw new Error(`Tower ${path} failed: ${res.status} — ${rawText.slice(0, 300) || "(empty body)"}`);
  }
  if (!rawText) {
    throw new Error(`Tower ${path} returned an empty body with status ${res.status}.`);
  }

  try {
    return JSON.parse(rawText) as T;
  } catch {
    throw new Error(`Tower ${path} returned non-JSON content: ${rawText.slice(0, 300)}`);
  }
}

export function getTowerQuote(req: TowerQuoteRequest): Promise<TowerQuoteResponse> {
  return towerFetch<TowerQuoteResponse>("/swap/quote", req);
}

export function buildTowerSwapTx(req: TowerBuildTxRequest): Promise<TowerBuildTxResponse> {
  return towerFetch<TowerBuildTxResponse>("/swap/build-tx", req);
}
