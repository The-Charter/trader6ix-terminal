/**
 * Server-side Circle StableFX client. Confirmed real endpoint per Circle's
 * developer docs: POST {base}/v1/exchange/stablefx/quotes.
 *
 * Requires STABLEFX_API_KEY — issued only after Circle's KYB/AML verification.
 * Until then, calls will fail with a clear "missing env var" error rather than
 * silently doing nothing.
 */

const API_BASE = process.env.STABLEFX_API_BASE_URL ?? "https://api-sandbox.circle.com";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. StableFX requires a Circle-issued API key (KYB/AML gated) — see .env.example.`
    );
  }
  return value;
}

async function stableFxFetch<T>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const apiKey = requireEnv("STABLEFX_API_KEY");
  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });

  const rawText = await res.text();
  if (!res.ok) {
    throw new Error(`StableFX ${opts.method ?? "GET"} ${path} failed: ${res.status} — ${rawText.slice(0, 300) || "(empty body)"}`);
  }
  if (!rawText) {
    throw new Error(`StableFX ${path} returned an empty body with status ${res.status}.`);
  }
  return JSON.parse(rawText) as T;
}

export interface StableFxQuoteRequest {
  base: string;
  quote: string;
  side: "buy" | "sell";
  amount: string;
}

export function createQuote(input: StableFxQuoteRequest) {
  return stableFxFetch("/v1/exchange/stablefx/quotes", { method: "POST", body: input });
}

// TODO: the exact trade-creation and status-polling paths past the quote step
// weren't independently confirmed the way /quotes was — verify these against
// your actual API key's docs once issued, and adjust if the real paths differ.
export function createTrade(quoteId: string) {
  return stableFxFetch("/v1/exchange/stablefx/trades", { method: "POST", body: { quoteId } });
}

export function getTrade(tradeId: string) {
  return stableFxFetch(`/v1/exchange/stablefx/trades/${tradeId}`);
}
