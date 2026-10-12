import type { Metadata } from "next";
import { SpotPage } from "@/components/trader6ix/app-pages";

export const metadata: Metadata = {
  title: "Spot Swap — Trader6ix",
  description: "Swap tokens instantly on Arc Testnet with Trader6ix spot trading.",
};

export default function SpotRoute() {
  return <SpotPage />;
}
