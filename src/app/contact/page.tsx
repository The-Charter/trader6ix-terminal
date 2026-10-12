import type { Metadata } from "next";
import { SiteLayout } from "@/components/trader6ix/site-layout";
import { ContactPage } from "@/components/trader6ix/forms";

export const metadata: Metadata = {
  title: "Contact Us — Trader6ix",
  description: "Get in touch with the Trader6ix team for your questions and a quote.",
};

export default function ContactRoute() {
  return (
    <SiteLayout>
      <ContactPage />
    </SiteLayout>
  );
}
