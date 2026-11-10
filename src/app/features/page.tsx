import type { Metadata } from "next";
import { SiteLayout } from "@/components/trader6ix/site-layout";
import {
  FeaturesHero,
  FeaturesBenefits,
  FeaturesSolutions,
  FeaturesCTA,
} from "@/components/trader6ix/features-sections";

export const metadata: Metadata = {
  title: "Features — Trader6ix",
  description:
    "Markets, charts, risk-based position sizing and execution in one onchain trading terminal on Arc.",
};

export default function FeaturesPage() {
  return (
    <SiteLayout>
      <main className="features-page">
        <FeaturesHero />
        <FeaturesBenefits />
        <FeaturesSolutions />
        <FeaturesCTA />
      </main>
    </SiteLayout>
  );
}
