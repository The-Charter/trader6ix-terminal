import "server-only";
import { ethers } from "ethers";
import { ARC_RPC_URL, IS_ARC_MAINNET } from "@/lib/arc-network";
import { ARC_BALANCE_TOKENS, ARC_TOKENS } from "@/lib/arc-tokens";

/**
 * Arc data layer, read straight from the chain over JSON-RPC.
 *
 * Why not the explorer API: on Arc mainnet `explorer.arc.io` sits behind a
 * Cloudflare challenge that answers server-to-server calls with 403, so the
 * indexed endpoints are unusable from a backend. Balances are read with
 * `eth_call` and history with paged `eth_getLogs`, which needs no third party.
 *
 * The public RPC rejects an `eth_getLogs` range wider than ~5,000 blocks and Arc
 * produces a block every ~0.5s, so history is scanned in 5,000-block pages
 * (≈43 minutes each) and stops as soon as it has enough transfers. Results are
 * cached briefly because the UI polls.
 */

/**
 * The public Arc RPC rate-limits `eth_getLogs` aggressively (JSON-RPC -32005).
 * Measured 2026-10: a burst of 6 in parallel yields only 2 successes, while the
 * same 6 run sequentially all succeed. Against the public endpoint queries are
 * therefore serialised and retried with backoff.
 */
const LOG_CONCURRENCY = 1;
const LOG_RETRIES = 3;
const RETRY_DELAYS_MS = [400, 900, 1800];
/**
 * Stop paging after this many consecutive empty pages. A wallet with no recent
 * history should not cost the full scan, while an active one keeps paging.
 */
const MAX_CONSECUTIVE_EMPTY_PAGES = 2;
/** Enough for the activity feed and the trades table. */
const MAX_TRANSFERS = 60;
/** Bound on block-header lookups per scan; anything beyond falls back to an estimate. */
const MAX_BLOCK_LOOKUPS = 48;
const MAX_TX_LOOKUPS = 40;
const CACHE_TTL_MS = 45_000;
/** Measured 2026-10: 10,000 Arc mainnet blocks span 5,153 seconds. */
const ARC_BLOCK_SECONDS = 0.5153;

const TRANSFER_TOPIC = ethers.id("Transfer(address,address,uint256)");
const TRANSFER_IFACE = new ethers.Interface([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);
const ERC20_IFACE = new ethers.Interface(["function balanceOf(address) view returns (uint256)"]);

export interface TokenBalance {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  rawValue: string;
}

export interface TokenTransfer {
  txHash: string;
  logIndex: number;
  /** ISO timestamp derived from the block that included the log. */
  timestamp: string;
  from: string;
  to: string;
  /** 4-byte method selector of the enclosing transaction, when resolvable. */
  method?: string;
  rawValue: string;
  decimals: number;
  tokenSymbol: string;
  tokenAddress: string;
}

let provider: ethers.JsonRpcProvider | null = null;

/**
 * Server-side RPC endpoint.
 *
 * Prefers `ARC_RPC_URL`, which is deliberately NOT a NEXT_PUBLIC_ variable: a
 * dedicated provider URL normally carries an API key, and NEXT_PUBLIC_ values
 * are compiled into the browser bundle. Every chain read happens here, so the
 * keyed URL never needs to reach a client. The public endpoint stays the
 * fallback, and the browser keeps using the public one for wallet chain config.
 */
const SERVER_RPC_URL = process.env.ARC_RPC_URL || ARC_RPC_URL;
const USING_DEDICATED_RPC = Boolean(process.env.ARC_RPC_URL);

/**
 * A dedicated provider is not capped at two concurrent `eth_getLogs`, so the
 * scan fans out instead of serialising, and its documented range limit is
 * larger. Both are measured, not assumed: QuickNode answers a 6-way burst 6/6
 * (the public endpoint manages 2/6) and rejects ranges above 10,000 blocks with
 * JSON-RPC -32614, while the public endpoint rejects anything above 5,000.
 */
const LOG_FANOUT = USING_DEDICATED_RPC ? 4 : LOG_CONCURRENCY;
/** Widest `eth_getLogs` range the active endpoint accepts. */
const MAX_RANGE = USING_DEDICATED_RPC ? 10_000 : 5_000;
/** Endpoint-dependent paging depth (~1.4h per page at 10k blocks, ~0.7h at 5k). */
const HISTORY_PAGES = USING_DEDICATED_RPC ? 6 : 4;

/**
 * Provider URLs carry an API key and ethers puts the request URL inside some
 * error objects, so anything logged from this module is redacted first. An
 * endpoint key must never reach a log aggregator.
 */
const RPC_SECRET = (() => {
  try {
    const segments = new URL(SERVER_RPC_URL).pathname.split("/").filter(Boolean);
    return segments.length > 0 ? segments[segments.length - 1] : "";
  } catch {
    return "";
  }
})();

function redactRpc(text: string): string {
  if (!USING_DEDICATED_RPC) return text;
  let safe = text.split(SERVER_RPC_URL).join("<rpc-endpoint>");
  if (RPC_SECRET.length > 6) safe = safe.split(RPC_SECRET).join("<redacted>");
  return safe;
}

function getProvider(): ethers.JsonRpcProvider {
  if (!provider) {
    // staticNetwork skips a chain-id round trip on every request.
    provider = new ethers.JsonRpcProvider(SERVER_RPC_URL, undefined, { staticNetwork: true });
  }
  return provider;
}

/** True when a dedicated provider is configured (drives the retry budget). */
export function hasDedicatedRpc(): boolean {
  return USING_DEDICATED_RPC;
}

function isRateLimited(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return message.includes("rate limit") || message.includes("-32005") || message.includes("429");
}

/** `eth_getLogs` with backoff, so one rate-limited page cannot sink a whole scan. */
async function getLogsWithRetry(filter: ethers.Filter): Promise<{ logs: ethers.Log[]; failed: boolean }> {
  const rpc = getProvider();

  for (let attempt = 0; attempt <= LOG_RETRIES; attempt++) {
    try {
      return { logs: await rpc.getLogs(filter), failed: false };
    } catch (err) {
      const rateLimited = isRateLimited(err);
      if (!rateLimited) {
        console.warn("getLogs failed:", redactRpc(err instanceof Error ? err.message : String(err)));
        return { logs: [], failed: true };
      }
      if (attempt < LOG_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
        continue;
      }
      console.warn("getLogs still rate limited after retries.");
      return { logs: [], failed: true };
    }
  }

  return { logs: [], failed: true };
}

/** Runs async work with bounded concurrency, preserving order. */
async function mapLimited<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  for (let index = 0; index < items.length; index += limit) {
    const batch = items.slice(index, index + limit);
    results.push(...(await Promise.all(batch.map(fn))));
  }
  return results;
}

/** `eth_call` with backoff — the same quota that throttles getLogs also throttles reads. */
async function callWithRetry(to: string, data: string): Promise<string> {
  const rpc = getProvider();

  for (let attempt = 0; attempt <= LOG_RETRIES; attempt++) {
    try {
      return await rpc.call({ to, data });
    } catch (err) {
      if (attempt === LOG_RETRIES) throw err;
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)]));
    }
  }

  throw new Error("unreachable");
}

export interface TokenBalancesResult {
  balances: TokenBalance[];
  /** How many assets could not be read — NOT how many are zero. */
  unavailable: number;
}

/**
 * ERC-20 balances for the trusted token set.
 *
 * Reads are sequential and retried: firing them alongside the log scan was
 * enough to trip the RPC's rate limit, and the failure used to be swallowed
 * into a zero — which the UI cannot tell apart from an empty wallet. An asset we
 * could not read is now omitted and counted instead.
 */
export async function getTokenBalances(address: string): Promise<TokenBalancesResult> {
  const data = ERC20_IFACE.encodeFunctionData("balanceOf", [address]);
  const balances: TokenBalance[] = [];
  let unavailable = 0;

  for (const token of ARC_BALANCE_TOKENS) {
    try {
      const raw = await callWithRetry(token.address, data);
      const value = ERC20_IFACE.decodeFunctionResult("balanceOf", raw)[0] as bigint;
      balances.push({
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        rawValue: value.toString(),
      });
    } catch (err) {
      unavailable += 1;
      console.warn(
        `balanceOf failed for ${token.symbol} (${token.address}):`,
        redactRpc(err instanceof Error ? err.message : String(err))
      );
    }
  }

  if (unavailable === ARC_BALANCE_TOKENS.length) {
    // Reporting an empty portfolio here would be indistinguishable from a wallet
    // that genuinely holds nothing.
    throw new Error("Arc's RPC did not answer balance requests. Please retry shortly.");
  }

  return { balances, unavailable };
}

// --- caches -----------------------------------------------------------------

const transferCache = new Map<string, { at: number; value: TokenTransfer[] }>();
/** Scans currently running, so concurrent callers share one chain scan. */
const inFlightScans = new Map<string, Promise<TokenTransfer[]>>();
const blockTimeCache = new Map<number, number>();
const txMethodCache = new Map<string, string | undefined>();
let headCache: { at: number; blockNumber: number; timestamp: number } | null = null;

function rememberBlockTime(blockNumber: number, timestamp: number): void {
  if (blockTimeCache.size > 1_000) blockTimeCache.clear();
  blockTimeCache.set(blockNumber, timestamp);
}

async function head(): Promise<{ blockNumber: number; timestamp: number }> {
  if (headCache && Date.now() - headCache.at < 10_000) return headCache;
  const rpc = getProvider();
  const blockNumber = await rpc.getBlockNumber();
  const block = await rpc.getBlock(blockNumber);
  const value = { at: Date.now(), blockNumber, timestamp: block?.timestamp ?? Math.floor(Date.now() / 1000) };
  headCache = value;
  rememberBlockTime(blockNumber, value.timestamp);
  return value;
}

/** Resolves block timestamps, preferring real headers and falling back to the measured rate. */
async function resolveTimestamps(
  blockNumbers: number[],
  anchor: { blockNumber: number; timestamp: number }
): Promise<Map<number, number>> {
  const rpc = getProvider();
  const resolved = new Map<number, number>();
  const missing: number[] = [];

  for (const blockNumber of new Set(blockNumbers)) {
    const cached = blockTimeCache.get(blockNumber);
    if (cached !== undefined) resolved.set(blockNumber, cached);
    else missing.push(blockNumber);
  }

  const lookups = missing.slice(0, MAX_BLOCK_LOOKUPS);
  await Promise.all(
    lookups.map(async (blockNumber) => {
      try {
        const block = await rpc.getBlock(blockNumber);
        if (block) {
          resolved.set(blockNumber, block.timestamp);
          rememberBlockTime(blockNumber, block.timestamp);
        }
      } catch {
        /* the estimate below covers it */
      }
    })
  );

  for (const blockNumber of missing) {
    if (resolved.has(blockNumber)) continue;
    const estimate = anchor.timestamp - (anchor.blockNumber - blockNumber) * ARC_BLOCK_SECONDS;
    resolved.set(blockNumber, Math.floor(estimate));
  }

  return resolved;
}

async function resolveMethods(txHashes: string[]): Promise<Map<string, string | undefined>> {
  const rpc = getProvider();
  const resolved = new Map<string, string | undefined>();
  const missing: string[] = [];

  for (const hash of new Set(txHashes)) {
    if (txMethodCache.has(hash)) resolved.set(hash, txMethodCache.get(hash));
    else missing.push(hash);
  }

  await Promise.all(
    missing.slice(0, MAX_TX_LOOKUPS).map(async (hash) => {
      try {
        const tx = await rpc.getTransaction(hash);
        const selector = tx?.data && tx.data.length >= 10 ? tx.data.slice(0, 10) : undefined;
        if (txMethodCache.size > 1_000) txMethodCache.clear();
        txMethodCache.set(hash, selector);
        resolved.set(hash, selector);
      } catch {
        /* selector is a display hint — never fail the feed over it */
      }
    })
  );

  return resolved;
}

/**
 * Recent ERC-20 transfers in and out of `address`, newest first.
 *
 * Scans the trusted token set page by page (newest first) and stops as soon as
 * it has MAX_TRANSFERS logs, so a busy wallet costs one page (6 log queries)
 * rather than six.
 */
/**
 * Arc's native USDC system emitter (EIP-7708).
 *
 * It logs EVERY USDC movement — plain native sends, ERC-20 transfers, mints and
 * burns — at 18 decimals. A plain native send emits nothing else, which is why
 * reading only the ERC-20 contract silently misses them: a wallet was funded
 * with 1 USDC by native send and the activity feed showed nothing at all.
 *
 * The ERC-20 contract at 0x3600…00 also logs its own 6-decimal Transfer for
 * ERC-20 calls, so querying BOTH emitters double-counts every ERC-20 movement.
 * USDC history therefore comes from this emitter alone. Mainnet has used it
 * since genesis; testnet only after the Zero5 fork, so testnet keeps reading the
 * ERC-20 contract until that is confirmed on-chain.
 */
const NATIVE_USDC_EMITTER = "0xffffFFFfFFffffffffffffffFfFFFfffFFFfFFfE";

interface HistorySource {
  /** Emitter address to query. */
  emitter: string;
  /** The token's canonical ERC-20 address — what trust checks and the UI use. */
  address: string;
  symbol: string;
  /** Decimals of the values THIS emitter returns (18 for the system log). */
  decimals: number;
}

const HISTORY_SOURCES: HistorySource[] = ARC_TOKENS.map((token) =>
  IS_ARC_MAINNET && token.symbol.toUpperCase() === "USDC"
    ? { emitter: NATIVE_USDC_EMITTER, address: token.address, symbol: token.symbol, decimals: 18 }
    : { emitter: token.address, address: token.address, symbol: token.symbol, decimals: token.decimals }
);

function sourceForEmitter(emitter: string): HistorySource | undefined {
  const lower = emitter.toLowerCase();
  return HISTORY_SOURCES.find((source) => source.emitter.toLowerCase() === lower);
}

async function scanTransfers(wallet: string): Promise<TokenTransfer[]> {
  const anchor = await head();
  const padded = ethers.zeroPadValue(wallet, 32);
  const logs: ethers.Log[] = [];
  let attempted = 0;
  let failed = 0;
  let emptyPages = 0;

  for (let page = 0; page < HISTORY_PAGES; page++) {
    const toBlock = anchor.blockNumber - page * MAX_RANGE;
    if (toBlock <= 0) break;
    const fromBlock = Math.max(0, toBlock - MAX_RANGE + 1);

    const filters = HISTORY_SOURCES.flatMap((source) => [
      { address: source.emitter, topics: [TRANSFER_TOPIC, padded], fromBlock, toBlock },
      { address: source.emitter, topics: [TRANSFER_TOPIC, null, padded], fromBlock, toBlock },
    ]);

    const before = logs.length;
    const pages = await mapLimited(filters, LOG_FANOUT, getLogsWithRetry);
    for (const pageResult of pages) {
      attempted += 1;
      if (pageResult.failed) failed += 1;
      logs.push(...pageResult.logs);
    }

    emptyPages = logs.length === before ? emptyPages + 1 : 0;
    if (emptyPages >= MAX_CONSECUTIVE_EMPTY_PAGES) break;
    if (logs.length >= MAX_TRANSFERS) break;
  }

  if (attempted > 0 && failed === attempted) {
    // Reporting an empty feed here would be indistinguishable from "this wallet
    // has no activity", which is a lie. Surface it instead.
    throw new Error("Arc's public RPC is rate limiting history requests. Please retry shortly.");
  }

  // Newest first, deduped (a self-transfer matches both directions).
  const unique = new Map<string, ethers.Log>();
  for (const log of logs) unique.set(`${log.transactionHash}-${log.index}`, log);
  const selected = [...unique.values()].sort((a, b) => b.blockNumber - a.blockNumber).slice(0, MAX_TRANSFERS);

  const timestamps = await resolveTimestamps(
    selected.map((log) => log.blockNumber),
    anchor
  );
  const methods = await resolveMethods(selected.map((log) => log.transactionHash));

  return selected.flatMap((log) => {
    const parsed = TRANSFER_IFACE.parseLog({ topics: [...log.topics], data: log.data });
    if (!parsed) return [];
    const timestamp = timestamps.get(log.blockNumber) ?? anchor.timestamp;
    const source = sourceForEmitter(String(log.address));
    return [
      {
        txHash: log.transactionHash,
        logIndex: log.index,
        timestamp: new Date(timestamp * 1000).toISOString(),
        from: String(parsed.args[0]),
        to: String(parsed.args[1]),
        method: methods.get(log.transactionHash),
        rawValue: String(parsed.args[2]),
        // Decimals belong to the EMITTER that produced the value: the system log
        // reports 18-decimal amounts, the ERC-20 contract 6.
        decimals: source?.decimals ?? 18,
        tokenSymbol: source?.symbol ?? "UNKNOWN",
        // Always report the canonical token address, never the system emitter,
        // so trust checks and token lookups in the routes keep working.
        tokenAddress: source?.address ?? String(log.address),
      },
    ];
  });
}

/**
 * Recent transfers for an address.
 *
 * Cached briefly, and de-duplicated while in flight: the portfolio page asks
 * for activity and trades simultaneously, and without this both would scan the
 * chain at once, double the RPC traffic and trip the rate limit for each other.
 */
export async function getTokenTransfers(address: string): Promise<TokenTransfer[]> {
  const key = address.toLowerCase();

  const cached = transferCache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;

  const running = inFlightScans.get(key);
  if (running) return running;

  const scan = scanTransfers(key)
    .then((value) => {
      if (transferCache.size > 200) transferCache.clear();
      transferCache.set(key, { at: Date.now(), value });
      return value;
    })
    .finally(() => {
      inFlightScans.delete(key);
    });

  inFlightScans.set(key, scan);
  return scan;
}
