import "server-only";
import type {
  TowerQuoteRequest,
  TowerQuoteResponse,
  TowerBuildTxRequest,
  TowerBuildTxResponse,
  TowerTokensResponse,
  TowerPricesResponse,
  TowerDexesResponse,
} from "@/lib/tower/types";
import { TowerApiError, messageForTowerError } from "./errors";

const API_BASE = process.env.TOWER_API_BASE_URL ?? "https://www.tower.exchange/api/public";

function requireApiKey(): string {
  const key = process.env.TOWER_API_KEY;
  if (!key) {
    throw new TowerApiError(
      "Missing TOWER_API_KEY. Add it to your environment (server-side only, never NEXT_PUBLIC_).",
      500
    );
  }
  return key;
}

interface TowerRequestOptions {
  method?: "GET" | "POST";
  body?: unknown;
}

interface TowerErrorPayload {
  error?: unknown;
  code?: unknown;
}

function parseErrorPayload(text: string): TowerErrorPayload | null {
  try {
    const parsed = JSON.parse(text);
    return typeof parsed === "object" && parsed !== null ? (parsed as TowerErrorPayload) : null;
  } catch {
    return null;
  }
}

async function towerFetch<T>(path: string, options: TowerRequestOptions = {}): Promise<T> {
  const { method = "GET", body } = options;
  const apiKey = requireApiKey();

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch (err) {
    throw new TowerApiError(
      `Could not reach Tower API: ${err instanceof Error ? err.message : "network error"}`,
      502
    );
  }

  const rawText = await response.text();

  if (!response.ok) {
    const payload = parseErrorPayload(rawText);
    const code = typeof payload?.code === "string" ? payload.code : undefined;
    const upstream = typeof payload?.error === "string" ? payload.error : rawText;
    // Never include the Authorization header or the key in any message.
    throw new TowerApiError(messageForTowerError(code, upstream, response.status), response.status, code);
  }

  if (!rawText) {
    throw new TowerApiError(`Tower returned an empty body with status ${response.status}.`, 502);
  }

  try {
    return JSON.parse(rawText) as T;
  } catch {
    throw new TowerApiError(`Tower returned non-JSON content: ${rawText.slice(0, 300)}`, 502);
  }
}

export function getTowerQuote(request: TowerQuoteRequest): Promise<TowerQuoteResponse> {
  return towerFetch<TowerQuoteResponse>("/swap/quote", { method: "POST", body: request });
}

export function buildTowerSwapTx(request: TowerBuildTxRequest): Promise<TowerBuildTxResponse> {
  return towerFetch<TowerBuildTxResponse>("/swap/build-tx", { method: "POST", body: request });
}

export function getTowerTokens(): Promise<TowerTokensResponse> {
  return towerFetch<TowerTokensResponse>("/tokens");
}

export function getTowerPrices(): Promise<TowerPricesResponse> {
  return towerFetch<TowerPricesResponse>("/prices");
}

export function getTowerDexes(): Promise<TowerDexesResponse> {
  return towerFetch<TowerDexesResponse>("/swap/dexes");
}
