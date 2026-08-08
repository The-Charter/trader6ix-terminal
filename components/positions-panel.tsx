"use client";

import { usePrivy } from "@privy-io/react-auth";
import type { PerpsAdapter } from "@/lib/adapters/perps-adapter";
import { useAccount } from "@/lib/hooks";
import { useState } from "react";

export function PositionsPanel({ adapter }: { adapter: PerpsAdapter }) {
  const { authenticated, user } = usePrivy();
  const walletAddress = user?.wallet?.address ?? null;
  const { data, loading, error, refetch } = useAccount(adapter, authenticated ? walletAddress : null);
  const [tab, setTab] = useState<"positions" | "orders">("positions");
  const [closingSymbol, setClosingSymbol] = useState<string | null>(null);
  const [closeError, setCloseError] = useState<string | null>(null);

  if (!authenticated) {
    return <div className="p-4 text-sm text-ink-3">Connect your wallet to view positions and open orders.</div>;
  }
  if (error) {
    return <div className="p-4 text-sm text-bear">Couldn&apos;t load your account on {adapter.displayName} — {error}</div>;
  }
  if (loading && !data) {
    return <div className="p-4 text-sm text-ink-3">Loading account…</div>;
  }

  const positions = data?.positions ?? [];
  const orders = data?.orders ?? [];

  async function handleClose(symbol: string) {
    if (!walletAddress) return;
    setClosingSymbol(symbol);
    setCloseError(null);
    try {
      const res = await adapter.closePosition(symbol, walletAddress);
      if (!res.ok) throw new Error(res.error ?? "Failed to close position");
      refetch();
    } catch (err) {
      setCloseError(err instanceof Error ? err.message : "Failed to close position");
    } finally {
      setClosingSymbol(null);
    }
  }

  async function handleCancel(orderId: string) {
    if (!walletAddress) return;
    await adapter.cancelOrder(orderId, walletAddress);
    refetch();
  }

  return (
    <div className="flex flex-col">
      <div className="flex gap-4 border-b border-border px-4 py-2 text-sm">
        <button onClick={() => setTab("positions")} className={tab === "positions" ? "text-ink" : "text-ink-3"}>
          Positions {positions.length > 0 && `(${positions.length})`}
        </button>
        <button onClick={() => setTab("orders")} className={tab === "orders" ? "text-ink" : "text-ink-3"}>
          Open Orders {orders.length > 0 && `(${orders.length})`}
        </button>
      </div>

      {closeError && <p className="px-4 pt-2 text-xs text-bear">{closeError}</p>}

      <div className="flex flex-col gap-2 p-4">
        {tab === "positions" &&
          (positions.length === 0 ? (
            <p className="text-sm text-ink-3">No open positions.</p>
          ) : (
            positions.map((p) => {
              const pnl = p.unrealizedPnl ? parseFloat(p.unrealizedPnl) : 0;
              return (
                <div key={p.symbol} className="rounded-lg border border-border bg-surface-1 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-ink">{p.symbol}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                          p.side === "long" ? "bg-bull/15 text-bull" : "bg-bear/15 text-bear"
                        }`}
                      >
                        {p.side}
                      </span>
                    </span>
                    <span className={`font-mono text-sm font-semibold ${pnl >= 0 ? "text-bull" : "text-bear"}`}>
                      {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <Cell label="Size" value={p.size} />
                    <Cell label="Entry" value={p.entryPrice} />
                    <Cell label="Mark" value={p.markPrice ?? "—"} />
                    <Cell label="Leverage" value={p.leverage ? `${p.leverage}×` : "—"} />
                    <Cell label="Liq. Price" value={p.liquidationPrice ?? "—"} warn />
                    <Cell label="Margin" value={p.marginUsed ? `$${p.marginUsed}` : "—"} />
                    {p.stopLoss && <Cell label="SL" value={p.stopLoss} bear />}
                    {p.takeProfit && <Cell label="TP" value={p.takeProfit} bull />}
                  </div>
                  <button
                    onClick={() => handleClose(p.symbol)}
                    disabled={closingSymbol === p.symbol}
                    className="mt-3 w-full rounded-md border border-ink-3 py-1.5 text-xs font-medium text-ink-2 hover:border-bear hover:text-bear disabled:opacity-50"
                  >
                    {closingSymbol === p.symbol ? "Closing…" : "Close Position"}
                  </button>
                </div>
              );
            })
          ))}

        {tab === "orders" &&
          (orders.length === 0 ? (
            <p className="text-sm text-ink-3">No open orders.</p>
          ) : (
            orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between rounded-lg border border-border bg-surface-1 p-3">
                <div>
                  <p className="font-mono text-sm text-ink">
                    {o.symbol} · {o.side} · {o.type}
                  </p>
                  <p className="text-[11px] text-ink-3">
                    {o.quantity} @ {o.price ?? "market"}
                  </p>
                </div>
                <button onClick={() => handleCancel(o.id)} className="text-xs text-ink-3 hover:text-bear">
                  Cancel
                </button>
              </div>
            ))
          ))}
      </div>
    </div>
  );
}

function Cell({ label, value, warn, bear, bull }: { label: string; value: string; warn?: boolean; bear?: boolean; bull?: boolean }) {
  const color = warn ? "text-warn" : bear ? "text-bear" : bull ? "text-bull" : "text-ink-2";
  return (
    <div>
      <p className="text-ink-3">{label}</p>
      <p className={`font-mono ${color}`}>{value}</p>
    </div>
  );
}
