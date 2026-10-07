import "server-only";

const EXPLORER_BASE = `${process.env.NEXT_PUBLIC_ARC_EXPLORER_URL ?? "https://testnet.arcscan.app"}/api/v2`;

export interface ExplorerTokenBalance {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  rawValue: string;
}

export interface ExplorerTokenTransfer {
  txHash: string;
  logIndex: number;
  timestamp: string;
  from: string;
  to: string;
  method?: string;
  rawValue: string;
  decimals: number;
  tokenSymbol: string;
  tokenAddress: string;
}

interface RawTokenItem {
  value?: string;
  token?: { address_hash?: string; symbol?: string; name?: string; decimals?: string | null; type?: string };
}

interface RawTransferItem {
  transaction_hash?: string;
  log_index?: number;
  timestamp?: string;
  from?: { hash?: string };
  to?: { hash?: string };
  method?: string;
  total?: { value?: string; decimals?: string };
  token?: { address_hash?: string; symbol?: string; decimals?: string | null };
}

async function explorerFetch<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${EXPLORER_BASE}${path}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch (err) {
    throw new Error(`Could not reach the Arc explorer: ${err instanceof Error ? err.message : "network error"}`);
  }

  const rawText = await response.text();
  if (!response.ok) {
    throw new Error(`Arc explorer request failed: ${response.status} ${rawText.slice(0, 200)}`);
  }
  if (!rawText) {
    throw new Error(`Arc explorer returned an empty body with status ${response.status}.`);
  }

  try {
    return JSON.parse(rawText) as T;
  } catch {
    throw new Error(`Arc explorer returned non-JSON content: ${rawText.slice(0, 200)}`);
  }
}

/** ERC-20 token balances held by an address. */
export async function getTokenBalances(address: string): Promise<ExplorerTokenBalance[]> {
  const data = await explorerFetch<{ items?: RawTokenItem[] }>(`/addresses/${address}/tokens`);
  return (data.items ?? [])
    .filter((item) => item.token?.type === "ERC-20" && typeof item.value === "string")
    .map((item) => ({
      address: String(item.token?.address_hash ?? ""),
      symbol: String(item.token?.symbol ?? "UNKNOWN"),
      name: String(item.token?.name ?? item.token?.symbol ?? "Unknown"),
      decimals: Number(item.token?.decimals ?? 18),
      rawValue: String(item.value),
    }));
}

/** Most recent ERC-20 transfers involving an address. */
export async function getTokenTransfers(address: string): Promise<ExplorerTokenTransfer[]> {
  const data = await explorerFetch<{ items?: RawTransferItem[] }>(`/addresses/${address}/token-transfers`);
  return (data.items ?? []).map((item) => ({
    txHash: String(item.transaction_hash ?? ""),
    logIndex: Number(item.log_index ?? 0),
    timestamp: String(item.timestamp ?? ""),
    from: String(item.from?.hash ?? ""),
    to: String(item.to?.hash ?? ""),
    method: item.method,
    rawValue: String(item.total?.value ?? "0"),
    decimals: Number(item.total?.decimals ?? item.token?.decimals ?? 18),
    tokenSymbol: String(item.token?.symbol ?? "UNKNOWN"),
    tokenAddress: String(item.token?.address_hash ?? ""),
  }));
}
