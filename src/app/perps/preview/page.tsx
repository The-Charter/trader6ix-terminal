import type { Metadata } from "next";
import { PerpsPage } from "@/components/trader6ix/app-pages";
import { PerpsMobile } from "@/components/trader6ix/perps-mobile";

export const metadata: Metadata = {
  title: "Perps design preview — Trader6ix",
  description: "Design preview of the perpetuals terminal, populated with demo values.",
  robots: { index: false, follow: false },
};

/**
 * Design preview of the perpetuals terminal.
 *
 * Phones get `PerpsMobile` — the compact, full-height, zero-page-scroll terminal
 * (markets, chart, trade sheet, positions, history, tools). Wider screens keep
 * the original desktop `PerpsPage`. Both use hardcoded demo values and make no
 * API calls; it is mounted here rather than at `/perps` so the shipped page
 * keeps telling the truth about Perps being unconnected (Hibachi is still
 * unresolved). The badge is deliberate: nothing on this screen is live data.
 */
export default function PerpsPreviewRoute() {
  return (
    <>
      <div className="pm-wrap-desktop">
        <PerpsPage />
        <p className="preview-badge" role="note">
          Design preview · demo values, not live data
        </p>
      </div>
      <div className="pm-wrap-mobile">
        <PerpsMobile />
      </div>
    </>
  );
}
