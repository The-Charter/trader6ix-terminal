"use client";

import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { VenueSelector } from "@/components/venue-selector";
import { FxTicket } from "@/components/fx-ticket";
import { FX_ADAPTERS, DEFAULT_FX_ADAPTER_ID, getFxAdapter } from "@/lib/adapters/registry";

export default function FxPage() {
  const [adapterId, setAdapterId] = useState(DEFAULT_FX_ADAPTER_ID);
  const adapter = getFxAdapter(adapterId) ?? FX_ADAPTERS[0];

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
        <VenueSelector adapters={FX_ADAPTERS} selectedId={adapterId} onSelect={setAdapterId} />
        <span className="text-xs text-ink-3">Stablecoin FX</span>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-10">
        {adapter.isLive ? (
          <FxTicket adapter={adapter} />
        ) : (
          <div className="max-w-lg text-center">
            <h1 className="text-2xl font-semibold text-ink">Stablecoin FX — not yet configured</h1>
            <p className="mt-3 text-sm text-ink-2">
              {adapter.displayName} requires Circle&apos;s institutional KYB/AML verification before it can go live.
              Switch to Demo Stablecoin FX above to preview the experience.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
