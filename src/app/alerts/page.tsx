"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { DEMO_ASSETS } from "@/lib/demo-market-data";

interface Alert {
  id: string;
  symbol: string;
  condition: "above" | "below";
  price: string;
}

const STORAGE_KEY = "trader6ix:alerts";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [symbol, setSymbol] = useState("BTC");
  const [condition, setCondition] = useState<"above" | "below">("above");
  const [price, setPrice] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setAlerts(JSON.parse(stored));
      } catch {
        // ignore malformed storage
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  }, [alerts]);

  function addAlert() {
    if (!price.trim() || isNaN(parseFloat(price))) return;
    setAlerts((a) => [...a, { id: `alert-${Date.now()}`, symbol, condition, price }]);
    setPrice("");
  }

  function removeAlert(id: string) {
    setAlerts((a) => a.filter((al) => al.id !== id));
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <h1 className="mb-1 text-lg font-semibold text-ink">Price Alerts</h1>
        <p className="mb-4 text-xs text-ink-3">
          Saved to this browser only — alert checking/notifications aren&apos;t wired up to live prices yet.
        </p>

        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface-1 p-3">
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="rounded-md border border-border bg-surface-2 px-2 py-1.5 text-sm text-ink"
          >
            {DEMO_ASSETS.map((a) => (
              <option key={a.symbol} value={a.symbol}>
                {a.symbol}
              </option>
            ))}
          </select>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value as "above" | "below")}
            className="rounded-md border border-border bg-surface-2 px-2 py-1.5 text-sm text-ink"
          >
            <option value="above">reaches above</option>
            <option value="below">drops below</option>
          </select>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price"
            inputMode="decimal"
            className="w-28 rounded-md border border-border bg-surface-2 px-2 py-1.5 font-mono text-sm text-ink outline-none focus:border-accent"
          />
          <button onClick={addAlert} className="rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-zinc-950 hover:opacity-90">
            Add Alert
          </button>
        </div>

        <div className="divide-y divide-border rounded-lg border border-border bg-surface-1">
          {alerts.length === 0 && <p className="px-4 py-6 text-center text-sm text-ink-3">No alerts set.</p>}
          {alerts.map((a) => (
            <div key={a.id} className="flex items-center justify-between px-4 py-3">
              <p className="text-sm text-ink">
                {a.symbol} {a.condition === "above" ? "reaches" : "drops below"} <span className="font-mono">${a.price}</span>
              </p>
              <button onClick={() => removeAlert(a.id)} className="text-xs text-ink-3 hover:text-bear">
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
