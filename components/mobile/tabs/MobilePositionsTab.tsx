"use client";

import type { MobileProduct } from "../MobileApp";
import { PositionsPanel } from "@/components/positions-panel";

export function MobilePositionsTab({ product, adapter }: { product: MobileProduct; adapter: any }) {
  if (product !== "perps") {
    return (
      <p className="px-4 py-8 text-center text-sm text-ink-3">
        {product === "spot" ? "Spot swaps" : "FX settlements"} complete instantly — there&apos;s no open position to
        track here. Check History for past activity.
      </p>
    );
  }

  return <PositionsPanel adapter={adapter} />;
}
