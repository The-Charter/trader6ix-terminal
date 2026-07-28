"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import type { PerpsAdapter } from "@/lib/adapters/perps-adapter";

export function TradeTicket({
  adapter,
  symbol,
}: {
  adapter: PerpsAdapter;
  symbol: string | null;
}) {
  const { authenticated, login, user } = usePrivy();
  const walletAddress = user?.wallet?.address ?? null;
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"market" | "limit">("limit");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const quantityNum = parseFloat(quantity);
  const priceNum = parseFloat(price);
  const quantityValid = quantity.trim() !== "" && Number.isFinite(quantityNum) && quantityNum > 0;
  const priceValid = orderType === "market" || (price.trim() !== "" && Number.isFinite(priceNum) && priceNum > 0);
  const canSubmit = authenticated && !!symbol && !!walletAddress && !submitting && quantityValid && priceValid;

  async function handleSubmit() {
    if (!symbol || !walletAddress || !quantityValid || !priceValid) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await adapter.placeOrder(
        { symbol, side, type: orderType, quantity, price: orderType === "limit" ? price : undefined },
        walletAddress
      );
      if (!res.ok) throw new Error(res.error ?? "Order failed");
      setResult({ ok: true, message: "Order submitted." });
      setQuantity("");
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
          Buy
        </button>
        <button
          onClick={() => setSide("sell")}
          className={`rounded py-1.5 text-sm font-medium ${side === "sell" ? "bg-bear/20 text-bear" : "text-ink-2"}`}
        >
          Sell
        </button>
      </div>

      <div className="flex gap-3 text-xs text-ink-2">
        <button onClick={() => setOrderType("limit")} className={orderType === "limit" ? "text-ink" : ""}>
          Limit
        </button>
        <button onClick={() => setOrderType("market")} className={orderType === "market" ? "text-ink" : ""}>
          Market
        </button>
      </div>

      {orderType === "limit" && (
        <label className="flex flex-col gap-1 text-xs text-ink-3">
          Price
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            inputMode="decimal"
            className={`rounded-md border bg-surface-0 px-3 py-2 font-mono text-sm text-ink outline-none focus:border-accent ${
              price && !priceValid ? "border-bear/50" : "border-border"
            }`}
          />
        </label>
      )}

      <label className="flex flex-col gap-1 text-xs text-ink-3">
        Quantity
        <input
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="0.00"
          inputMode="decimal"
          className={`rounded-md border bg-surface-0 px-3 py-2 font-mono text-sm text-ink outline-none focus:border-accent ${
            quantity && !quantityValid ? "border-bear/50" : "border-border"
          }`}
        />
      </label>

      {!authenticated ? (
        <button
          onClick={login}
          className="rounded-md bg-accent py-2.5 text-sm font-semibold text-zinc-950 hover:opacity-90"
        >
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
          {submitting ? "Submitting…" : `${side === "buy" ? "Buy" : "Sell"} ${symbol ?? ""}`}
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
