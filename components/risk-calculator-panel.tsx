"use client";

import { useMemo, useState } from "react";
import { calculateRisk } from "@/lib/risk-calculator";
import { getInstrumentSpec } from "@/lib/instrument-specs";
import type { TradeTicketPrefill } from "./trade-ticket";

export function RiskCalculatorPanel({
  symbol,
  currentPrice,
  onUsePositionSize,
}: {
  symbol: string;
  currentPrice: number;
  onUsePositionSize: (prefill: TradeTicketPrefill) => void;
}) {
  const [mode, setMode] = useState<"lots" | "leverage">("lots");
  const [balance, setBalance] = useState("5000");
  const [riskPct, setRiskPct] = useState("1");
  const [leverageInput, setLeverageInput] = useState("5");
  const [entry, setEntry] = useState(String(currentPrice));
  const [stopLoss, setStopLoss] = useState(String((currentPrice * 0.98).toFixed(2)));
  const [takeProfit, setTakeProfit] = useState(String((currentPrice * 1.04).toFixed(2)));

  const spec = getInstrumentSpec(symbol);

  const result = useMemo(() => {
    const balanceNum = parseFloat(balance) || 0;
    const entryNum = parseFloat(entry) || 0;
    const slNum = parseFloat(stopLoss) || 0;
    const tpNum = parseFloat(takeProfit) || undefined;
    if (balanceNum <= 0 || entryNum <= 0 || slNum <= 0) return null;

    return calculateRisk(
      {
        symbol,
        balance: balanceNum,
        entry: entryNum,
        stopLoss: slNum,
        mode,
        riskPct: mode === "lots" ? parseFloat(riskPct) || 0 : undefined,
        leverage: mode === "leverage" ? parseFloat(leverageInput) || 0 : undefined,
      },
      tpNum
    );
  }, [symbol, balance, entry, stopLoss, takeProfit, mode, riskPct, leverageInput]);

  function handleUse() {
    if (!result) return;
    onUsePositionSize({
      quantity: String(result.positionSize),
      leverage: result.impliedLeverage,
      stopLoss,
      takeProfit: takeProfit || undefined,
      token: Date.now(),
    });
  }

  return (
    <div className="rounded-lg border border-border bg-surface-1 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-2">Risk Calculator</p>
        <div className="flex gap-1 rounded-md bg-surface-2 p-0.5 text-[11px]">
          <button
            onClick={() => setMode("lots")}
            className={`rounded px-2 py-1 ${mode === "lots" ? "bg-surface-1 text-ink" : "text-ink-3"}`}
          >
            Risk %
          </button>
          <button
            onClick={() => setMode("leverage")}
            className={`rounded px-2 py-1 ${mode === "leverage" ? "bg-surface-1 text-ink" : "text-ink-3"}`}
          >
            Leverage
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Balance (USDC)" value={balance} onChange={setBalance} />
        {mode === "lots" ? (
          <Field label="Risk %" value={riskPct} onChange={setRiskPct} />
        ) : (
          <Field label={`Leverage (max ${spec.maxLeverage}×)`} value={leverageInput} onChange={setLeverageInput} />
        )}
        <Field label="Entry price" value={entry} onChange={setEntry} />
        <Field label="Stop loss" value={stopLoss} onChange={setStopLoss} />
        <Field label="Take profit (optional)" value={takeProfit} onChange={setTakeProfit} />
      </div>

      {result ? (
        <div className="mt-3 divide-y divide-surface-2 rounded-md bg-surface-2 text-xs">
          <Row label="Risk amount" value={`$${result.riskAmount.toFixed(2)}`} />
          <Row
            label="Position size"
            value={
              result.lots !== undefined
                ? `${result.lots.toFixed(2)} lots (${result.positionSize.toLocaleString()} ${spec.baseCurrency})`
                : `${result.positionSize} ${spec.baseCurrency}`
            }
          />
          <Row label="Notional value" value={`$${result.notional.toFixed(2)}`} />
          <Row label="Implied leverage" value={`${result.impliedLeverage.toFixed(1)}×`} warn />
          <Row
            label={result.marginIsMinimum ? "Min. margin (at max leverage)" : "Margin required"}
            value={`$${result.marginRequired.toFixed(2)}`}
          />
          <Row label="Potential loss" value={`-$${result.potentialLoss.toFixed(2)}`} bear />
          {result.potentialProfitAtTakeProfit !== undefined && (
            <Row label="Potential profit" value={`+$${result.potentialProfitAtTakeProfit.toFixed(2)}`} bull />
          )}
          {result.riskRewardRatio !== undefined && (
            <Row label="Risk/Reward" value={`1 : ${result.riskRewardRatio.toFixed(2)}`} />
          )}
        </div>
      ) : (
        <p className="mt-3 text-xs text-ink-3">Enter a valid balance, entry, and stop loss to calculate.</p>
      )}

      <button
        onClick={handleUse}
        disabled={!result}
        className="mt-3 w-full rounded-md bg-accent py-2 text-xs font-semibold text-zinc-950 disabled:opacity-40"
      >
        Use Position Size
      </button>
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

function Row({ label, value, warn, bear, bull }: { label: string; value: string; warn?: boolean; bear?: boolean; bull?: boolean }) {
  const color = warn ? "text-warn" : bear ? "text-bear" : bull ? "text-bull" : "text-accent";
  return (
    <div className="flex justify-between px-3 py-1.5">
      <span className="text-ink-3">{label}</span>
      <span className={`font-mono ${color}`}>{value}</span>
    </div>
  );
}
