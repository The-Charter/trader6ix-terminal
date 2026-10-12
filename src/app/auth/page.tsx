import type { Metadata } from "next";
import { SignInPage } from "@/components/trader6ix/signin-page";

export const metadata: Metadata = {
  title: "Sign In — Trader6ix",
  description:
    "Sign in to your Trader6ix account to access your trading dashboard and market analytics tools.",
};

export default function AuthPage() {
  return <SignInPage />;
}
