import type { Metadata } from "next";
import { SiteLayout } from "@/components/trader6ix/site-layout";
import {
  CareerHero,
  CareerPositions,
  CareerWhy,
  CareerPerks,
} from "@/components/trader6ix/career-sections";
import { CTA } from "@/components/trader6ix/sections";

export const metadata: Metadata = {
  title: "Careers — Trader6ix",
  description: "Join the team powering the next generation of traders at Trader6ix.",
};

export default function CareerPage() {
  return (
    <SiteLayout>
      <main className="careerpage">
        <CareerHero />
        <CareerPositions />
        <CareerWhy />
        <CareerPerks />
        <div className="site-container">
          <CTA to="/auth" />
        </div>
      </main>
    </SiteLayout>
  );
}
