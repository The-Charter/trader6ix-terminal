"use client";

import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { VenueSelector } from "@/components/venue-selector";
import { SwapTicket } from "@/components/swap-ticket";
import { SPOT_ADAPTERS, DEFAULT_SPOT_ADAPTER_ID, getSpotAdapter } from "@/lib/adapters/registry";

export default function SpotPage() {
  const [adapterId, setAdapterId] = useState(DEFAULT_SPOT_ADAPTER_ID);
  const adapter = getSpotAdapter(adapterId) ?? SPOT_ADAPTERS[0];

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
        <VenueSelector adapters={SPOT_ADAPTERS} selectedId={adapterId} onSelect={setAdapterId} />
        <span className="text-xs text-ink-3">Spot</span>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-10">
        {adapter.isLive ? (
          <SwapTicket adapter={adapter} />
        ) : (
          <div className="max-w-lg text-center">
            <h1 className="text-2xl font-semibold text-ink">Spot trading — not yet configured</h1>
            <p className="mt-3 text-sm text-ink-2">
              {adapter.displayName} isn&apos;t connected yet. Switch to Demo Spot above to preview the experience.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
