import type { Metadata } from "next";
import { SiteLayout } from "@/components/trader6ix/site-layout";
import {
  FeaturesHero,
  FeaturesSuccess,
  FeaturesBenefits,
  FeaturesSolutions,
  FeaturesCTA,
} from "@/components/trader6ix/features-sections";

export const metadata: Metadata = {
  title: "Our Features — Trader6ix",
  description:
    "Explore Trader6ix's pricing solutions, trading platforms, market insights, and dashboard tools — all your investing in one place.",
};

export default function FeaturesPage() {
  return (
    <SiteLayout>
      <main className="features-page">
        <FeaturesHero />
        <FeaturesSuccess />
        <FeaturesBenefits />
        <FeaturesSolutions />
        <FeaturesCTA />
      </main>
    </SiteLayout>
  );
}
