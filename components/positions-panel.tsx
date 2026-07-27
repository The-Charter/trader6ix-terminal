"use client";

import { usePrivy } from "@privy-io/react-auth";
import type { PerpsAdapter } from "@/lib/adapters/perps-adapter";
import { useAccount } from "@/lib/hooks";
import { useState } from "react";

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function DataTable({ rows }: { rows: unknown[] }) {
  if (rows.length === 0) return null;
  const allPlain = rows.every(isPlainObject);
  if (!allPlain) {
    return <pre className="overflow-x-auto font-mono text-xs text-zinc-300">{JSON.stringify(rows, null, 2)}</pre>;
  }
  const columns = Array.from(new Set(rows.flatMap((r) => Object.keys(r as Record<string, unknown>))));
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="text-zinc-500">
            {columns.map((c) => (
              <th key={c} className="whitespace-nowrap px-2 py-1 font-normal">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="font-mono text-zinc-200">
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-zinc-900">
              {columns.map((c) => (
                <td key={c} className="whitespace-nowrap px-2 py-1">
                  {String((row as Record<string, unknown>)[c] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PositionsPanel({ adapter }: { adapter: PerpsAdapter }) {
  const { authenticated, user } = usePrivy();
  const walletAddress = user?.wallet?.address ?? null;
  const { data, loading, error } = useAccount(adapter, authenticated ? walletAddress : null);
  const [tab, setTab] = useState<"positions" | "orders">("positions");

  if (!authenticated) {
    return (
      <div className="p-4 text-sm text-zinc-500">Connect your wallet to view positions and open orders.</div>
    );
  }

  if (error) {
    return <div className="p-4 text-sm text-red-400">Couldn&apos;t load your account on {adapter.displayName} — {error}</div>;
  }

  if (loading && !data) {
    return <div className="p-4 text-sm text-zinc-500">Loading account…</div>;
  }

  const positions = data?.positions ?? [];
  const orders = data?.orders ?? [];

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
          (positions.length === 0 ? <p className="text-zinc-500">No open positions.</p> : <DataTable rows={positions} />)}
        {tab === "orders" &&
          (orders.length === 0 ? <p className="text-zinc-500">No open orders.</p> : <DataTable rows={orders} />)}
      </div>
    </div>
  );
}
