"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";

export function TradeTicket({
  symbol,
  contractId,
  kind,
}: {
  symbol: string | null;
  contractId: number | null;
  kind: "spot" | "perps";
}) {
  const { authenticated, login } = usePrivy();
  const [side, setSide] = useState<"BID" | "ASK">("BID");
  const [orderType, setOrderType] = useState<"market" | "limit">("limit");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const disabled = !authenticated || !symbol || contractId === null || submitting;

  async function handleSubmit() {
    if (!symbol || contractId === null) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/hibachi/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          contractId,
          side,
          quantity,
          price: orderType === "limit" ? price : undefined,
          maxFeesPercent: 0.2,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Order failed");
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
      <div className="grid grid-cols-2 gap-1 rounded-md bg-zinc-900 p-1">
        <button
          onClick={() => setSide("BID")}
          className={`rounded py-1.5 text-sm font-medium ${side === "BID" ? "bg-bull/20 text-bull" : "text-zinc-400"}`}
        >
          Buy
        </button>
        <button
          onClick={() => setSide("ASK")}
          className={`rounded py-1.5 text-sm font-medium ${side === "ASK" ? "bg-bear/20 text-bear" : "text-zinc-400"}`}
        >
          Sell
        </button>
      </div>

      <div className="flex gap-3 text-xs text-zinc-400">
        <button onClick={() => setOrderType("limit")} className={orderType === "limit" ? "text-zinc-100" : ""}>
          Limit
        </button>
        <button onClick={() => setOrderType("market")} className={orderType === "market" ? "text-zinc-100" : ""}>
          Market
        </button>
      </div>

      {orderType === "limit" && (
        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          Price
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-100 outline-none focus:border-cyan-400"
          />
        </label>
      )}

      <label className="flex flex-col gap-1 text-xs text-zinc-500">
        Quantity
        <input
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="0.00"
          className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-100 outline-none focus:border-cyan-400"
        />
      </label>

      {!authenticated ? (
        <button
          onClick={login}
          className="rounded-md bg-cyan-400 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-cyan-300"
        >
          Connect Wallet to Trade
        </button>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={disabled || !quantity}
          className={`rounded-md py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-40 ${
            side === "BID" ? "bg-bull hover:bg-bull/90" : "bg-bear hover:bg-bear/90"
          }`}
        >
          {submitting ? "Submitting…" : `${side === "BID" ? "Buy" : "Sell"} ${symbol ?? ""}`}
        </button>
      )}

      {result && (
        <p className={`text-xs ${result.ok ? "text-bull" : "text-red-400"}`}>{result.message}</p>
      )}

      {kind === "perps" && (
        <p className="text-[11px] text-zinc-500">
          Perpetual contract — positions accrue funding and are subject to liquidation. Testnet only.
        </p>
      )}
    </div>
  );
}
