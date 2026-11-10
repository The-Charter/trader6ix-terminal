import type { Metadata } from "next";
import { SiteLayout } from "@/components/trader6ix/site-layout";
import { FaqHero, FaqTabs } from "@/components/trader6ix/faq-sections";
import { CTA } from "@/components/trader6ix/sections";

export const metadata: Metadata = {
  title: "FAQ — Trader6ix",
  description: "What Trader6ix is, what is live today and what is still being built.",
};

export default function FaqPage() {
  return (
    <SiteLayout>
      <main className="faqpage">
        <FaqHero />
        <FaqTabs />
        <div className="site-container">
          <CTA />
        </div>
      </main>
    </SiteLayout>
  );
}
