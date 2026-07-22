"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "@/lib/hooks";
import { useState } from "react";

export function PositionsPanel() {
  const { authenticated } = usePrivy();
  const { data, loading, error } = useAccount(authenticated);
  const [tab, setTab] = useState<"positions" | "orders">("positions");

  if (!authenticated) {
    return (
      <div className="p-4 text-sm text-zinc-500">Connect your wallet to view positions and open orders.</div>
    );
  }

  if (error) {
    return <div className="p-4 text-sm text-red-400">Couldn&apos;t load your account — {error}</div>;
  }

  if (loading && !data) {
    return <div className="p-4 text-sm text-zinc-500">Loading account…</div>;
  }

  const account = (data as { account?: { positions?: unknown[] } } | null)?.account;
  const orders = (data as { orders?: unknown[] } | null)?.orders ?? [];
  const positions = account?.positions ?? [];

  return (
    <div className="flex flex-col">
      <div className="flex gap-4 border-b border-zinc-800 px-4 py-2 text-sm">
        <button onClick={() => setTab("positions")} className={tab === "positions" ? "text-zinc-100" : "text-zinc-500"}>
          Positions {positions.length > 0 && `(${positions.length})`}
        </button>
        <button onClick={() => setTab("orders")} className={tab === "orders" ? "text-zinc-100" : "text-zinc-500"}>
          Open Orders {orders.length > 0 && `(${orders.length})`}
        </button>
      </div>

      <div className="p-4 text-sm">
        {tab === "positions" &&
          (positions.length === 0 ? (
            <p className="text-zinc-500">No open positions.</p>
          ) : (
            <pre className="overflow-x-auto font-mono text-xs text-zinc-300">{JSON.stringify(positions, null, 2)}</pre>
          ))}
        {tab === "orders" &&
          (orders.length === 0 ? (
            <p className="text-zinc-500">No open orders.</p>
          ) : (
            <pre className="overflow-x-auto font-mono text-xs text-zinc-300">{JSON.stringify(orders, null, 2)}</pre>
          ))}
      </div>
    </div>
  );
}
