"use client";

import { AppHeader } from "@/components/app-header";
import { SPOT_ADAPTERS } from "@/lib/adapters/registry";

export default function SpotPage() {
  const adapter = SPOT_ADAPTERS[0];

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <div className="border-b border-warn/20 bg-warn/5 px-4 py-2 text-xs text-warn">
        Spot trading (via {adapter.displayName}) is being wired up — this page will activate automatically once
        the venue is configured. Nothing here is simulated in the meantime.
      </div>

      <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-semibold text-ink">Spot trading — coming soon</h1>
        <p className="mt-3 text-sm text-ink-2">
          Spot markets on Trader6ix are powered by onchain DEX liquidity (starting with{" "}
          {adapter.displayName} on Arc testnet) rather than an off-chain order book. This screen will show real,
          live swap pricing the moment the pool is verified and connected — no placeholder numbers until then.
        </p>
      </div>
    </div>
  );
}
