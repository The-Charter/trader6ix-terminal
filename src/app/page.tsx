import type { Metadata } from "next";
import { SiteLayout } from "@/components/trader6ix/site-layout";
import { ARC_CHAIN_NAME } from "@/lib/arc-network";
import {
  CTA,
  FAQ,
  Features,
  Hero,
  Reveal,
  Testimonials,
  Trust,
  WhyChooseUs,
} from "@/components/trader6ix/sections";

export const metadata: Metadata = {
  title: `Trader6ix — Spot & Perps on ${ARC_CHAIN_NAME}`,
  description: `Access live analytics, staking insights, and portfolio performance tools designed for fast-moving crypto markets on ${ARC_CHAIN_NAME}.`,
};

export default function HomePage() {
  return (
    <SiteLayout>
      <main className="t6-landing">
        <Hero />
        <Trust />
        <div className="site-container">
          <WhyChooseUs />
          <Reveal>
            <Features />
          </Reveal>
          {/* Testimonials hidden for now.
          <Reveal>
            <Testimonials />
          </Reveal>
          */}
          <Reveal>
            <FAQ />
          </Reveal>
          <Reveal>
            <CTA to="/auth" />
          </Reveal>
        </div>
      </main>
    </SiteLayout>
  );
}
