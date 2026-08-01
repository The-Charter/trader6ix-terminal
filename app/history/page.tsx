"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { AppHeader } from "@/components/app-header";
import { DATA_ADAPTERS } from "@/lib/adapters/registry";
import type { IndexedTransaction } from "@/lib/adapters/data-adapter";

export default function HistoryPage() {
  const { authenticated, login, user } = usePrivy();
  const walletAddress = user?.wallet?.address ?? null;
  const adapter = DATA_ADAPTERS[0];

  const [transactions, setTransactions] = useState<IndexedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authenticated || !walletAddress) return;
    setLoading(true);
    adapter
      .getTransactionHistory(walletAddress)
      .then(setTransactions)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load history"))
      .finally(() => setLoading(false));
  }, [authenticated, walletAddress, adapter]);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      {adapter.id.startsWith("mock-") && (
        <div className="border-b border-accent/20 bg-accent/5 px-4 py-2 text-center text-xs text-accent">
          Demo activity feed — will be powered by indexed onchain data (Goldsky) once that integration resumes.
        </div>
      )}

      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <h1 className="mb-4 text-lg font-semibold text-ink">Activity</h1>

        {!authenticated ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <p className="text-ink-2">Connect your wallet to view your activity.</p>
            <button onClick={login} className="rounded-md bg-accent px-6 py-2.5 text-sm font-semibold text-zinc-950 hover:opacity-90">
              Connect Wallet
            </button>
          </div>
        ) : error ? (
          <p className="text-sm text-bear">{error}</p>
        ) : loading ? (
          <p className="text-sm text-ink-3">Loading activity…</p>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-ink-3">No activity yet.</p>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border bg-surface-1">
            {transactions.map((tx) => (
              <div key={tx.hash} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm text-ink">{tx.summary}</p>
                  <p className="mt-0.5 text-xs text-ink-3">
                    {new Date(tx.timestamp).toLocaleString()} · {tx.type}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
