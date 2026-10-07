"use client";

import { AppHeader } from "@/components/app-header";
import { ComingSoon } from "@/components/coming-soon";

export default function PerpsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <ComingSoon
        title="Perpetual futures"
        description="Leveraged perps are being connected to Hibachi and will be available shortly."
      />
    </div>
  );
}
