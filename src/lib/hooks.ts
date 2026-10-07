"use client";

import { useEffect, useState, useCallback } from "react";
import type { PerpsAdapter, PerpsMarket, PerpsPosition, PerpsOrder } from "@/adapters/perps-adapter";
import type { SpotAdapter, SpotToken } from "@/adapters/spot-adapter";
import type { AdapterOrderbook, AdapterCandle } from "@/adapters/shared-types";
import type { PriceMap } from "@/lib/prices";

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

export function useMarkets(adapter: PerpsAdapter) {
  const [state, setState] = useState<FetchState<PerpsMarket[]>>({ data: null, loading: true, error: null });

  const fetchData = useCallback(async () => {
    try {
      const data = await adapter.getMarkets();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
  }, [adapter]);

  useEffect(() => {
    setState((s) => ({ ...s, loading: true }));
    fetchData();
  }, [fetchData]);
  useInterval(fetchData, 30000);

  return state;
}

export function useOrderbook(adapter: PerpsAdapter, symbol: string | null) {
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

export function useKlines(adapter: PerpsAdapter, symbol: string | null, interval = "5m") {
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

export function useAccount(adapter: PerpsAdapter, walletAddress: string | null) {
  const [state, setState] = useState<FetchState<{ positions: PerpsPosition[]; orders: PerpsOrder[] }>>({
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

  return { ...state, refetch: fetchData };
}

/** Live USD prices for the Spot tokens, refreshed every minute. */
export function usePrices() {
  const [state, setState] = useState<FetchState<PriceMap>>({ data: null, loading: true, error: null });

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/prices");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load prices");
      setState({ data: json.prices ?? {}, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  useInterval(fetchData, 60000);

  return state;
}

/** Token metadata for a Spot venue (the assets it can actually swap). */
export function useSpotTokens(adapter: SpotAdapter) {
  const [state, setState] = useState<FetchState<SpotToken[]>>({ data: null, loading: true, error: null });

  const fetchData = useCallback(async () => {
    if (!adapter.getTokens) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    try {
      const data = await adapter.getTokens();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
  }, [adapter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  useInterval(fetchData, 60000);

  return state;
}
