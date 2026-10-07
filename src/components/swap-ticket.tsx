"use client";

import { ethers } from "ethers";
import { useState, useEffect, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import type { SpotAdapter } from "@/adapters/spot-adapter";
import { TokenLogo } from "@/components/token-logo";
import { TOWER_TOKENS, type TowerTokenSymbol } from "@/lib/tower/tokens";

const ERC20_BALANCE_ABI = ["function balanceOf(address account) view returns (uint256)"];

export function SwapTicket({ adapter }: { adapter: SpotAdapter }) {
  const { authenticated, login, user } = usePrivy();
  const walletAddress = user?.wallet?.address ?? null;

  const [fromSymbol, setFromSymbol] = useState<TowerTokenSymbol>("EURC");
  const [toSymbol, setToSymbol] = useState<TowerTokenSymbol>("USDC");
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<{ amountOut: string } | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [balances, setBalances] = useState<Partial<Record<TowerTokenSymbol, string>>>({});
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [completedSwap, setCompletedSwap] = useState<{
    amountIn: string;
    amountOut: string;
    from: string;
    to: string;
    txHash: string;
  } | null>(null);

  const from = fromSymbol;
  const to = toSymbol;
  const amountNum = parseFloat(amount);
  const amountValid = amount.trim() !== "" && Number.isFinite(amountNum) && amountNum > 0;

  useEffect(() => {
    let cancelled = false;
    async function loadBalances() {
      if (!walletAddress || typeof window === "undefined" || !(window as any).ethereum) {
        setBalances({});
        return;
      }
      setBalancesLoading(true);
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const values = await Promise.all(
          TOWER_TOKENS.map(async (token) => {
            const contract = new ethers.Contract(token.address, ERC20_BALANCE_ABI, provider);
            const balance = await contract.balanceOf(walletAddress);
            return [token.symbol, ethers.formatUnits(balance, token.decimals)] as const;
          })
        );
        if (!cancelled) setBalances(Object.fromEntries(values));
      } catch {
        if (!cancelled) setBalances({});
      } finally {
        if (!cancelled) setBalancesLoading(false);
      }
    }
    loadBalances();
    return () => { cancelled = true; };
  }, [walletAddress]);

  const fetchQuote = useCallback(async () => {
    if (!amountValid) {
      setQuote(null);
      return;
    }
    setQuoting(true);
    setQuoteError(null);
    try {
      const q = await adapter.getSwapQuote({ base: fromSymbol, quote: toSymbol, side: "sell", amount });
      setQuote({ amountOut: q.amountOut });
    } catch (err) {
      setQuoteError(err instanceof Error ? err.message : "Failed to get quote");
      setQuote(null);
    } finally {
      setQuoting(false);
    }
  }, [adapter, fromSymbol, toSymbol, amount, amountValid]);

  useEffect(() => {
    const t = setTimeout(fetchQuote, 400); // debounce
    return () => clearTimeout(t);
  }, [fetchQuote]);

  async function handleSwap() {
    if (!walletAddress || !amountValid || !quote) return;
    setSwapping(true);
    setResult(null);
    setCompletedSwap(null);
    try {
      const res = await adapter.swap({ base: fromSymbol, quote: toSymbol, side: "sell", amount }, walletAddress);
      if (!res.ok) throw new Error(res.error ?? "Swap failed");
      const isDemo = adapter.id.startsWith("mock-");
      setResult({
        ok: true,
        message: isDemo
          ? "Demo transaction — no real funds were moved."
          : `Swap submitted — tx ${res.txHash?.slice(0, 10)}…`,
      });
      if (!isDemo && res.txHash) {
        setCompletedSwap({
          amountIn: amount,
          amountOut: quote.amountOut,
          from,
          to,
          txHash: res.txHash,
        });
      }
      setAmount("");
      setQuote(null);
    } catch (err) {
      setResult({ ok: false, message: err instanceof Error ? err.message : "Swap failed" });
    } finally {
      setSwapping(false);
    }
  }

  return (
    <>
      <div className="mx-auto flex w-full max-w-sm flex-col gap-3 rounded-lg border border-border bg-surface-1 p-5">
      <div className="flex items-center justify-between rounded-md bg-surface-2 px-3 py-2">
        <label className="flex items-center gap-2 text-sm text-ink">
          <TokenLogo symbol={from as any} size={20} />
          <select
            value={from}
            onChange={(event) => {
              const symbol = event.target.value as TowerTokenSymbol;
              setFromSymbol(symbol);
              if (symbol === toSymbol) setToSymbol(fromSymbol);
              setAmount("");
              setQuote(null);
            }}
            className="bg-transparent font-medium outline-none"
          >
            {TOWER_TOKENS.map((token) => <option key={token.symbol} value={token.symbol} disabled={token.symbol === to}>{token.symbol}</option>)}
          </select>
        </label>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          inputMode="decimal"
          className="w-28 bg-transparent text-right font-mono text-sm text-ink outline-none"
        />
      </div>
      <p className="mt-[-8px] text-right text-[11px] text-ink-3">
        Balance: {balances[fromSymbol] ? Number(balances[fromSymbol]).toLocaleString(undefined, { maximumFractionDigits: 4 }) : balancesLoading ? "Loading..." : "--"}
      </p>

      <button
        onClick={() => {
          setFromSymbol(toSymbol);
          setToSymbol(fromSymbol);
          setAmount("");
          setQuote(null);
        }}
        className="mx-auto rounded-full border border-border bg-surface-2 px-2 py-1 text-xs text-ink-2 hover:text-ink"
      >
        ↓↑ swap direction
      </button>

      <div className="flex items-center justify-between rounded-md bg-surface-2 px-3 py-2">
        <label className="flex items-center gap-2 text-sm text-ink">
          <TokenLogo symbol={to as any} size={20} />
          <select
            value={to}
            onChange={(event) => {
              const symbol = event.target.value as TowerTokenSymbol;
              setToSymbol(symbol);
              if (symbol === fromSymbol) setFromSymbol(toSymbol);
              setAmount("");
              setQuote(null);
            }}
            className="bg-transparent font-medium outline-none"
          >
            {TOWER_TOKENS.map((token) => <option key={token.symbol} value={token.symbol} disabled={token.symbol === from}>{token.symbol}</option>)}
          </select>
        </label>
        <span className="font-mono text-sm text-ink-2">
          {quoting ? "…" : quote ? Number(quote.amountOut).toFixed(4) : "0.00"}
        </span>
      </div>

      <p className="mt-[-8px] text-right text-[11px] text-ink-3">
        Balance: {balances[toSymbol] ? Number(balances[toSymbol]).toLocaleString(undefined, { maximumFractionDigits: 4 }) : balancesLoading ? "Loading..." : "--"}
      </p>
      {quoteError && <p className="text-xs text-bear">{quoteError}</p>}

      {!authenticated ? (
        <button onClick={login} className="rounded-md bg-accent py-2.5 text-sm font-semibold text-zinc-950 hover:opacity-90">
          Connect Wallet to Swap
        </button>
      ) : (
        <button
          onClick={handleSwap}
          disabled={!amountValid || !quote || swapping}
          className="rounded-md bg-accent py-2.5 text-sm font-semibold text-zinc-950 hover:opacity-90 disabled:opacity-40"
        >
          {swapping ? "Swapping…" : `Swap ${from} → ${to}`}
        </button>
      )}

      {result && !result.ok && <p className="text-xs text-bear">{result.message}</p>}

      <p className="text-center text-[11px] text-ink-3">
        Routed via {adapter.displayName} on Arc testnet. Testnet only — verify the pool contract on
        testnet.arcscan.app before trading real value.
      </p>
      </div>

      {completedSwap && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="swap-success-title"
          onClick={() => setCompletedSwap(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-border bg-surface-1 p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-bull">Swap successful</p>
                <h2 id="swap-success-title" className="mt-1 text-xl font-semibold text-ink">
                  Your transaction is complete
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setCompletedSwap(null)}
                aria-label="Close swap confirmation"
                className="rounded-md px-2 py-1 text-lg text-ink-2 hover:bg-surface-2 hover:text-ink"
              >
                ×
              </button>
            </div>

            <dl className="mt-5 space-y-3 rounded-lg border border-border bg-surface-2 p-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-ink-3">You paid</dt>
                <dd className="font-mono text-ink">{completedSwap.amountIn} {completedSwap.from}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-ink-3">You received</dt>
                <dd className="font-mono text-ink">{Number(completedSwap.amountOut).toFixed(4)} {completedSwap.to}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-ink-3">Network</dt>
                <dd className="text-ink">Arc Testnet</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-ink-3">Transaction hash</dt>
                <dd className="break-all font-mono text-xs text-ink">{completedSwap.txHash}</dd>
              </div>
            </dl>

            <a
              href={`https://explorer.arc.io/tx/${completedSwap.txHash}`}
              target="_blank"
              rel="noreferrer"
              className="mt-5 block rounded-md bg-accent px-4 py-2.5 text-center text-sm font-semibold text-zinc-950 hover:opacity-90"
            >
              View transaction on Arc Explorer
            </a>
          </div>
        </div>
      )}
    </>
  );
}
