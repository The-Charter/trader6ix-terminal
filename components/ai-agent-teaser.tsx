"use client";

const FEATURES = [
  "Pattern recognition across FX + crypto",
  "Risk-aware entry and SL/TP suggestions",
  "Automated position management",
  "Non-custodial — runs on your wallet",
];

export function AIAgentTeaser() {
  return (
    <div className="rounded-lg border border-accent/20 bg-accent/5 p-4 text-center">
      <p className="mb-1 text-sm font-semibold text-ink">Personal Trading Agent</p>
      <p className="mb-3 text-xs text-ink-2">
        Train your own agent on Arc ERC-8004 — non-custodial, runs on your wallet.
      </p>
      <div className="mb-3 rounded-md bg-surface-2 p-3 text-left">
        {FEATURES.map((f) => (
          <div key={f} className="flex items-start gap-2 py-0.5 text-xs text-ink-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
            <span>{f}</span>
          </div>
        ))}
      </div>
      <span className="inline-block rounded-full border border-accent px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-accent">
        Coming Soon
      </span>
    </div>
  );
}
