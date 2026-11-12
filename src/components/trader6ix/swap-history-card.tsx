"use client";

import { ArrowRightLeft, ExternalLink } from "lucide-react";
import type { TradeItem } from "@/components/trader6ix/use-portfolio";
import { arcExplorerTxUrl } from "@/lib/arc-network";

function relativeTime(unixSeconds: number): string {
  const diff = Math.max(0, Math.floor(Date.now() / 1000) - unixSeconds);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86_400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604_800) return `${Math.floor(diff / 86_400)}d ago`;
  return new Date(unixSeconds * 1000).toLocaleDateString();
}

/**
 * Spot swap history, newest first. One component so the Spot page and the
 * Portfolio page render the same records the same way. Spot only: perpetuals
 * history has its own panel and never reads this feed.
 */
export function SwapHistoryCard({
  address,
  trades,
  loading,
  error,
  authExpired,
  nextBefore,
  scannedBackTo,
  loadingOlder,
  onLoadOlder,
  onRetry,
}: {
  address: string | null;
  trades: TradeItem[];
  loading: boolean;
  error: string | null;
  authExpired: boolean;
  nextBefore: number | null;
  scannedBackTo: string | null;
  loadingOlder: boolean;
  onLoadOlder: () => void | Promise<void>;
  onRetry: () => void | Promise<void>;
}) {
  return (
    <section className="pf-card" aria-label="Spot swap history">
      <header className="pf-card-head">
        <h2>Swap history</h2>
        <span className="pf-muted pf-small">Spot</span>
      </header>
      {!address ? (
        <div className="pf-empty-block">
          <p className="pf-empty-title">Connect your wallet</p>
          <p className="pf-empty-body">Sign in to see the swaps executed from your wallet.</p>
        </div>
      ) : authExpired ? (
        <div className="pf-empty-block">
          <p className="pf-empty-title">Your session has expired</p>
          <p className="pf-empty-body">Sign in again to see your swap history. Nothing has changed on chain.</p>
        </div>
      ) : trades.length === 0 ? (
        <div className="pf-empty-block">
          <p className="pf-empty-title">
            {loading ? "Reading on-chain swaps…" : error ? "Couldn’t load swaps" : "No swaps found yet"}
          </p>
          <p className="pf-empty-body">
            {error
              ? "Your swaps are safe; this is only a loading problem."
              : nextBefore !== null
                ? `No swaps found back to ${
                    scannedBackTo
                      ? new Date(scannedBackTo).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
                      : "the start of the search"
                  }. Older swaps may exist.`
                : "Your swaps will appear here after your first trade. This wallet needs USDC on Arc mainnet to get started."}
          </p>
          {error && (
            <button type="button" className="pf-empty-cta" onClick={() => void onRetry()}>
              Try again
            </button>
          )}
          {!error && nextBefore !== null && (
            <button type="button" className="pf-empty-cta" onClick={() => void onLoadOlder()} disabled={loadingOlder}>
              {loadingOlder ? "Searching…" : "Search older"}
            </button>
          )}
        </div>
      ) : (
        <>
          <ul className="pf-activity pf-swaps">
            {trades.map((trade, index) => {
              const [pairFrom, pairTo] = trade.symbol.split("/");
              const fromSym = trade.fromSymbol ?? pairFrom;
              const toSym = trade.toSymbol ?? pairTo;
              const fromAmt = Number(trade.fromAmount ?? trade.quantity);
              const toAmt = Number(trade.toAmount ?? Number(trade.quantity) * Number(trade.price ?? 0));
              const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 6 });
              return (
                <li key={trade.txHash ?? `${trade.timestamp}-${index}`} className="swap">
                  <span className="pf-act-glyph" aria-hidden="true">
                    <ArrowRightLeft size={15} />
                  </span>
                  <span className="pf-swap-main">
                    <span className="pf-swap-pair">
                      {fromSym} → {toSym}
                    </span>
                    <span className="pf-swap-amts pf-mono">
                      {fmt(fromAmt)} {fromSym} → {fmt(toAmt)} {toSym}
                    </span>
                  </span>
                  <span className="pf-swap-meta">
                    <span className="pf-swap-status">Confirmed</span>
                    <span className="pf-act-time pf-mono" title={new Date(trade.timestamp * 1000).toLocaleString()}>
                      {relativeTime(trade.timestamp)}
                    </span>
                    {trade.txHash && (
                      <a
                        className="pf-swap-hash pf-mono"
                        href={arcExplorerTxUrl(trade.txHash)}
                        target="_blank"
                        rel="noreferrer"
                        title={trade.txHash}
                      >
                        {trade.txHash.slice(0, 6)}…{trade.txHash.slice(-4)}
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="pf-swap-more">
            {nextBefore !== null ? (
              <>
                <span className="pf-muted pf-small">
                  Searched back to{" "}
                  {scannedBackTo
                    ? new Date(scannedBackTo).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
                    : "recent blocks"}
                  .
                </span>
                <button type="button" className="pf-empty-cta" onClick={() => void onLoadOlder()} disabled={loadingOlder}>
                  {loadingOlder ? "Searching…" : "Load older swaps"}
                </button>
              </>
            ) : (
              <span className="pf-muted pf-small">
                {scannedBackTo === null
                  ? "Showing the most recent swaps this API returns."
                  : "That is the start of this wallet’s swap history."}
              </span>
            )}
          </div>
        </>
      )}
    </section>
  );
}
