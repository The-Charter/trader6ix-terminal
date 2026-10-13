import type { Metadata } from "next";
import { ComingSoon } from "@/components/trader6ix/coming-soon";

export const metadata: Metadata = {
  title: "Perpetual Trading — Trader6ix",
  description: "Perpetual futures are coming soon to Trader6ix.",
};

export default function PerpsRoute() {
  return (
    <ComingSoon
      title="Perpetual futures"
      description="Leveraged perps are being connected to Hibachi and will be available shortly."
    />
  );
}
