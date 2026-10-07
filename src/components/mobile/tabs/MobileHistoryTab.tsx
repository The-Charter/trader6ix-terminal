"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { DATA_ADAPTERS } from "@/adapters/registry";
import type { IndexedTransaction } from "@/adapters/data-adapter";

export function MobileHistoryTab({ scope }: { scope: "spot" | "perps" }) {
  const { authenticated, login, user } = usePrivy();
  const walletAddress = user?.wallet?.address ?? null;
  const adapter = DATA_ADAPTERS[0];

  const [transactions, setTransactions] = useState<IndexedTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authenticated || !walletAddress) return;
    setLoading(true);
    adapter
      .getTransactionHistory(walletAddress)
      .then((items) => setTransactions(items.filter((item) =>
        scope === "spot" ? item.type === "swap" || item.type === "fx_settlement" : item.type === "perp_order"
      )))
      .finally(() => setLoading(false));
  }, [authenticated, walletAddress, adapter, scope]);

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
        <p className="text-sm text-ink-2">Connect your wallet to view activity.</p>
        <button onClick={login} className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-zinc-950">
          Connect Wallet
        </button>
      </div>
    );
  }

  if (loading) return <p className="px-4 py-8 text-center text-sm text-ink-3">Loading…</p>;
  if (transactions.length === 0) return <p className="px-4 py-8 text-center text-sm text-ink-3">No {scope} activity yet.</p>;

  return (
    <div className="divide-y divide-border">
      {transactions.map((tx) => (
        <div key={tx.hash} className="px-4 py-3">
          <p className="text-sm text-ink">{tx.summary}</p>
          <p className="mt-0.5 text-xs text-ink-3">{new Date(tx.timestamp).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
