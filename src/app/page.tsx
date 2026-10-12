import type { Metadata } from "next";
import { SiteLayout } from "@/components/trader6ix/site-layout";
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
  title: "Trader6ix — Spot & Perps on Arc Testnet",
  description:
    "Access live analytics, staking insights, and portfolio performance tools designed for fast-moving crypto markets on Arc Testnet.",
};

export default function HomePage() {
  return (
    <SiteLayout>
      <main>
        <Hero />
        <Trust />
        <div className="site-container">
          <WhyChooseUs />
          <Reveal>
            <Features />
          </Reveal>
          <Reveal>
            <Testimonials />
          </Reveal>
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
