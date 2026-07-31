"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import type { FXAdapter, FxQuote, FxTrade } from "@/lib/adapters/fx-adapter";

export function FxTicket({ adapter }: { adapter: FXAdapter }) {
  const { authenticated, login, user } = usePrivy();
  const walletAddress = user?.wallet?.address ?? null;

  const [side, setSide] = useState<"buy" | "sell">("sell"); // sell USDC for EURC by default
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<FxQuote | null>(null);
  const [trade, setTrade] = useState<FxTrade | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = side === "sell" ? "USDC" : "EURC";
  const to = side === "sell" ? "EURC" : "USDC";
  const amountNum = parseFloat(amount);
  const amountValid = amount.trim() !== "" && Number.isFinite(amountNum) && amountNum > 0;
  const isDemo = adapter.id.startsWith("mock-");

  async function handleGetQuote() {
    if (!amountValid) return;
    setLoading(true);
    setError(null);
    setTrade(null);
    try {
      const q = await adapter.requestQuote({ base: "EURC", quote: "USDC", side, amount });
      setQuote(q);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get quote");
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept() {
    if (!quote || !walletAddress) return;
    setLoading(true);
    setError(null);
    try {
      const t = await adapter.acceptQuote(quote.quoteId, walletAddress);
      setTrade(t);
      // Poll for settlement in demo mode (mock adapter settles after ~2s)
      if (t.status !== "settled") {
        const poll = setInterval(async () => {
          const updated = await adapter.getTradeStatus(t.tradeId);
          setTrade(updated);
          if (updated.status === "settled" || updated.status === "failed") clearInterval(poll);
        }, 1000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept quote");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-3 rounded-lg border border-border bg-surface-1 p-5">
      <div className="flex items-center justify-between rounded-md bg-surface-2 px-3 py-2">
        <span className="text-sm text-ink">{from}</span>
        <input
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setQuote(null);
            setTrade(null);
          }}
          placeholder="0.00"
          inputMode="decimal"
          className="w-28 bg-transparent text-right font-mono text-sm text-ink outline-none"
        />
      </div>

      <button
        onClick={() => {
          setSide((s) => (s === "sell" ? "buy" : "sell"));
          setQuote(null);
          setTrade(null);
        }}
        className="mx-auto rounded-full border border-border bg-surface-2 px-2 py-1 text-xs text-ink-2 hover:text-ink"
      >
        ↓↑ swap direction
      </button>

      <div className="flex items-center justify-between rounded-md bg-surface-2 px-3 py-2">
        <span className="text-sm text-ink">{to}</span>
        <span className="font-mono text-sm text-ink-2">
          {quote ? (parseFloat(amount) * parseFloat(quote.rate)).toFixed(4) : "0.00"}
        </span>
      </div>

      {quote && <p className="text-center text-xs text-ink-3">Rate: 1 {from} = {quote.rate} {to}</p>}
      {error && <p className="text-xs text-bear">{error}</p>}

      {!authenticated ? (
        <button onClick={login} className="rounded-md bg-accent py-2.5 text-sm font-semibold text-zinc-950 hover:opacity-90">
          Connect Wallet
        </button>
      ) : !quote ? (
        <button
          onClick={handleGetQuote}
          disabled={!amountValid || loading}
          className="rounded-md bg-accent py-2.5 text-sm font-semibold text-zinc-950 hover:opacity-90 disabled:opacity-40"
        >
          {loading ? "Getting quote…" : "Get Quote"}
        </button>
      ) : !trade ? (
        <button
          onClick={handleAccept}
          disabled={loading}
          className="rounded-md bg-accent py-2.5 text-sm font-semibold text-zinc-950 hover:opacity-90 disabled:opacity-40"
        >
          {loading ? "Accepting…" : "Accept Quote & Settle"}
        </button>
      ) : (
        <div className="rounded-md bg-surface-2 px-3 py-2 text-center text-sm">
          <p className="text-ink">
            Status: <span className="font-mono">{trade.status}</span>
          </p>
          {trade.status === "settled" && (
            <p className="mt-1 text-xs text-bull">
              {isDemo ? "Demo settlement — no real funds were moved." : `Settled — tx ${trade.settlementTxHash?.slice(0, 10)}…`}
            </p>
          )}
        </div>
      )}

      <p className="text-center text-[11px] text-ink-3">
        Routed via {adapter.displayName} — request-for-quote settlement, not an order book.
      </p>
    </div>
  );
}
