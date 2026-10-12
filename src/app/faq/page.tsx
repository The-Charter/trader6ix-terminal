import type { Metadata } from "next";
import { SiteLayout } from "@/components/trader6ix/site-layout";
import { FaqHero, FaqTabs } from "@/components/trader6ix/faq-sections";
import { CTA } from "@/components/trader6ix/sections";

export const metadata: Metadata = {
  title: "FAQ — Trader6ix",
  description: "Find answers to your questions about Trader6ix.",
};

export default function FaqPage() {
  return (
    <SiteLayout>
      <main className="faqpage">
        <FaqHero />
        <FaqTabs />
        <div className="site-container">
          <CTA to="/auth" />
        </div>
      </main>
    </SiteLayout>
  );
}
