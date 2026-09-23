"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { DATA_ADAPTERS } from "@/lib/adapters/registry";
import type { IndexedTransaction } from "@/lib/adapters/data-adapter";

const TYPE_FILTERS = {
  spot: new Set(["swap", "fx_settlement"]),
  perps: new Set(["perp_order"]),
};

export function ActivityPanel({ scope }: { scope: "spot" | "perps" }) {
  const { authenticated, login, user } = usePrivy();
  const walletAddress = user?.wallet?.address ?? null;
  const adapter = DATA_ADAPTERS[0];
  const [transactions, setTransactions] = useState<IndexedTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authenticated || !walletAddress) return;
    setLoading(true);
    adapter
      .getTransactionHistory(walletAddress)
      .then((items) => setTransactions(items.filter((item) => {
        if (!TYPE_FILTERS[scope].has(item.type)) return false;
        return scope !== "spot" || !adapter.id.startsWith("mock-");
      })))
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false));
  }, [adapter, authenticated, walletAddress, scope]);

  const title = scope === "spot" ? "Spot history" : "Perps history";
  if (!authenticated) {
    return (
      <section className="w-full max-w-md rounded-xl border border-border bg-surface-1 p-5">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        <p className="mt-2 text-sm text-ink-3">Connect your wallet to view your {scope} activity.</p>
        <button onClick={login} className="mt-3 rounded-md border border-border px-3 py-2 text-sm text-ink hover:border-accent">Connect wallet</button>
      </section>
    );
  }

  return (
    <section className="w-full rounded-xl border border-border bg-surface-1">
      <div className="border-b border-border px-4 py-3"><h2 className="text-sm font-semibold text-ink">{title}</h2></div>
      {loading ? <p className="px-4 py-5 text-sm text-ink-3">Loading history...</p> : transactions.length === 0 ? (
        <p className="px-4 py-5 text-sm text-ink-3">No {scope} activity yet.</p>
      ) : (
        <div className="divide-y divide-border">
          {transactions.map((transaction) => (
            <div key={transaction.hash} className="px-4 py-3">
              <p className="text-sm text-ink">{transaction.summary}</p>
              <p className="mt-0.5 text-xs text-ink-3">{new Date(transaction.timestamp).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
