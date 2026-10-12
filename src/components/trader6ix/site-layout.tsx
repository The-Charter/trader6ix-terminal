"use client";

import { usePathname } from "next/navigation";
import { SiteHeader, SiteFooter } from "@/components/trader6ix/site-shell";
import { usePageReveal } from "@/components/trader6ix/page-reveal";
import { BackToTop } from "@/components/trader6ix/sections";

export function SiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  usePageReveal(pathname);
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
      <BackToTop />
    </>
  );
}
