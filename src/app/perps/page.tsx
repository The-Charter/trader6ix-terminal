import type { Metadata } from "next";
import { PerpsPage } from "@/components/trader6ix/app-pages";

export const metadata: Metadata = {
  title: "Perpetual Trading — Trader6ix",
  description: "Trade BTC perpetuals with leverage, order book and TP/SL on Trader6ix.",
};

export default function PerpsRoute() {
  return <PerpsPage />;
}
