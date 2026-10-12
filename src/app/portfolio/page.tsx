import type { Metadata } from "next";
import { PortfolioPage } from "@/components/trader6ix/app-pages";

export const metadata: Metadata = {
  title: "Portfolio — Trader6ix",
  description: "Track wallet value, risk score and transactions in your Trader6ix portfolio.",
};

export default function PortfolioRoute() {
  return <PortfolioPage />;
}
