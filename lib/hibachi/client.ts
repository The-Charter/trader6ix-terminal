/**
 * Hibachi REST client (server-side only — never import this from a client component).
 *
 * Credentials are read from environment variables so real keys never touch the
 * repo: HIBACHI_API_KEY / HIBACHI_API_SECRET / HIBACHI_ACCOUNT_ID.
 *
 * Signing follows Hibachi's documented scheme (api-doc.hibachi.xyz):
 *  - "trustless" accounts sign with ECDSA using HIBACHI_API_SECRET as the private key
 *  - "managed" accounts sign with HMAC-SHA256 using HIBACHI_API_SECRET as the secret
 *
 * /market/* and /ws/market endpoints are public and need no signature or key.
 * Everything else requires the `Authorization` header with HIBACHI_API_KEY.
 */
import { createHmac } from "crypto";
import { SigningKey, sha256 } from "ethers";

const API_BASE = process.env.HIBACHI_API_BASE_URL ?? "https://api.hibachi.xyz";
const DATA_API_BASE = process.env.HIBACHI_DATA_API_BASE_URL ?? "https://data-api.hibachi.xyz";
const ACCOUNT_TYPE = (process.env.HIBACHI_ACCOUNT_TYPE ?? "trustless") as "trustless" | "managed";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. Set it in .env.local — see .env.example for the full list of Hibachi vars.`
    );
  }
  return value;
}

/** Big-endian encode a bigint/number into `size` bytes. */
function beBytes(value: bigint | number, size: number): Buffer {
  const buf = Buffer.alloc(size);
  let v = BigInt(value);
  for (let i = size - 1; i >= 0; i--) {
    buf[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return buf;
}

/** Sign a payload buffer per account type. Returns a hex string (no 0x prefix removed). */
function signPayload(payload: Buffer): string {
  const secret = requireEnv("HIBACHI_API_SECRET");

  if (ACCOUNT_TYPE === "managed") {
    return createHmac("sha256", secret).update(payload).digest("hex");
  }

  // trustless: ECDSA over sha256(payload), canonical signature + recovery id appended
  const digest = sha256(payload);
  const signingKey = new SigningKey(secret.startsWith("0x") ? secret : `0x${secret}`);
  const sig = signingKey.sign(digest);
  // r (32) + s (32) + v/recovery id (1) = 65 bytes, per Hibachi's spec
  const recoveryId = sig.yParity; // 0 or 1
  return sig.r.slice(2) + sig.s.slice(2) + recoveryId.toString(16).padStart(2, "0");
}

async function hibachiFetch<T>(
  path: string,
  opts: { method?: string; body?: unknown; auth?: boolean; base?: string } = {}
): Promise<T> {
  const { method = "GET", body, auth = false, base = API_BASE } = opts;
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (auth) {
    headers["Authorization"] = requireEnv("HIBACHI_API_KEY");
  }

  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Hibachi ${method} ${path} failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}

// ---- Public market data (no auth) ----

export interface HibachiContract {
  symbol: string;
  id: number;
  underlyingDecimals: number;
  underlyingSymbol: string;
  settlementDecimals: number;
  settlementSymbol: string;
  status: "LIVE" | "DELISTED" | string;
}

export function getExchangeInfo() {
  return hibachiFetch<{ contracts: HibachiContract[] }>("/market/exchange-info");
}

export function getOrderbook(symbol: string, depth = 25) {
  return hibachiFetch<{ bids: [string, string][]; asks: [string, string][] }>(
    `/market/orderbook?symbol=${encodeURIComponent(symbol)}&depth=${depth}`
  );
}

export function getKlines(symbol: string, interval: string, limit = 200) {
  return hibachiFetch(
    `/market/klines?symbol=${encodeURIComponent(symbol)}&interval=${interval}&limit=${limit}`,
    { base: DATA_API_BASE }
  );
}

// ---- Authenticated account/trade endpoints ----

export function getAccountInfo() {
  const accountId = requireEnv("HIBACHI_ACCOUNT_ID");
  return hibachiFetch(`/account/info?accountId=${accountId}`, { auth: true });
}

export function getPendingOrders() {
  const accountId = requireEnv("HIBACHI_ACCOUNT_ID");
  return hibachiFetch(`/trade/orders?accountId=${accountId}`, { auth: true });
}

export interface PlaceOrderParams {
  symbol: string;
  contractId: number;
  side: "ASK" | "BID";
  quantity: bigint; // already scaled by underlyingDecimals
  price?: bigint; // already scaled per priceMultiplier; omit for market orders
  maxFeesPercent: number; // basis points, e.g. 20 = 0.2%
}

export async function placeOrder(params: PlaceOrderParams) {
  const accountId = requireEnv("HIBACHI_ACCOUNT_ID");
  const nonce = BigInt(Date.now()) * 1000n; // microsecond-ish unique nonce

  const parts = [
    beBytes(nonce, 8),
    beBytes(params.contractId, 4),
    beBytes(params.quantity, 8),
    beBytes(params.side === "ASK" ? 0 : 1, 4),
  ];
  if (params.price !== undefined) parts.push(beBytes(params.price, 8));
  parts.push(beBytes(Math.round(params.maxFeesPercent * 1e4), 8));

  const payload = Buffer.concat(parts);
  const signature = signPayload(payload);

  return hibachiFetch("/trade/order", {
    method: "POST",
    auth: true,
    body: {
      accountId,
      symbol: params.symbol,
      side: params.side,
      nonce: nonce.toString(),
      quantity: params.quantity.toString(),
      price: params.price?.toString(),
      maxFeesPercent: params.maxFeesPercent,
      signature,
    },
  });
}

export async function cancelOrder(orderId: string) {
  const accountId = requireEnv("HIBACHI_ACCOUNT_ID");
  const payload = beBytes(BigInt(orderId), 8);
  const signature = signPayload(payload);
  return hibachiFetch(`/trade/order`, {
    method: "DELETE",
    auth: true,
    body: { accountId, orderId, signature },
  });
}
