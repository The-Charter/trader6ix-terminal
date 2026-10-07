"use client";

import { AppHeader } from "@/components/app-header";
import { ComingSoon } from "@/components/coming-soon";

export default function FxPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <ComingSoon
        title="Stablecoin FX"
        description="Stablecoin FX is coming soon. It requires Circle's institutional KYB/AML verification before it can go live."
      />
    </div>
  );
}
