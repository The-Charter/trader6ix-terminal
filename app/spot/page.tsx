"use client";

import { AppHeader } from "@/components/app-header";
import { SwapTicket } from "@/components/swap-ticket";
import { SPOT_ADAPTERS } from "@/lib/adapters/registry";

export default function SpotPage() {
  const adapter = SPOT_ADAPTERS[0];

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      {!adapter.isLive && (
        <div className="border-b border-warn/20 bg-warn/5 px-4 py-2 text-xs text-warn">
          Spot trading (via {adapter.displayName}) is being wired up — this page will activate automatically once
          the venue is configured. Nothing here is simulated in the meantime.
        </div>
      )}

      <div className="flex flex-1 items-center justify-center px-6 py-10">
        {adapter.isLive ? (
          <SwapTicket adapter={adapter} />
        ) : (
          <div className="max-w-lg text-center">
            <h1 className="text-2xl font-semibold text-ink">Spot trading — coming soon</h1>
            <p className="mt-3 text-sm text-ink-2">
              Spot markets on Trader6ix are powered by onchain DEX liquidity (starting with {adapter.displayName}{" "}
              on Arc testnet) rather than an off-chain order book.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
