import "server-only";
import { ethers } from "ethers";
import { ARC_RPC_URL } from "@/lib/arc-network";
import { ARC_BALANCE_TOKENS } from "@/lib/arc-tokens";

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

/** Largest log range the public Arc RPC accepts (verified: 5,000 ok, 10,000 rejected). */
const MAX_LOG_RANGE = 5_000;
/** How far back to page when a wallet has little history (6 pages ≈ 4.3 hours). */
const HISTORY_PAGES = 6;
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

function getProvider(): ethers.JsonRpcProvider {
  if (!provider) {
    // staticNetwork skips a chain-id round trip on every request.
    provider = new ethers.JsonRpcProvider(ARC_RPC_URL, undefined, { staticNetwork: true });
  }
  return provider;
}

/** ERC-20 balances for the trusted token set. */
export async function getTokenBalances(address: string): Promise<TokenBalance[]> {
  const rpc = getProvider();
  const data = ERC20_IFACE.encodeFunctionData("balanceOf", [address]);

  const balances = await Promise.all(
    ARC_BALANCE_TOKENS.map(async (token) => {
      try {
        const raw = await rpc.call({ to: token.address, data });
        const value = ERC20_IFACE.decodeFunctionResult("balanceOf", raw)[0] as bigint;
        return { token, value };
      } catch (err) {
        // A reverting or absent contract must not take the whole portfolio down.
        console.warn(
          `balanceOf failed for ${token.symbol} (${token.address}):`,
          err instanceof Error ? err.message : err
        );
        return { token, value: 0n };
      }
    })
  );

  return balances.map(({ token, value }) => ({
    address: token.address,
    symbol: token.symbol,
    name: token.name,
    decimals: token.decimals,
    rawValue: value.toString(),
  }));
}

// --- caches -----------------------------------------------------------------

const transferCache = new Map<string, { at: number; value: TokenTransfer[] }>();
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
async function scanTransfers(wallet: string): Promise<TokenTransfer[]> {
  const rpc = getProvider();
  const anchor = await head();
  const padded = ethers.zeroPadValue(wallet, 32);
  const logs: ethers.Log[] = [];

  for (let page = 0; page < HISTORY_PAGES; page++) {
    const toBlock = anchor.blockNumber - page * MAX_LOG_RANGE;
    if (toBlock <= 0) break;
    const fromBlock = Math.max(0, toBlock - MAX_LOG_RANGE + 1);

    const filters = ARC_BALANCE_TOKENS.flatMap((token) => [
      { address: token.address, topics: [TRANSFER_TOPIC, padded], fromBlock, toBlock },
      { address: token.address, topics: [TRANSFER_TOPIC, null, padded], fromBlock, toBlock },
    ]);

    const pages = await Promise.all(
      filters.map((filter) =>
        rpc.getLogs(filter).catch((err) => {
          console.warn(
            `getLogs failed for blocks ${fromBlock}-${toBlock}:`,
            err instanceof Error ? err.message : err
          );
          return [] as ethers.Log[];
        })
      )
    );

    logs.push(...pages.flat());
    if (logs.length >= MAX_TRANSFERS) break;
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
    return [
      {
        txHash: log.transactionHash,
        logIndex: log.index,
        timestamp: new Date(timestamp * 1000).toISOString(),
        from: String(parsed.args[0]),
        to: String(parsed.args[1]),
        method: methods.get(log.transactionHash),
        rawValue: String(parsed.args[2]),
        decimals: decimalsFor(String(log.address)),
        tokenSymbol: symbolFor(String(log.address)),
        tokenAddress: String(log.address),
      },
    ];
  });
}

function tokenFor(address: string) {
  const lower = address.toLowerCase();
  return ARC_BALANCE_TOKENS.find((token) => token.address.toLowerCase() === lower);
}

function symbolFor(address: string): string {
  return tokenFor(address)?.symbol ?? "UNKNOWN";
}

function decimalsFor(address: string): number {
  return tokenFor(address)?.decimals ?? 18;
}

/** Recent ERC-20 transfers for an address (cached briefly — the UI polls). */
export async function getTokenTransfers(address: string): Promise<TokenTransfer[]> {
  const key = address.toLowerCase();
  const cached = transferCache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;

  const value = await scanTransfers(key);
  if (transferCache.size > 200) transferCache.clear();
  transferCache.set(key, { at: Date.now(), value });
  return value;
}
