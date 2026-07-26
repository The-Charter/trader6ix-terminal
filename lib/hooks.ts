"use client";

import { useEffect, useState, useCallback } from "react";
import type { ExchangeAdapter, AdapterMarket, AdapterOrderbook, AdapterCandle, AdapterPosition, AdapterOrder } from "@/lib/adapters/types";

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function useInterval(callback: () => void, delayMs: number | null) {
  useEffect(() => {
    if (delayMs === null) return;
    const id = setInterval(callback, delayMs);
    return () => clearInterval(id);
  }, [callback, delayMs]);
}

export function useMarkets(adapter: ExchangeAdapter, kind: "spot" | "perps") {
  const [state, setState] = useState<FetchState<AdapterMarket[]>>({ data: null, loading: true, error: null });

  const fetchData = useCallback(async () => {
    try {
      const data = await adapter.getMarkets(kind);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
  }, [adapter, kind]);

  useEffect(() => {
    setState((s) => ({ ...s, loading: true }));
    fetchData();
  }, [fetchData]);
  useInterval(fetchData, 30000);

  return state;
}

export function useOrderbook(adapter: ExchangeAdapter, symbol: string | null) {
  const [state, setState] = useState<FetchState<AdapterOrderbook>>({ data: null, loading: true, error: null });

  const fetchData = useCallback(async () => {
    if (!symbol) return;
    try {
      const data = await adapter.getOrderbook(symbol);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
  }, [adapter, symbol]);

  useEffect(() => {
    setState((s) => ({ ...s, loading: true }));
    fetchData();
  }, [fetchData]);
  useInterval(fetchData, 2000);

  return state;
}

export function useKlines(adapter: ExchangeAdapter, symbol: string | null, interval = "5m") {
  const [state, setState] = useState<FetchState<AdapterCandle[]>>({ data: null, loading: true, error: null });

  const fetchData = useCallback(async () => {
    if (!symbol) return;
    try {
      const data = await adapter.getKlines(symbol, interval);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
  }, [adapter, symbol, interval]);

  useEffect(() => {
    setState((s) => ({ ...s, loading: true }));
    fetchData();
  }, [fetchData]);
  useInterval(fetchData, 15000);

  return state;
}

export function useAccount(adapter: ExchangeAdapter, walletAddress: string | null) {
  const [state, setState] = useState<FetchState<{ positions: AdapterPosition[]; orders: AdapterOrder[] }>>({
    data: null,
    loading: !!walletAddress,
    error: null,
  });

  const fetchData = useCallback(async () => {
    if (!walletAddress) return;
    try {
      const [positions, orders] = await Promise.all([
        adapter.getPositions(walletAddress),
        adapter.getOpenOrders(walletAddress),
      ]);
      setState({ data: { positions, orders }, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
  }, [adapter, walletAddress]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  useInterval(fetchData, 5000);

  return state;
}
