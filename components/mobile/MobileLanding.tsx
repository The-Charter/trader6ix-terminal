"use client";

import { usePrivy } from "@privy-io/react-auth";
import type { MobileProduct } from "./MobileApp";

const FAUCET_URL = process.env.NEXT_PUBLIC_FAUCET_URL ?? "https://faucet.circle.com";

const OPTIONS: { id: MobileProduct; label: string; description: string }[] = [
  { id: "perps", label: "Perpetuals", description: "Crypto & FX leveraged futures" },
  { id: "spot", label: "Spot", description: "Crypto & FX token swaps" },
];

export function MobileLanding({ onSelect }: { onSelect: (product: MobileProduct) => void }) {
  const { login, authenticated, ready } = usePrivy();

  return (
    <div
      className="flex min-h-[100dvh] flex-col bg-surface-0 px-5 pb-10 pt-8"
      style={{
        paddingTop: "calc(2rem + env(safe-area-inset-top))",
        paddingBottom: "calc(2.5rem + env(safe-area-inset-bottom))",
      }}
    >
      <div className="flex flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.jpg" alt="Trader6ix" className="h-16 w-auto rounded-lg" />
        <span className="mt-3 rounded-full border border-warn/40 bg-warn/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wide text-warn">
          Arc Testnet
        </span>
      </div>

      <p className="mb-4 mt-8 text-center text-sm text-ink-2">What do you want to trade?</p>

      <div className="flex flex-col gap-3">
        {OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            className="flex flex-col items-start rounded-xl border border-border bg-surface-1 px-4 py-4 text-left transition active:scale-[0.98] active:border-accent"
          >
            <span className="text-base font-semibold text-ink">{opt.label}</span>
            <span className="mt-0.5 text-xs text-ink-3">{opt.description}</span>
          </button>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-2">
        <button
          onClick={login}
          disabled={!ready || authenticated}
          className="rounded-xl bg-accent py-3 text-sm font-semibold text-zinc-950 disabled:opacity-60"
        >
          {authenticated ? "Wallet Connected" : "Connect Wallet"}
        </button>
        <a
          href={FAUCET_URL}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-border py-3 text-center text-sm font-medium text-ink-2"
        >
          Get Testnet USDC ↗
        </a>
      </div>
    </div>
  );
}
