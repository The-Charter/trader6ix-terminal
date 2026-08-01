"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { AppHeader } from "@/components/app-header";
import { DATA_ADAPTERS } from "@/lib/adapters/registry";
import type { PortfolioSnapshot, IndexedTrade } from "@/lib/adapters/data-adapter";
import { TokenLogo } from "@/components/token-logo";

export default function PortfolioPage() {
  const { authenticated, login, user } = usePrivy();
  const walletAddress = user?.wallet?.address ?? null;
  const adapter = DATA_ADAPTERS[0];

  const [portfolio, setPortfolio] = useState<PortfolioSnapshot | null>(null);
  const [trades, setTrades] = useState<IndexedTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authenticated || !walletAddress) return;
    setLoading(true);
    Promise.all([adapter.getPortfolio(walletAddress), adapter.getTradeHistory(walletAddress)])
      .then(([p, t]) => {
        setPortfolio(p);
        setTrades(t);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load portfolio"))
      .finally(() => setLoading(false));
  }, [authenticated, walletAddress, adapter]);

  const wins = trades.filter((t) => t.pnl && parseFloat(t.pnl) > 0).length;
  const closedTrades = trades.filter((t) => t.pnl !== undefined);
  const winRate = closedTrades.length > 0 ? ((wins / closedTrades.length) * 100).toFixed(0) : "—";
  const totalPnl = closedTrades.reduce((sum, t) => sum + parseFloat(t.pnl ?? "0"), 0);
  const volume = trades.reduce((sum, t) => sum + parseFloat(t.quantity) * parseFloat(t.price ?? "0"), 0);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      {!adapter.id.startsWith("mock-") ? null : (
        <div className="border-b border-accent/20 bg-accent/5 px-4 py-2 text-center text-xs text-accent">
          Demo data — will be powered by indexed onchain data (Goldsky) once that integration resumes.
        </div>
      )}

      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        {!authenticated ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <p className="text-ink-2">Connect your wallet to view your portfolio.</p>
            <button onClick={login} className="rounded-md bg-accent px-6 py-2.5 text-sm font-semibold text-zinc-950 hover:opacity-90">
              Connect Wallet
            </button>
          </div>
        ) : error ? (
          <p className="text-sm text-bear">{error}</p>
        ) : loading || !portfolio ? (
          <p className="text-sm text-ink-3">Loading portfolio…</p>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="rounded-lg border border-border bg-surface-1 p-6 text-center">
              <p className="text-xs uppercase tracking-wide text-ink-3">Total Portfolio Value</p>
              <p className="mt-1 font-mono text-3xl font-semibold text-ink">
                ${Number(portfolio.totalUsdValue).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Realized PnL" value={`${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)}`} positive={totalPnl >= 0} />
              <StatCard label="Win Rate" value={typeof winRate === "string" ? winRate : `${winRate}%`} />
              <StatCard label="Volume" value={`$${volume.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
              <StatCard label="Trades" value={String(trades.length)} />
            </div>

            <div>
              <h2 className="mb-2 text-sm font-medium text-ink-2">Balances</h2>
              <div className="divide-y divide-border rounded-lg border border-border bg-surface-1">
                {portfolio.balances.map((b) => (
                  <div key={b.symbol} className="flex items-center justify-between px-4 py-3">
                    <span className="flex items-center gap-2 text-sm text-ink">
                      <TokenLogo symbol={b.symbol as any} size={22} /> {b.symbol}
                    </span>
                    <div className="text-right">
                      <p className="font-mono text-sm text-ink">{b.amount}</p>
                      {b.usdValue && <p className="font-mono text-xs text-ink-3">${Number(b.usdValue).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-surface-1 p-3 text-center">
      <p className="text-[10px] uppercase tracking-wide text-ink-3">{label}</p>
      <p className={`mt-1 font-mono text-sm font-semibold ${positive === undefined ? "text-ink" : positive ? "text-bull" : "text-bear"}`}>
        {value}
      </p>
    </div>
  );
}
