"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import type { PerpsAdapter } from "@/lib/adapters/perps-adapter";
import { getInstrumentSpec } from "@/lib/instrument-specs";

export interface TradeTicketPrefill {
  quantity: string;
  leverage: number;
  stopLoss?: string;
  takeProfit?: string;
  token: number; // bump this to force re-apply even if values repeat
}

export function TradeTicket({
  adapter,
  symbol,
  prefill,
}: {
  adapter: PerpsAdapter;
  symbol: string | null;
  prefill?: TradeTicketPrefill;
}) {
  const { authenticated, login, user } = usePrivy();
  const walletAddress = user?.wallet?.address ?? null;

  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"market" | "limit" | "stop">("market");
  const [sizeMode, setSizeMode] = useState<"quantity" | "leverage">("quantity");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [leverage, setLeverage] = useState("1");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Apply values pushed in from the risk calculator's "Use Position Size"
  useEffect(() => {
    if (!prefill) return;
    setQuantity(prefill.quantity);
    setLeverage(String(prefill.leverage));
    setSizeMode("leverage");
    if (prefill.stopLoss) setStopLoss(prefill.stopLoss);
    if (prefill.takeProfit) setTakeProfit(prefill.takeProfit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill?.token]);

  const spec = symbol ? getInstrumentSpec(symbol) : null;

  const quantityNum = parseFloat(quantity);
  const priceNum = parseFloat(price);
  const slNum = parseFloat(stopLoss);
  const tpNum = parseFloat(takeProfit);

  const quantityValid = quantity.trim() !== "" && Number.isFinite(quantityNum) && quantityNum > 0;
  const priceValid = orderType === "market" || (price.trim() !== "" && Number.isFinite(priceNum) && priceNum > 0);

  // SL/TP logical validation: for a long (buy), SL must be below entry and TP above; reversed for short.
  let slTpError: string | null = null;
  if (stopLoss && priceValid) {
    const refPrice = orderType === "market" ? undefined : priceNum;
    if (refPrice !== undefined) {
      if (side === "buy" && slNum >= refPrice) slTpError = "Stop loss must be below entry price for a long.";
      if (side === "sell" && slNum <= refPrice) slTpError = "Stop loss must be above entry price for a short.";
    }
  }
  if (!slTpError && takeProfit && priceValid) {
    const refPrice = orderType === "market" ? undefined : priceNum;
    if (refPrice !== undefined) {
      if (side === "buy" && tpNum <= refPrice) slTpError = "Take profit must be above entry price for a long.";
      if (side === "sell" && tpNum >= refPrice) slTpError = "Take profit must be below entry price for a short.";
    }
  }

  const canSubmit = authenticated && !!symbol && !!walletAddress && !submitting && quantityValid && priceValid && !slTpError;

  const orderTypeLabel: Record<string, string> = {
    market: "Market",
    limit: side === "buy" ? "Buy Limit" : "Sell Limit",
    stop: side === "buy" ? "Buy Stop" : "Sell Stop",
  };
  const priceFieldLabel: Record<string, string> = {
    limit: side === "buy" ? "Buy limit price" : "Sell limit price",
    stop: side === "buy" ? "Buy stop price" : "Sell stop price",
  };

  async function handleSubmit() {
    if (!symbol || !walletAddress || !quantityValid || !priceValid || slTpError) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await adapter.placeOrder(
        {
          symbol,
          side,
          type: orderType,
          quantity,
          price: orderType === "market" ? undefined : price,
          leverage: sizeMode === "leverage" ? parseFloat(leverage) : undefined,
          stopLoss: stopLoss || undefined,
          takeProfit: takeProfit || undefined,
        },
        walletAddress
      );
      const isDemo = adapter.id.startsWith("mock-");
      if (!res.ok) throw new Error(res.error ?? "Order failed");
      setResult({
        ok: true,
        message: isDemo
          ? "Demo order filled — no real funds were moved."
          : `Order submitted${res.orderId ? ` (id ${res.orderId})` : ""}.`,
      });
      setQuantity("");
      setStopLoss("");
      setTakeProfit("");
    } catch (err) {
      setResult({ ok: false, message: err instanceof Error ? err.message : "Order failed" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="grid grid-cols-2 gap-1 rounded-md bg-surface-1 p-1">
        <button
          onClick={() => setSide("buy")}
          className={`rounded py-1.5 text-sm font-medium ${side === "buy" ? "bg-bull/20 text-bull" : "text-ink-2"}`}
        >
          Buy / Long
        </button>
        <button
          onClick={() => setSide("sell")}
          className={`rounded py-1.5 text-sm font-medium ${side === "sell" ? "bg-bear/20 text-bear" : "text-ink-2"}`}
        >
          Sell / Short
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1">
        {(["market", "limit", "stop"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setOrderType(t)}
            className={`rounded-md border py-1.5 text-xs font-medium ${
              orderType === t ? "border-accent bg-accent text-zinc-950" : "border-border text-ink-2"
            }`}
          >
            {t === "market" ? "Market" : orderTypeLabel[t]}
          </button>
        ))}
      </div>

      {orderType !== "market" && (
        <label className="flex flex-col gap-1 text-xs text-ink-3">
          {priceFieldLabel[orderType]}
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={spec ? spec.pricePrecision > 0 ? `0.${"0".repeat(spec.pricePrecision)}` : "0" : "0.00"}
            inputMode="decimal"
            className={`rounded-md border bg-surface-2 px-3 py-2 font-mono text-sm text-ink outline-none focus:border-accent ${
              price && !priceValid ? "border-bear/50" : "border-border"
            }`}
          />
        </label>
      )}

      <div className="flex gap-3 text-xs text-ink-3">
        <button onClick={() => setSizeMode("quantity")} className={sizeMode === "quantity" ? "text-ink" : ""}>
          Quantity
        </button>
        <button onClick={() => setSizeMode("leverage")} className={sizeMode === "leverage" ? "text-ink" : ""}>
          Leverage
        </button>
      </div>

      <label className="flex flex-col gap-1 text-xs text-ink-3">
        {sizeMode === "quantity" ? `Quantity (${spec?.baseCurrency ?? ""})` : "Quantity"}
        <input
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="0.00"
          inputMode="decimal"
          className={`rounded-md border bg-surface-2 px-3 py-2 font-mono text-sm text-ink outline-none focus:border-accent ${
            quantity && !quantityValid ? "border-bear/50" : "border-border"
          }`}
        />
      </label>

      {sizeMode === "leverage" && (
        <label className="flex flex-col gap-1 text-xs text-ink-3">
          Leverage: {leverage}×
          <input
            type="range"
            min={1}
            max={spec?.maxLeverage ?? 20}
            value={leverage}
            onChange={(e) => setLeverage(e.target.value)}
            className="accent-accent"
          />
        </label>
      )}

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-xs text-ink-3">
          Stop Loss
          <input
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            placeholder="Optional"
            inputMode="decimal"
            className="rounded-md border border-border bg-surface-2 px-3 py-2 font-mono text-sm text-ink outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-3">
          Take Profit
          <input
            value={takeProfit}
            onChange={(e) => setTakeProfit(e.target.value)}
            placeholder="Optional"
            inputMode="decimal"
            className="rounded-md border border-border bg-surface-2 px-3 py-2 font-mono text-sm text-ink outline-none focus:border-accent"
          />
        </label>
      </div>
      {slTpError && <p className="text-xs text-bear">{slTpError}</p>}

      {!authenticated ? (
        <button onClick={login} className="rounded-md bg-accent py-2.5 text-sm font-semibold text-zinc-950 hover:opacity-90">
          Connect Wallet to Trade
        </button>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`rounded-md py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-40 ${
            side === "buy" ? "bg-bull hover:bg-bull/90" : "bg-bear hover:bg-bear/90"
          }`}
        >
          {submitting ? "Submitting…" : `${orderTypeLabel[orderType]} ${symbol ?? ""}`}
        </button>
      )}

      {result && <p className={`text-xs ${result.ok ? "text-bull" : "text-bear"}`}>{result.message}</p>}

      <p className="text-[11px] text-ink-3">
        Routed via {adapter.displayName} — perpetual contract. Positions accrue funding and are subject to
        liquidation. Testnet only.
      </p>
    </div>
  );
}
