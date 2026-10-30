import type { Metadata } from "next";
import { SiteLayout } from "@/components/trader6ix/site-layout";
import { ARC_CHAIN_NAME } from "@/lib/arc-network";
import {
  ArchitectureArc,
  CTA,
  FAQ,
  Features,
  Hero,
  Integrations,
  Markets,
  Reveal,
  RiskSizing,
  WhyChooseUs,
} from "@/components/trader6ix/sections";

export const metadata: Metadata = {
  title: `Trader6ix — Spot & Perps on ${ARC_CHAIN_NAME}`,
  description: `A trader-focused terminal bringing multiple markets and onchain liquidity into one familiar trading environment on ${ARC_CHAIN_NAME}. Spot swaps via Tower Exchange; perpetuals via Hibachi in development.`,
};

export default function HomePage() {
  return (
    <SiteLayout>
      <main>
        <Hero />
        <div className="site-container">
          <Integrations />
          <WhyChooseUs />
          <Reveal>
            <Markets />
          </Reveal>
          <Reveal>
            <RiskSizing />
          </Reveal>
          <Reveal>
            <ArchitectureArc />
          </Reveal>
          <Reveal>
            <Features />
          </Reveal>
          <Reveal>
            <FAQ />
          </Reveal>
          <Reveal>
            <CTA connect />
          </Reveal>
        </div>
      </main>
    </SiteLayout>
  );
}
