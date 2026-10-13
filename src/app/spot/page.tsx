import type { Metadata } from "next";
import { SpotPage } from "@/components/trader6ix/app-pages";
import { ARC_CHAIN_NAME } from "@/lib/arc-network";

export const metadata: Metadata = {
  title: "Spot Swap — Trader6ix",
  description: `Swap tokens instantly on ${ARC_CHAIN_NAME} with Trader6ix spot trading.`,
};

export default function SpotRoute() {
  return <SpotPage />;
}
