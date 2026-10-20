import type { Metadata } from "next";
import { PerpsPage } from "@/components/trader6ix/app-pages";

export const metadata: Metadata = {
  title: "Perps design preview — Trader6ix",
  description: "Design preview of the perpetuals terminal, populated with demo values.",
  robots: { index: false, follow: false },
};

/**
 * Design preview of the perpetuals terminal.
 *
 * `PerpsPage` is the original layout: hardcoded markets, a generated candle
 * series and sample statistics — no API calls. It is mounted here rather than at
 * `/perps` so the shipped page keeps telling the truth about Perps being
 * unconnected (Hibachi is still unresolved), while the design stays reviewable.
 *
 * The badge is deliberate: nothing on this screen is live data.
 */
export default function PerpsPreviewRoute() {
  return (
    <>
      <PerpsPage />
      <p className="preview-badge" role="note">
        Design preview · demo values, not live data
      </p>
    </>
  );
}
