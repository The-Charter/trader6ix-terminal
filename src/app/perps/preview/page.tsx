import type { Metadata } from "next";
import { PerpsMobile } from "@/components/trader6ix/perps-mobile";

export const metadata: Metadata = {
  title: "Perps design preview — Trader6ix",
  description: "Design preview of the perpetuals terminal, populated with demo values.",
  robots: { index: false, follow: false },
};

/**
 * Design preview of the perpetuals terminal.
 *
 * One terminal for every width: phones get the compact single-screen layout,
 * desktops get a markets / chart + account / order-ticket workspace built from
 * the same components and state. Market and position values are simulated and
 * nothing is sent anywhere; it is mounted here rather than at `/perps` so the
 * shipped page keeps telling the truth about Perps being unconnected.
 */
export default function PerpsPreviewRoute() {
  return <PerpsMobile />;
}
