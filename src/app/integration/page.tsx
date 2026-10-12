import type { Metadata } from "next";
import { SiteLayout } from "@/components/trader6ix/site-layout";
import { IntegrationHero, IntegrationGrid } from "@/components/trader6ix/integration-sections";
import { CTA, FAQ, Testimonials } from "@/components/trader6ix/sections";

export const metadata: Metadata = {
  title: "Integrations — Trader6ix",
  description: "Connect Trader6ix to the apps you love and make your customer experience awesome.",
};

export default function IntegrationPage() {
  return (
    <SiteLayout>
      <main className="integration-page">
        <IntegrationHero />
        <IntegrationGrid />
        <div className="site-container">
          <Testimonials />
        </div>
        <div className="site-container">
          <FAQ />
        </div>
        <div className="site-container">
          <CTA to="/auth" />
        </div>
      </main>
    </SiteLayout>
  );
}
