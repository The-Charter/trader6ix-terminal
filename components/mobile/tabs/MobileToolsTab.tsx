"use client";

import { useState } from "react";
import type { MobileProduct } from "../MobileApp";
import { AIInsightPanel } from "@/components/ai-insight-panel";

export function MobileToolsTab({ symbol, product }: { symbol: string; product: MobileProduct }) {
  const [balance, setBalance] = useState("5000");
  const [riskPct, setRiskPct] = useState("1");
  const [entry, setEntry] = useState("100000");
  const [stop, setStop] = useState("98000");

  const balNum = parseFloat(balance) || 0;
  const riskNum = parseFloat(riskPct) || 0;
  const entryNum = parseFloat(entry) || 0;
  const stopNum = parseFloat(stop) || 0;

  const riskAmount = balNum * (riskNum / 100);
  const priceDiff = Math.abs(entryNum - stopNum);
  const positionSize = priceDiff > 0 ? riskAmount / priceDiff : 0;
  const notional = positionSize * entryNum;
  const impliedLeverage = balNum > 0 ? notional / balNum : 0;

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      {product === "perps" && symbol && <AIInsightPanel symbol={symbol} />}

      <div className="rounded-lg border border-border bg-surface-1 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-2">Risk Calculator</p>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Balance (USDC)" value={balance} onChange={setBalance} />
          <Field label="Risk %" value={riskPct} onChange={setRiskPct} />
          <Field label="Entry price" value={entry} onChange={setEntry} />
          <Field label="Stop loss" value={stop} onChange={setStop} />
        </div>
        <div className="mt-3 divide-y divide-border rounded-md bg-surface-2 text-xs">
          <Row label="Risk amount" value={`$${riskAmount.toFixed(2)}`} />
          <Row label="Position size" value={positionSize.toFixed(4)} />
          <Row label="Notional value" value={`$${notional.toFixed(2)}`} />
          <Row label="Implied leverage" value={`${impliedLeverage.toFixed(1)}×`} warn />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface-1 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-2">Economic Calendar</p>
        <p className="mt-2 text-xs text-ink-3">
          Not built yet — this will show real macro events once a data feed is connected. No placeholder events shown
          here.
        </p>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase text-ink-3">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="decimal"
        className="rounded-md border border-border bg-surface-2 px-2 py-1.5 font-mono text-xs text-ink outline-none focus:border-accent"
      />
    </label>
  );
}

function Row({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex justify-between px-3 py-1.5">
      <span className="text-ink-3">{label}</span>
      <span className={`font-mono ${warn ? "text-warn" : "text-accent"}`}>{value}</span>
    </div>
  );
}
