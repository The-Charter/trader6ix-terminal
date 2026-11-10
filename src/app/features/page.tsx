import type { Metadata } from "next";
import { SiteLayout } from "@/components/trader6ix/site-layout";
import { HowCTA, HowHero, HowSteps } from "@/components/trader6ix/how-it-works-sections";

export const metadata: Metadata = {
  title: "How It Works — Trader6ix",
  description:
    "From choosing a market to managing a position: how the Trader6ix terminal works, what is live today on Arc, and what is still being built.",
};

export default function FeaturesPage() {
  return (
    <SiteLayout>
      <main className="features-page">
        <HowHero />
        <HowSteps />
        <HowCTA />
      </main>
    </SiteLayout>
  );
}
