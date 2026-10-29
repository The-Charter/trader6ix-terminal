import type { Metadata } from "next";
import { SiteLayout } from "@/components/trader6ix/site-layout";
import { CTA } from "@/components/trader6ix/sections";
import { ConnectWalletButton } from "@/components/trader6ix/connect-wallet-button";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `${params.slug ?? ""} Integration — Trader6ix`,
    description: "Bring your favorite tools together with Trader6ix integrations.",
  };
}

function displayName(slug: string) {
  if (slug === "storyflow") return "Storyflow";
  return slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

export default function IntegrationSlugPage({ params }: Props) {
  const name = displayName(params.slug ?? "");
  return (
    <SiteLayout>
      <main className="inner-page site-container">
        <h1 className="page-title">{name} Integration</h1>
        <div className="center-heading">
          <p className="page-intro">Bring your favorite tools together with Trader6ix.</p>
          <ConnectWalletButton variant="orange" size="hero">
            Get Started
          </ConnectWalletButton>
        </div>
        <CTA connect />
      </main>
    </SiteLayout>
  );
}
