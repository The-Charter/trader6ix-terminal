import type { Metadata } from "next";
import { SiteLayout } from "@/components/trader6ix/site-layout";
import {
  AboutHero,
  AboutMission,
  AboutProcess,
  AboutBenefits,
  AboutCTA,
} from "@/components/trader6ix/about-sections";

export const metadata: Metadata = {
  title: "About Us — Trader6ix",
  description:
    "Explore the Trader6ix mission, trading process and benefits.",
};

export default function AboutPage() {
  return (
    <SiteLayout>
      <main className="about-page">
        <AboutHero />
        <AboutMission />
        <AboutProcess />
        <AboutBenefits />
        <AboutCTA />
      </main>
    </SiteLayout>
  );
}
