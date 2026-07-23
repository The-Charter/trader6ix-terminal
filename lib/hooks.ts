"use client";

import { useEffect, useState, useCallback } from "react";
import type { ExchangeInfo } from "@/lib/hibachi/client";

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

export function useExchangeInfo() {
  const [state, setState] = useState<FetchState<ExchangeInfo>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/hibachi/exchange-info");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load exchange info");
      setState({ data: json, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  useInterval(fetchData, 30000);

  return state;
}

export function useOrderbook(symbol: string | null) {
  const [state, setState] = useState<FetchState<{ bids: [string, string][]; asks: [string, string][] }>>(
    { data: null, loading: true, error: null }
  );

  const fetchData = useCallback(async () => {
    if (!symbol) return;
    try {
      const res = await fetch(`/api/hibachi/orderbook?symbol=${encodeURIComponent(symbol)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load orderbook");
      setState({ data: json, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
  }, [symbol]);

  useEffect(() => {
    setState((s) => ({ ...s, loading: true }));
    fetchData();
  }, [fetchData]);
  useInterval(fetchData, 2000);

  return state;
}

export function useKlines(symbol: string | null, interval = "5m") {
  const [state, setState] = useState<FetchState<unknown>>({ data: null, loading: true, error: null });

  const fetchData = useCallback(async () => {
    if (!symbol) return;
    try {
      const res = await fetch(
        `/api/hibachi/klines?symbol=${encodeURIComponent(symbol)}&interval=${interval}`
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load chart data");
      setState({ data: json, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
  }, [symbol, interval]);

  useEffect(() => {
    setState((s) => ({ ...s, loading: true }));
    fetchData();
  }, [fetchData]);
  useInterval(fetchData, 15000);

  return state;
}

export function useAccount(enabled: boolean) {
  const [state, setState] = useState<FetchState<unknown>>({ data: null, loading: enabled, error: null });

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await fetch("/api/hibachi/account");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load account");
      setState({ data: json, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
  }, [enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  useInterval(fetchData, 5000);

  return state;
}
