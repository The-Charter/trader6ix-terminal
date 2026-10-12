import type { Metadata } from "next";
import { SiteLayout } from "@/components/trader6ix/site-layout";
import {
  AboutHero,
  AboutMission,
  AboutProcess,
  AboutBenefits,
  AboutEvents,
  AboutCTA,
} from "@/components/trader6ix/about-sections";

export const metadata: Metadata = {
  title: "About Us — Trader6ix",
  description:
    "Meet the Trader6ix founders and explore our multi-asset investing mission, trading process, benefits, and recent events.",
};

export default function AboutPage() {
  return (
    <SiteLayout>
      <main className="about-page">
        <AboutHero />
        <AboutMission />
        <AboutProcess />
        <AboutBenefits />
        <AboutEvents />
        <AboutCTA />
      </main>
    </SiteLayout>
  );
}
