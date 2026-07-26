import type { ExchangeAdapter, AdapterMarket, PlaceOrderInput, PlaceOrderResult } from "./types";

/**
 * TEMPLATE — not a working adapter yet.
 *
 * This shows the shape a real onchain EVM perp DEX integration takes: instead of
 * calling a REST API like Hibachi, every method here would read from / write to
 * a deployed smart contract directly via the user's connected wallet (through
 * Privy's EIP-1193 provider), so there's no custodial API key at all — the
 * wallet itself signs every order.
 *
 * To make this real for a specific protocol, you need from that protocol's own
 * docs/deployment addresses:
 *   1. CONTRACT_ADDRESS — the deployed vault/market contract on their chain
 *   2. CONTRACT_ABI      — the ABI for position/order functions
 *   3. CHAIN_ID          — which EVM chain it's deployed on (may not be Arc)
 *   4. A subgraph or RPC-log-based way to read positions/orderbook, since most
 *      onchain perp protocols don't expose a REST API for market data at all —
 *      you either read events/state directly or use their subgraph.
 *
 * Duplicate this file per protocol (e.g. gmx-adapter.ts, vertex-adapter.ts) once
 * you've picked which ones to integrate — trying to hardcode "every EVM DEX" in
 * one generic file isn't realistic since each protocol's contract interface,
 * margin model, and data source are different.
 */

const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000"; // TODO: real deployed address
const CHAIN_ID = 0; // TODO: the chain this protocol is actually deployed on

export const onchainAdapterTemplate: ExchangeAdapter = {
  id: "onchain-template",
  displayName: "Onchain EVM Perp (template — not configured)",
  kind: "onchain",
  chainId: CHAIN_ID,
  supports: ["perps"],

  async getMarkets(): Promise<AdapterMarket[]> {
    throw new Error(
      "onchain-template adapter is a scaffold — set CONTRACT_ADDRESS/CHAIN_ID and implement getMarkets() against the real protocol's contract or subgraph before use."
    );
  },
  async getOrderbook() {
    throw new Error("Not configured — see comments in onchain-adapter-template.ts.");
  },
  async getKlines() {
    throw new Error("Not configured — see comments in onchain-adapter-template.ts.");
  },
  async getPositions() {
    throw new Error("Not configured — see comments in onchain-adapter-template.ts.");
  },
  async getOpenOrders() {
    throw new Error("Not configured — see comments in onchain-adapter-template.ts.");
  },
  async placeOrder(_input: PlaceOrderInput): Promise<PlaceOrderResult> {
    return { ok: false, error: "onchain-template adapter is a scaffold — not wired to a real contract yet." };
  },
  async cancelOrder(): Promise<PlaceOrderResult> {
    return { ok: false, error: "onchain-template adapter is a scaffold — not wired to a real contract yet." };
  },
};
