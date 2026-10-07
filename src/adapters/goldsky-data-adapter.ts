import type { DataAdapter, PortfolioSnapshot, IndexedTransaction, IndexedTrade } from "./data-adapter";

/**
 * Goldsky indexes Arc directly (confirmed: goldsky.com/chains/arc) via a
 * subgraph you deploy against specific contract addresses/events — there's no
 * generic "give me all Arc data" endpoint. Getting this live requires:
 *   1. A free Goldsky account (no credit card) — sign up at goldsky.com
 *   2. Writing a subgraph manifest targeting the contracts we care about
 *      (USDC/EURC transfers, StableFX settlement events, Curve swap events,
 *      Hibachi-related onchain events if any)
 *   3. `goldsky login` + `goldsky subgraph deploy` from an authenticated CLI
 *      session — this has to run from your machine or CI, not from this
 *      sandbox, the same way Vercel/gh auth did earlier.
 *   4. Setting GOLDSKY_GRAPHQL_URL to the endpoint that deploy step returns.
 *
 * This adapter is a real GraphQL-fetch scaffold, not a mock — point it at a
 * real endpoint and it works, once the subgraph above actually exists.
 */

const ENDPOINT = process.env.NEXT_PUBLIC_GOLDSKY_GRAPHQL_URL ?? "";
const ENABLED = ENDPOINT.length > 0;

async function query<T>(gql: string, variables: Record<string, unknown>): Promise<T> {
  if (!ENABLED) {
    throw new Error(
      "Goldsky is not configured yet — deploy a subgraph and set NEXT_PUBLIC_GOLDSKY_GRAPHQL_URL."
    );
  }
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: gql, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0]?.message ?? "Goldsky query failed");
  return json.data as T;
}

export const goldskyDataAdapter: DataAdapter = {
  id: "goldsky",
  displayName: "Goldsky",
  isLive: ENABLED,

  async getPortfolio(walletAddress: string): Promise<PortfolioSnapshot> {
    // TODO: replace with the real query once the subgraph schema exists —
    // entity/field names below are placeholders matching the shape we need,
    // not a confirmed Goldsky schema.
    const data = await query<{ portfolio: PortfolioSnapshot }>(
      `query($wallet: String!) { portfolio(walletAddress: $wallet) { walletAddress totalUsdValue balances { symbol amount usdValue } } }`,
      { wallet: walletAddress }
    );
    return data.portfolio;
  },

  async getTransactionHistory(walletAddress: string, limit = 20): Promise<IndexedTransaction[]> {
    const data = await query<{ transactions: IndexedTransaction[] }>(
      `query($wallet: String!, $limit: Int!) { transactions(walletAddress: $wallet, first: $limit) { hash timestamp type summary } }`,
      { wallet: walletAddress, limit }
    );
    return data.transactions;
  },

  async getTradeHistory(walletAddress: string, limit = 20): Promise<IndexedTrade[]> {
    const data = await query<{ trades: IndexedTrade[] }>(
      `query($wallet: String!, $limit: Int!) { trades(walletAddress: $wallet, first: $limit) { venue symbol side quantity price timestamp pnl } }`,
      { wallet: walletAddress, limit }
    );
    return data.trades;
  },
};
